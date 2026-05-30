import { adminDb } from "./prismaAdmin"

// ─── Sensitive key sanitizer ──────────────────────────────────────────────────

const SENSITIVE_KEYS = new Set([
  "code", "codehash", "token", "tokenhash",
  "password", "secret", "jwt", "authorization",
  "codeHash", "tokenHash",   // camelCase variants
])

const MAX_VALUE_LENGTH = 500

/**
 * Рекурсивно удаляет чувствительные ключи и обрезает длинные строки.
 * Никогда не мутирует оригинальный объект.
 */
function sanitizeMetadata(value: unknown, depth = 0): unknown {
  if (depth > 8) return "[truncated]"

  if (typeof value === "string") {
    return value.length > MAX_VALUE_LENGTH
      ? value.slice(0, MAX_VALUE_LENGTH) + "…"
      : value
  }

  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => sanitizeMetadata(item, depth + 1))
  }

  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) continue
      result[key] = sanitizeMetadata(val, depth + 1)
    }
    return result
  }

  return value
}

// ─── Audit writer ─────────────────────────────────────────────────────────────

export type AuditParams = {
  actorId?:    string | null
  action:      string
  targetType?: string | null
  targetId?:   string | null
  metadata?:   Record<string, unknown> | null
  ip?:         string | null
  userAgent?:  string | null
}

/**
 * Записывает событие в AdminAuditLog.
 * НИКОГДА не бросает исключение наружу — audit не должен ломать основной flow.
 * Metadata проходит санитайзер перед записью.
 */
export async function writeAudit(params: AuditParams): Promise<void> {
  try {
    const sanitized = params.metadata
      ? (sanitizeMetadata(params.metadata) as Record<string, unknown>)
      : null

    await adminDb.adminAuditLog.create({
      data: {
        actorId:    params.actorId    ?? null,
        action:     params.action,
        targetType: params.targetType ?? null,
        targetId:   params.targetId   ?? null,
        metadata:   sanitized,
        ip:         params.ip         ?? null,
        userAgent:  params.userAgent  ?? null,
      },
    })
  } catch (err) {
    // Логируем только тип ошибки, без данных запроса
    console.error("[audit] Failed to write audit log:", (err as Error).message)
  }
}

// ─── Audit action constants ───────────────────────────────────────────────────

export const AuditAction = {
  // Auth
  ADMIN_LOGIN_SUCCESS:        "ADMIN_LOGIN_SUCCESS",
  ADMIN_LOGIN_FAILED:         "ADMIN_LOGIN_FAILED",
  ADMIN_LOGOUT:               "ADMIN_LOGOUT",
  // Staff management
  ADMIN_STAFF_CREATED:        "ADMIN_STAFF_CREATED",
  ADMIN_STAFF_ROLE_CHANGED:   "ADMIN_STAFF_ROLE_CHANGED",
  ADMIN_STAFF_CODE_RESET:     "ADMIN_STAFF_CODE_RESET",
  ADMIN_STAFF_SUSPENDED:      "ADMIN_STAFF_SUSPENDED",
  ADMIN_STAFF_ACTIVATED:      "ADMIN_STAFF_ACTIVATED",
  ADMIN_STAFF_REVOKED:        "ADMIN_STAFF_REVOKED",
  // Moderation & users
  ADMIN_LISTING_APPROVED:     "ADMIN_LISTING_APPROVED",
  ADMIN_LISTING_REJECTED:     "ADMIN_LISTING_REJECTED",
  ADMIN_WANT_TO_BUY_APPROVED: "ADMIN_WANT_TO_BUY_APPROVED",
  ADMIN_WANT_TO_BUY_REJECTED: "ADMIN_WANT_TO_BUY_REJECTED",
  ADMIN_WANT_TO_BUY_CLOSED:   "ADMIN_WANT_TO_BUY_CLOSED",
  ADMIN_USER_BLOCKED:         "ADMIN_USER_BLOCKED",
  ADMIN_USER_UNBLOCKED:       "ADMIN_USER_UNBLOCKED",
  ADMIN_USER_RESTRICTED:      "ADMIN_USER_RESTRICTED",
  ADMIN_USER_UNRESTRICTED:    "ADMIN_USER_UNRESTRICTED",
  ADMIN_USER_CHATS_LIST_VIEWED:       "ADMIN_USER_CHATS_LIST_VIEWED",
  ADMIN_USER_CHAT_CONVERSATION_VIEWED:"ADMIN_USER_CHAT_CONVERSATION_VIEWED",
  ADMIN_REPORT_STATUS_CHANGED:"ADMIN_REPORT_STATUS_CHANGED",
  // Support
  ADMIN_SUPPORT_CONVERSATIONS_VIEWED: "ADMIN_SUPPORT_CONVERSATIONS_VIEWED",
  ADMIN_SUPPORT_REPLY_SENT:           "ADMIN_SUPPORT_REPLY_SENT",
  // Settings
  ADMIN_SETTINGS_VIEWED:              "ADMIN_SETTINGS_VIEWED",
  ADMIN_SETTINGS_UPDATED:             "ADMIN_SETTINGS_UPDATED",
  // Business CRM
  ADMIN_BUSINESS_CLIENT_CREATED:      "ADMIN_BUSINESS_CLIENT_CREATED",
  // Access control
  ADMIN_PERMISSION_DENIED:    "ADMIN_PERMISSION_DENIED",
  // Bootstrap
  ADMIN_OWNER_BOOTSTRAP:      "ADMIN_OWNER_BOOTSTRAP",
} as const satisfies Record<string, string>

export type AuditAction = typeof AuditAction[keyof typeof AuditAction]
