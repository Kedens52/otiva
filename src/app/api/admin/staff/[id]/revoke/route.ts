import { NextRequest, NextResponse } from "next/server"
import { withAdminApi } from "@/lib/admin/guards"
import { adminDb } from "@/lib/admin/prismaAdmin"
import { guardLastOwner } from "@/lib/admin/staffGuards"
import { revokeAllSessionsForStaff } from "@/lib/admin/adminSession"
import { writeAudit, AuditAction } from "@/lib/admin/audit"
import { extractIp, extractUA } from "@/lib/admin/getRequestMeta"
import { AdminForbiddenError } from "@/lib/admin/errors"

export const dynamic = 'force-dynamic'

export const PATCH = withAdminApi(async ({ staff, req }): Promise<NextResponse> => {
  const targetId = req.nextUrl.pathname.split("/").at(-2) ?? ""

  if (targetId === staff.id) {
    throw new AdminForbiddenError("Нельзя отозвать собственный аккаунт")
  }

  const target = await adminDb.staffAccount.findUnique({ where: { id: targetId } })
  if (!target) {
    return NextResponse.json({ error: "Сотрудник не найден" }, { status: 404 })
  }

  if (target.status === "REVOKED") {
    return NextResponse.json({ error: "Уже отозван" }, { status: 409 })
  }

  // Нельзя отозвать последнего активного OWNER
  await guardLastOwner(targetId, "Нельзя отозвать последнего Владельца")

  await adminDb.staffAccount.update({
    where: { id: targetId },
    data: {
      status:    "REVOKED",
      revokedAt: new Date(),
    },
  })

  await revokeAllSessionsForStaff(targetId)

  await writeAudit({
    actorId:    staff.id,
    action:     AuditAction.ADMIN_STAFF_REVOKED,
    targetType: "StaffAccount",
    targetId,
    metadata:   { login: target.login, role: target.role },
    ip:         extractIp(req),
    userAgent:  extractUA(req),
  })

  return NextResponse.json({ ok: true })
}, "staff.revoke")

