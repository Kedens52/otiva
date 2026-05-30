import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminApi } from "@/lib/admin/guards"
import { writeAudit, AuditAction } from "@/lib/admin/audit"
import { extractIp, extractUA } from "@/lib/admin/getRequestMeta"
import { recalculateUserTrust, addUserTrustEvent } from "@/lib/user-trust-engine"

export const dynamic = "force-dynamic"

function userIdFromPath(pathname: string): string | null {
  const m = pathname.match(/\/api\/admin\/users\/([^/]+)\/unrestrict/)
  return m?.[1] ?? null
}

export const POST = withAdminApi(async ({ staff, req }) => {
  const id = userIdFromPath(req.nextUrl.pathname)
  if (!id) return NextResponse.json({ error: "Неверный путь" }, { status: 400 })

  try {
    await prisma.user.update({
      where: { id },
      data: { accountRestricted: false },
    })
    await addUserTrustEvent(id, "ADMIN_ACCOUNT_UNRESTRICTED", {
      reason: "Снято ограничение с админки",
      metadata: { staffId: staff.id },
    })
    await recalculateUserTrust(id)
    await writeAudit({
      actorId: staff.id,
      action: AuditAction.ADMIN_USER_UNRESTRICTED,
      targetType: "User",
      targetId: id,
      metadata: {},
      ip: extractIp(req),
      userAgent: extractUA(req),
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("admin unrestrict", e)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}, "users.edit")
