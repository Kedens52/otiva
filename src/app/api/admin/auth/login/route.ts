import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { adminDb } from "@/lib/admin/prismaAdmin"
import { verifyStaffCode, dummyVerify } from "@/lib/admin/staffCode"
import { createAdminSession } from "@/lib/admin/adminSession"
import { checkLoginRateLimit, resetLoginRateLimit } from "@/lib/admin/rateLimit"
import { writeAudit, AuditAction } from "@/lib/admin/audit"
import { extractIp, extractUA } from "@/lib/admin/getRequestMeta"
import { AdminLockedError } from "@/lib/admin/errors"
import { safeAdminRedirectPath } from "@/lib/admin/safe-redirect"

const bodySchema = z.object({
  login: z.string().min(1).max(64),
  code:  z.string().min(8).max(32),
  next:  z.string().max(256).optional(),
})

// Нейтральные сообщения — не раскрывают причину отказа
const MSG_INVALID = "Неверный логин или код"
const MSG_LOCKED  = "Вход временно ограничен. Попробуйте позже."

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = extractIp(req)
  const ua = extractUA(req)

  // ── 1. Парсим тело ────────────────────────────────────────────────────────
  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: MSG_INVALID }, { status: 401 })
  }

  const { login, code } = body

  // ── 2. Rate limit (IP + login) ────────────────────────────────────────────
  const rl = checkLoginRateLimit(ip, login)
  if (rl.limited) {
    return NextResponse.json({ error: MSG_LOCKED }, { status: 429 })
  }

  // ── 3. Ищем аккаунт ───────────────────────────────────────────────────────
  const staff = await adminDb.staffAccount.findUnique({
    where: { login },
  })

  // Аккаунт не найден — constant-time dummyVerify, нейтральный ответ
  if (!staff) {
    await dummyVerify()
    return NextResponse.json({ error: MSG_INVALID }, { status: 401 })
  }

  // Аккаунт не активен — constant-time dummyVerify, нейтральный ответ
  if (staff.status !== "ACTIVE") {
    await dummyVerify()
    return NextResponse.json({ error: MSG_INVALID }, { status: 401 })
  }

  // ── 4. Проверяем lockedUntil ──────────────────────────────────────────────
  if (staff.lockedUntil && staff.lockedUntil > new Date()) {
    await writeAudit({
      actorId:   staff.id,
      action:    AuditAction.ADMIN_LOGIN_FAILED,
      metadata:  { reason: "account_locked" },
      ip,
      userAgent: ua,
    })
    return NextResponse.json({ error: MSG_LOCKED }, { status: 429 })
  }

  // ── 5. Верифицируем код ───────────────────────────────────────────────────
  const codeOk = await verifyStaffCode(code, staff.codeHash)

  if (!codeOk) {
    const newAttempts = staff.failedAttempts + 1
    const lockout     = newAttempts >= 5

    await adminDb.staffAccount.update({
      where: { id: staff.id },
      data: {
        failedAttempts: newAttempts,
        ...(lockout ? { lockedUntil: new Date(Date.now() + 15 * 60 * 1000) } : {}),
      },
    })

    await writeAudit({
      actorId:   staff.id,
      action:    AuditAction.ADMIN_LOGIN_FAILED,
      metadata:  { attempts: newAttempts, locked: lockout },
      ip,
      userAgent: ua,
    })

    if (lockout) {
      return NextResponse.json({ error: MSG_LOCKED }, { status: 429 })
    }
    return NextResponse.json({ error: MSG_INVALID }, { status: 401 })
  }

  // ── 6. Успешный вход ──────────────────────────────────────────────────────
  await adminDb.staffAccount.update({
    where: { id: staff.id },
    data: {
      failedAttempts: 0,
      lockedUntil:    null,
      lastLoginAt:    new Date(),
      lastLoginIp:    ip,
      lastUserAgent:  ua,
    },
  })

  resetLoginRateLimit(ip, login)

  await createAdminSession(
    { id: staff.id, role: staff.role, status: staff.status },
    req,
  )

  await writeAudit({
    actorId:   staff.id,
    action:    AuditAction.ADMIN_LOGIN_SUCCESS,
    metadata:  { role: staff.role },
    ip,
    userAgent: ua,
  })

  return NextResponse.json({
    ok:         true,
    redirectTo: safeAdminRedirectPath(body.next, "/admin/dashboard"),
  })
}
