import type { NextRequest } from "next/server"
import { adminDb } from "@/lib/admin/prismaAdmin"
import { verifyStaffCode, dummyVerify } from "@/lib/admin/staffCode"
import { checkLoginRateLimit, resetLoginRateLimit } from "@/lib/admin/rateLimit"
import { writeAudit, AuditAction } from "@/lib/admin/audit"
import { extractIp, extractUA } from "@/lib/admin/getRequestMeta"
import type { StaffAccountRow } from "@/lib/admin/prismaAdmin"

export const STAFF_LOGIN_MSG_INVALID = "Неверный логин или код"
export const STAFF_LOGIN_MSG_LOCKED = "Вход временно ограничен. Попробуйте позже."

export type StaffLoginResult =
  | { ok: true; staff: StaffAccountRow }
  | { ok: false; status: 401 | 429; error: string }

export async function authenticateStaffLogin(
  req: NextRequest,
  login: string,
  code: string,
): Promise<StaffLoginResult> {
  const ip = extractIp(req)
  const ua = extractUA(req)

  const rl = checkLoginRateLimit(ip, login)
  if (rl.limited) {
    return { ok: false, status: 429, error: STAFF_LOGIN_MSG_LOCKED }
  }

  const staff = await adminDb.staffAccount.findUnique({ where: { login } })

  if (!staff) {
    await dummyVerify()
    return { ok: false, status: 401, error: STAFF_LOGIN_MSG_INVALID }
  }

  if (staff.status !== "ACTIVE") {
    await dummyVerify()
    return { ok: false, status: 401, error: STAFF_LOGIN_MSG_INVALID }
  }

  if (staff.lockedUntil && staff.lockedUntil > new Date()) {
    await writeAudit({
      actorId: staff.id,
      action: AuditAction.ADMIN_LOGIN_FAILED,
      metadata: { reason: "account_locked" },
      ip,
      userAgent: ua,
    })
    return { ok: false, status: 429, error: STAFF_LOGIN_MSG_LOCKED }
  }

  const codeOk = await verifyStaffCode(code, staff.codeHash)

  if (!codeOk) {
    const newAttempts = staff.failedAttempts + 1
    const lockout = newAttempts >= 5

    await adminDb.staffAccount.update({
      where: { id: staff.id },
      data: {
        failedAttempts: newAttempts,
        ...(lockout ? { lockedUntil: new Date(Date.now() + 15 * 60 * 1000) } : {}),
      },
    })

    await writeAudit({
      actorId: staff.id,
      action: AuditAction.ADMIN_LOGIN_FAILED,
      metadata: { attempts: newAttempts, locked: lockout },
      ip,
      userAgent: ua,
    })

    if (lockout) {
      return { ok: false, status: 429, error: STAFF_LOGIN_MSG_LOCKED }
    }
    return { ok: false, status: 401, error: STAFF_LOGIN_MSG_INVALID }
  }

  await adminDb.staffAccount.update({
    where: { id: staff.id },
    data: {
      failedAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: ip,
      lastUserAgent: ua,
    },
  })

  resetLoginRateLimit(ip, login)

  return { ok: true, staff }
}
