import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { withAdminApi } from "@/lib/admin/guards"
import { requireOwner } from "@/lib/admin/permissions"
import { adminDb } from "@/lib/admin/prismaAdmin"
import { guardLastOwner } from "@/lib/admin/staffGuards"
import { revokeAllSessionsForStaff } from "@/lib/admin/adminSession"
import { writeAudit, AuditAction } from "@/lib/admin/audit"
import { extractIp, extractUA } from "@/lib/admin/getRequestMeta"
import { AdminConflictError, AdminForbiddenError } from "@/lib/admin/errors"

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  role: z.enum(["OWNER", "ADMIN", "MODERATOR", "SUPPORT", "BUSINESS_MANAGER", "FINANCE"]),
})

export const PATCH = withAdminApi(async ({ staff, req }): Promise<NextResponse> => {
  const { id } = (req as NextRequest & { params?: { id?: string } }).params ?? {}
  const targetId = (req.nextUrl.pathname.split("/").at(-2)) ?? ""

  const body = bodySchema.parse(await req.json())

  // Нельзя менять свою роль
  if (targetId === staff.id) {
    throw new AdminForbiddenError("Нельзя изменить собственную роль")
  }

  const target = await adminDb.staffAccount.findUnique({ where: { id: targetId } })
  if (!target) {
    return NextResponse.json({ error: "Сотрудник не найден" }, { status: 404 })
  }

  // Менять роль OWNER → только OWNER
  if (target.role === "OWNER") {
    requireOwner(staff)
  }

  // Назначить OWNER → только OWNER + подтверждение
  if (body.role === "OWNER") {
    requireOwner(staff)
    if (req.headers.get("X-Confirm-Owner") !== "yes") {
      return NextResponse.json(
        { error: "Требуется заголовок X-Confirm-Owner: yes" },
        { status: 400 },
      )
    }
  }

  // Снять OWNER — проверяем что не последний
  if (target.role === "OWNER" && body.role !== "OWNER") {
    await guardLastOwner(targetId, "Нельзя снять роль последнего Владельца")
  }

  await adminDb.staffAccount.update({
    where: { id: targetId },
    data:  { role: body.role },
  })

  // При понижении роли — отзываем сессии (новые права сразу)
  await revokeAllSessionsForStaff(targetId)

  await writeAudit({
    actorId:    staff.id,
    action:     AuditAction.ADMIN_STAFF_ROLE_CHANGED,
    targetType: "StaffAccount",
    targetId,
    metadata:   { from: target.role, to: body.role },
    ip:         extractIp(req),
    userAgent:  extractUA(req),
  })

  return NextResponse.json({ ok: true, role: body.role })
}, "staff.updateRole")

