import { NextRequest, NextResponse } from "next/server"
import { ZodError } from "zod"
import { extractAdminBearerToken, getAdminSessionFromRequest } from "./adminSession"
import { requireAdminPermission, type Permission, type StaffContext } from "./permissions"
import { validateCsrf } from "./csrf"
import { writeAudit, AuditAction } from "./audit"
import {
  AdminUnauthorizedError,
  AdminForbiddenError,
  AdminLockedError,
  AdminConflictError,
} from "./errors"
import { extractIp, extractUA } from "./getRequestMeta"

// ─── Handler type ─────────────────────────────────────────────────────────────

export type AdminRouteContext = {
  staff: StaffContext & { id: string; login: string; displayName: string | null }
  req:   NextRequest
}

type AdminHandler = (ctx: AdminRouteContext) => Promise<NextResponse>

// ─── Error → Response mapper ──────────────────────────────────────────────────

function errorResponse(err: unknown, req: NextRequest): NextResponse {
  if (err instanceof AdminUnauthorizedError) {
    return NextResponse.json({ error: err.message }, { status: 401 })
  }
  if (err instanceof AdminForbiddenError) {
    return NextResponse.json({ error: err.message }, { status: 403 })
  }
  if (err instanceof AdminLockedError) {
    return NextResponse.json({ error: err.message }, { status: 429 })
  }
  if (err instanceof AdminConflictError) {
    return NextResponse.json({ error: err.message }, { status: 409 })
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: err.errors[0]?.message ?? "Ошибка валидации" },
      { status: 400 },
    )
  }

  // Неизвестная ошибка — логируем без чувствительных данных
  console.error(
    "[admin-api] Unhandled error:",
    (err as Error).name,
    (err as Error).message,
    "path:", req.nextUrl.pathname,
  )
  return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 })
}

// ─── withAdminApi ─────────────────────────────────────────────────────────────

/**
 * Обёртка для admin route handlers.
 * Порядок проверок:
 *   1. getAdminSession (cookie → sha256 → БД → staff.status)
 *   2. requireAdminPermission (если задан requiredPermission)
 *   3. validateCsrf (для не-GET запросов)
 *   4. вызов handler
 *   5. catch → errorResponse
 *
 * Usage:
 *   export const GET = withAdminApi(async ({ staff, req }) => { ... }, "staff.view")
 */
export function withAdminApi(
  handler:            AdminHandler,
  requiredPermission?: Permission,
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // 1. Проверка сессии (cookie или Bearer для мобильного приложения)
      const ctx = await getAdminSessionFromRequest(req)
      if (!ctx) throw new AdminUnauthorizedError()

      const { staff, session } = ctx

      // 2. Проверка разрешения
      if (requiredPermission) {
        if (!hasPermissionSafe(staff, requiredPermission)) {
          await writeAudit({
            actorId:    staff.id,
            action:     AuditAction.ADMIN_PERMISSION_DENIED,
            metadata:   { permission: requiredPermission, path: req.nextUrl.pathname },
            ip:         extractIp(req),
            userAgent:  extractUA(req),
          })
          throw new AdminForbiddenError(`Требуется разрешение: ${requiredPermission}`)
        }
      }

      // 3. CSRF (не-GET) — Bearer-токен заменяет CSRF для мобильного клиента
      if (!extractAdminBearerToken(req)) {
        validateCsrf(req)
      }

      // 4. Вызов handler
      return await handler({
        staff: {
          id:          staff.id,
          login:       staff.login,
          displayName: staff.displayName,
          role:        staff.role,
          status:      staff.status,
        },
        req,
      })
    } catch (err) {
      return errorResponse(err, req)
    }
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

import { hasAdminPermission } from "./permissions"

function hasPermissionSafe(
  staff: StaffContext,
  permission: Permission,
): boolean {
  try {
    return hasAdminPermission(staff, permission)
  } catch {
    return false
  }
}

// ─── requireAdminPermission re-export для server components ───────────────────
export { requireAdminPermission }
