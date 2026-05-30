import { randomBytes, createHash } from "crypto"
import { cookies } from "next/headers"
import type { NextRequest } from "next/server"
import { adminDb, type AdminSessionRow, type StaffAccountRow } from "./prismaAdmin"
import { AdminUnauthorizedError } from "./errors"
import { extractIp, extractUA } from "./getRequestMeta"
import type { StaffRole, StaffStatus } from "./types"

// ─── Constants ────────────────────────────────────────────────────────────────

export const ADMIN_SESSION_COOKIE  = "nashlo_admin_session"
export const ADMIN_CSRF_COOKIE     = "nashlo_admin_csrf"
const SESSION_TTL_MS               = 8 * 60 * 60 * 1000   // 8 часов

const IS_PROD = process.env.NODE_ENV === "production"

const SESSION_COOKIE_OPTIONS = {
  httpOnly:  true,
  secure:    IS_PROD,
  sameSite:  "strict" as const,
  path:      "/",
  maxAge:    SESSION_TTL_MS / 1000,
}
const LAST_USED_TOUCH_INTERVAL_MS = 5 * 60 * 1000

const CSRF_COOKIE_OPTIONS = {
  httpOnly:  false,   // читается JS на клиенте
  secure:    IS_PROD,
  sameSite:  "strict" as const,
  path:      "/",
  maxAge:    SESSION_TTL_MS / 1000,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sha256hex(input: string): string {
  return createHash("sha256").update(input).digest("hex")
}

function generateToken(): string {
  return randomBytes(32).toString("base64url")
}

function generateCsrfToken(): string {
  return randomBytes(24).toString("base64url")
}

// ─── Public types ─────────────────────────────────────────────────────────────

export type ActiveStaff = Pick<
  StaffAccountRow,
  "id" | "login" | "displayName" | "role" | "status"
>

export type AdminSessionContext = {
  staff:   ActiveStaff
  session: Pick<AdminSessionRow, "id" | "expiresAt">
}

// ─── Session management ───────────────────────────────────────────────────────

/** Удаляет устаревшую CSRF-cookie с path=/admin (не уходит на /api/admin/*). */
export function clearLegacyAdminCsrfCookie(): void {
  const cookieStore = cookies()
  cookieStore.set(ADMIN_CSRF_COOKIE, "", { ...CSRF_COOKIE_OPTIONS, path: "/admin", maxAge: 0 })
}

/**
 * Создаёт AdminSession в БД, устанавливает httpOnly cookie и CSRF cookie.
 * Вызывается только после успешной аутентификации.
 */

export function extractAdminBearerToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization")
  if (!header?.startsWith("Bearer ")) return null
  const token = header.slice(7).trim()
  return token.length >= 32 ? token : null
}

async function createSessionRecord(
  staff: { id: string; role: StaffRole; status: StaffStatus },
  req: NextRequest,
): Promise<{ token: string; session: AdminSessionRow; expiresAt: Date }> {
  const token = generateToken()
  const tokenHash = sha256hex(token)
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

  const session = await adminDb.adminSession.create({
    data: {
      staffId: staff.id,
      tokenHash,
      ip: extractIp(req),
      userAgent: extractUA(req),
      lastUsedAt: new Date(),
      expiresAt,
    },
  })

  return { token, session, expiresAt }
}

async function resolveSessionFromToken(token: string): Promise<AdminSessionContext | null> {
  const tokenHash = sha256hex(token)

  const session = await adminDb.adminSession.findUnique({
    where: { tokenHash },
    include: { staff: true },
  })

  if (!session) return null
  if (session.revokedAt) return null
  if (session.expiresAt < new Date()) return null
  if (session.staff.status !== "ACTIVE") return null

  const now = Date.now()
  const lastUsedMs = session.lastUsedAt?.getTime() ?? 0
  if (now - lastUsedMs > LAST_USED_TOUCH_INTERVAL_MS) {
    await adminDb.adminSession.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date(now) },
    })
  }

  return {
    staff: {
      id: session.staff.id,
      login: session.staff.login,
      displayName: session.staff.displayName,
      role: session.staff.role,
      status: session.staff.status,
    },
    session: {
      id: session.id,
      expiresAt: session.expiresAt,
    },
  }
}

/** Сессия для мобильного приложения: токен в JSON, без cookie. */
export async function createAdminBearerSession(
  staff: { id: string; role: StaffRole; status: StaffStatus },
  req: NextRequest,
): Promise<{ accessToken: string; expiresAt: string; context: AdminSessionContext }> {
  const { token, session, expiresAt } = await createSessionRecord(staff, req)
  const fullStaff = await adminDb.staffAccount.findUnique({
    where: { id: staff.id },
    select: { id: true, login: true, displayName: true, role: true, status: true },
  })
  return {
    accessToken: token,
    expiresAt: expiresAt.toISOString(),
    context: {
      staff: fullStaff ?? {
        id: staff.id,
        login: "",
        displayName: null,
        role: staff.role,
        status: staff.status,
      },
      session: { id: session.id, expiresAt },
    },
  }
}

export async function createAdminSession(
  staff: { id: string; role: StaffRole; status: StaffStatus },
  req:   NextRequest,
): Promise<AdminSessionContext> {
  const { token, session, expiresAt } = await createSessionRecord(staff, req)
  const csrfToken = generateCsrfToken()

  const cookieStore = cookies()
  clearLegacyAdminCsrfCookie()
  cookieStore.set(ADMIN_SESSION_COOKIE, token,     SESSION_COOKIE_OPTIONS)
  cookieStore.set(ADMIN_CSRF_COOKIE,    csrfToken, CSRF_COOKIE_OPTIONS)

  const fullStaff = await adminDb.staffAccount.findUnique({
    where: { id: staff.id },
    select: { id: true, login: true, displayName: true, role: true, status: true },
  })

  return {
    staff: fullStaff ?? { id: staff.id, login: "", displayName: null, role: staff.role, status: staff.status },
    session: { id: session.id, expiresAt },
  }
}

/** Cookie (RSC) или Bearer (мобильное API). */
export async function getAdminSessionFromRequest(req: NextRequest): Promise<AdminSessionContext | null> {
  const bearer = extractAdminBearerToken(req)
  if (bearer) return resolveSessionFromToken(bearer)
  const cookieToken = req.cookies.get(ADMIN_SESSION_COOKIE)?.value
  if (!cookieToken) return null
  return resolveSessionFromToken(cookieToken)
}

export async function revokeAdminSessionFromRequest(req: NextRequest): Promise<void> {
  const bearer = extractAdminBearerToken(req)
  const cookieToken = req.cookies.get(ADMIN_SESSION_COOKIE)?.value
  const token = bearer ?? cookieToken
  if (token) {
    const tokenHash = sha256hex(token)
    const session = await adminDb.adminSession.findUnique({ where: { tokenHash } })
    if (session && !session.revokedAt) {
      await adminDb.adminSession.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      })
    }
  }
  if (!bearer) clearAdminSessionCookie()
}

/**
 * Читает и валидирует текущую admin-сессию.
 * Полная проверка (БД + статус сотрудника) — только в route handlers/server components.
 * Middleware проверяет лишь наличие cookie (без БД — Edge ограничения).
 * Возвращает null если сессия отсутствует, истекла, отозвана или сотрудник неактивен.
 */
export async function getAdminSession(): Promise<AdminSessionContext | null> {
  const cookieStore = cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  if (!token) return null
  return resolveSessionFromToken(token)
}

/**
 * Возвращает сессию или кидает AdminUnauthorizedError.
 */
export async function requireAdminSession(): Promise<AdminSessionContext> {
  const ctx = await getAdminSession()
  if (!ctx) throw new AdminUnauthorizedError()
  return ctx
}

/**
 * Отзывает текущую сессию (по cookie) и удаляет оба cookie.
 */
export async function revokeAdminSession(): Promise<void> {
  const cookieStore = cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value

  if (token) {
    const tokenHash = sha256hex(token)
    const session = await adminDb.adminSession.findUnique({
      where:   { tokenHash },
      include: { staff: true },
    })
    if (session && !session.revokedAt) {
      await adminDb.adminSession.update({
        where: { id: session.id },
        data:  { revokedAt: new Date() },
      })
    }
  }

  clearAdminSessionCookie()
}

/**
 * Отзывает все активные сессии сотрудника (при смене кода, suspend, revoke).
 */
export async function revokeAllSessionsForStaff(staffId: string): Promise<void> {
  await adminDb.adminSession.updateMany({
    where: { staffId, revokedAt: null },
    data:  { revokedAt: new Date() },
  })
}

/**
 * Удаляет session и CSRF cookie без обращения к БД.
 * Используется после revokeAdminSession или при ошибках.
 */
export function clearAdminSessionCookie(): void {
  const cookieStore = cookies()
  cookieStore.set(ADMIN_SESSION_COOKIE, "", { ...SESSION_COOKIE_OPTIONS, maxAge: 0 })
  cookieStore.set(ADMIN_CSRF_COOKIE,    "", { ...CSRF_COOKIE_OPTIONS,    maxAge: 0 })
  cookieStore.set(ADMIN_CSRF_COOKIE,    "", { ...CSRF_COOKIE_OPTIONS, path: "/admin", maxAge: 0 })
}
