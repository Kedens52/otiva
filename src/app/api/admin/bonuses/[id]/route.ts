import { NextResponse } from "next/server"
import { z } from "zod"
import { withAdminApi } from "@/lib/admin/guards"
import { setBonusTransactionStatus } from "@/lib/bonuses/service"

export const dynamic = "force-dynamic"

const schema = z.object({
  action: z.enum(["approve", "reject", "reverse"]),
})

function txIdFromPath(pathname: string): string | null {
  const m = pathname.match(/\/api\/admin\/bonuses\/([^/]+)/)
  return m?.[1] ?? null
}

export const PATCH = withAdminApi(async ({ req }) => {
  const id = txIdFromPath(req.nextUrl.pathname)
  if (!id) return NextResponse.json({ error: "Неверный путь" }, { status: 400 })

  const body = schema.parse(await req.json())
  const result = await setBonusTransactionStatus(id, body.action)
  if (!result.ok) {
    return NextResponse.json({ error: result.message ?? "Ошибка" }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}, "users.view")
