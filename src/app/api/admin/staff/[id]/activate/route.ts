import { NextRequest, NextResponse } from "next/server"
import { withAdminApi } from "@/lib/admin/guards"
import { adminDb } from "@/lib/admin/prismaAdmin"
import { writeAudit, AuditAction } from "@/lib/admin/audit"
import { extractIp, extractUA } from "@/lib/admin/getRequestMeta"

export const dynamic = 'force-dynamic'

export const PATCH = withAdminApi(async ({ staff, req }): Promise<NextResponse> => {
  const targetId = req.nextUrl.pathname.split("/").at(-2) ?? ""

  const target = await adminDb.staffAccount.findUnique({ where: { id: targetId } })
  if (!target) {
    return NextResponse.json({ error: "Сотрудник не найден" }, { status: 404 })
  }

  if (target.status === "REVOKED") {
    return NextResponse.json({ error: "Нельзя восстановить отозванного сотрудника" }, { status: 409 })
  }

  if (target.status === "ACTIVE") {
    return NextResponse.json({ error: "Уже активен" }, { status: 409 })
  }

  await adminDb.staffAccount.update({
    where: { id: targetId },
    data:  { status: "ACTIVE" },
  })

  await writeAudit({
    actorId:    staff.id,
    action:     AuditAction.ADMIN_STAFF_ACTIVATED,
    targetType: "StaffAccount",
    targetId,
    metadata:   { login: target.login, role: target.role },
    ip:         extractIp(req),
    userAgent:  extractUA(req),
  })

  return NextResponse.json({ ok: true })
}, "staff.activate")

