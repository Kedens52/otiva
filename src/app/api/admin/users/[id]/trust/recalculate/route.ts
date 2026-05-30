import { NextResponse } from "next/server"
import { withAdminApi } from "@/lib/admin/guards"
import { recalculateUserTrust } from "@/lib/user-trust-engine"

export const dynamic = "force-dynamic"

function userIdFromPath(pathname: string): string | null {
  const m = pathname.match(/\/api\/admin\/users\/([^/]+)\/trust\/recalculate/)
  return m?.[1] ?? null
}

export const POST = withAdminApi(async ({ req }) => {
  const id = userIdFromPath(req.nextUrl.pathname)
  if (!id) return NextResponse.json({ error: "Неверный путь" }, { status: 400 })

  try {
    await recalculateUserTrust(id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("admin trust recalculate", e)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}, "users.edit")
