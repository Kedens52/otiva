import { NextRequest, NextResponse } from "next/server"
import { withAdminApi } from "@/lib/admin/guards"
import { requireOwner, hasAdminPermission } from "@/lib/admin/permissions"
import { adminDb } from "@/lib/admin/prismaAdmin"
import { generateStaffCode } from "@/lib/admin/generateStaffCode"
import { hashStaffCode } from "@/lib/admin/staffCode"
import { revokeAllSessionsForStaff } from "@/lib/admin/adminSession"
import { writeAudit, AuditAction } from "@/lib/admin/audit"
import { extractIp, extractUA } from "@/lib/admin/getRequestMeta"
import { AdminForbiddenError } from "@/lib/admin/errors"

export const dynamic = 'force-dynamic'

export const PATCH = withAdminApi(async ({ staff, req }): Promise<NextResponse> => {
  const targetId = req.nextUrl.pathname.split("/").at(-2) ?? ""

  const target = await adminDb.staffAccount.findUnique({ where: { id: targetId } })
  if (!target) {
    return NextResponse.json({ error: "Сотрудник не найден" }, { status: 404 })
  }

  // Сбросить код OWNER → только OWNER сам себе или другой OWNER
  if (target.role === "OWNER") {
    requireOwner(staff)
  }

  // Для не-OWNER достаточно staff.resetCode
  // (withAdminApi уже проверил "staff.resetCode")

  const code     = generateStaffCode()
  const codeHash = await hashStaffCode(code)

  await adminDb.staffAccount.update({
    where: { id: targetId },
    data: {
      codeHash,
      codeChangedAt:  new Date(),
      failedAttempts: 0,
      lockedUntil:    null,
    },
  })

  await revokeAllSessionsForStaff(targetId)

  await writeAudit({
    actorId:    staff.id,
    action:     AuditAction.ADMIN_STAFF_CODE_RESET,
    targetType: "StaffAccount",
    targetId,
    metadata:   { login: target.login },
    ip:         extractIp(req),
    userAgent:  extractUA(req),
  })

  return NextResponse.json({
    ok:   true,
    code, // единственный показ
  })
}, "staff.resetCode")

