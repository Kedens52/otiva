import { StaffRole, StaffStatus } from "./types"
import { AdminForbiddenError } from "./errors"

// ─── Permission literals ──────────────────────────────────────────────────────

export type Permission =
  | "admin.access"
  | "dashboard.view"
  | "staff.view"
  | "staff.create"
  | "staff.updateRole"
  | "staff.resetCode"
  | "staff.suspend"
  | "staff.activate"
  | "staff.revoke"
  | "listings.view"
  | "listings.moderate"
  | "listings.delete"
  | "listings.restore"
  | "reports.view"
  | "reports.resolve"
  | "users.view"
  | "users.viewSensitive"
  | "users.viewChats"
  | "users.ban"
  | "users.edit"
  | "support.view"
  | "support.reply"
  | "support.internalNotes"
  | "support.quickReplies.manage"
  | "business.view"
  | "business.create"
  | "business.edit"
  | "business.assign"
  | "business.notes"
  | "business.deals"
  | "business.packages.view"
  | "business.packages.request"
  | "business.packages.manage"
  | "payments.view"
  | "payments.export"
  | "payments.refund"
  | "settings.view"
  | "settings.manage"
  | "legal.view"
  | "legal.manage"
  | "audit.view"
  | "activity.view"
  | "b2b.companies.view"
  | "b2b.companies.moderate"
  | "b2b.listings.view"
  | "b2b.listings.moderate"
  | "b2b.documents.view"

export const PERMISSIONS: Record<Permission, Permission> = {
  "admin.access":              "admin.access",
  "dashboard.view":            "dashboard.view",
  "staff.view":                "staff.view",
  "staff.create":              "staff.create",
  "staff.updateRole":          "staff.updateRole",
  "staff.resetCode":           "staff.resetCode",
  "staff.suspend":             "staff.suspend",
  "staff.activate":            "staff.activate",
  "staff.revoke":              "staff.revoke",
  "listings.view":             "listings.view",
  "listings.moderate":         "listings.moderate",
  "listings.delete":           "listings.delete",
  "listings.restore":          "listings.restore",
  "reports.view":              "reports.view",
  "reports.resolve":           "reports.resolve",
  "users.view":                "users.view",
  "users.viewSensitive":       "users.viewSensitive",
  "users.viewChats":           "users.viewChats",
  "users.ban":                 "users.ban",
  "users.edit":                "users.edit",
  "support.view":              "support.view",
  "support.reply":             "support.reply",
  "support.internalNotes":     "support.internalNotes",
  "support.quickReplies.manage": "support.quickReplies.manage",
  "business.view":             "business.view",
  "business.create":           "business.create",
  "business.edit":             "business.edit",
  "business.assign":           "business.assign",
  "business.notes":            "business.notes",
  "business.deals":            "business.deals",
  "business.packages.view":    "business.packages.view",
  "business.packages.request": "business.packages.request",
  "business.packages.manage":  "business.packages.manage",
  "payments.view":             "payments.view",
  "payments.export":           "payments.export",
  "payments.refund":           "payments.refund",
  "settings.view":             "settings.view",
  "settings.manage":           "settings.manage",
  "legal.view":                "legal.view",
  "legal.manage":              "legal.manage",
  "audit.view":                "audit.view",
  "activity.view":             "activity.view",
  "b2b.companies.view":        "b2b.companies.view",
  "b2b.companies.moderate":    "b2b.companies.moderate",
  "b2b.listings.view":         "b2b.listings.view",
  "b2b.listings.moderate":     "b2b.listings.moderate",
  "b2b.documents.view":        "b2b.documents.view",
}

// ─── Role → Permission matrix ─────────────────────────────────────────────────

const ADMIN_PERMISSIONS: Permission[] = [
  "admin.access", "dashboard.view",
  "staff.view", "staff.create", "staff.updateRole", "staff.resetCode",
  "staff.suspend", "staff.activate", "staff.revoke",
  "listings.view", "listings.moderate", "listings.delete", "listings.restore",
  "reports.view", "reports.resolve",
  "users.view", "users.viewSensitive", "users.viewChats", "users.ban", "users.edit",
  "support.view", "support.reply", "support.internalNotes", "support.quickReplies.manage",
  "business.view", "business.create", "business.edit", "business.assign",
  "business.notes", "business.deals",
  "business.packages.view", "business.packages.request", "business.packages.manage",
  "payments.view", "payments.export", "payments.refund",
  "settings.view",
  "settings.manage",
  "legal.view",
  "audit.view",
  "activity.view",
  "b2b.companies.view",
  "b2b.companies.moderate",
  "b2b.listings.view",
  "b2b.listings.moderate",
  "b2b.documents.view",
]

const MODERATOR_PERMISSIONS: Permission[] = [
  "admin.access", "dashboard.view", "activity.view",
  "listings.view", "listings.moderate",
  "reports.view", "reports.resolve",
  "users.view", "users.viewChats",
]

const SUPPORT_PERMISSIONS: Permission[] = [
  "admin.access", "dashboard.view", "activity.view",
  "support.view", "support.reply", "support.internalNotes",
  "users.view", "users.viewChats",
  "listings.view",
]

const BUSINESS_MANAGER_PERMISSIONS: Permission[] = [
  "admin.access", "dashboard.view", "activity.view",
  "business.view", "business.create", "business.edit", "business.assign",
  "business.notes", "business.deals",
  "business.packages.view", "business.packages.request",
  "b2b.companies.view", "b2b.companies.moderate",
  "b2b.listings.view", "b2b.listings.moderate",
  "users.view",
  "listings.view",
]

const B2B_MODERATOR_PERMISSIONS: Permission[] = [
  "admin.access",
  "dashboard.view",
  "activity.view",
  "b2b.companies.view",
  "b2b.companies.moderate",
  "b2b.listings.view",
  "b2b.listings.moderate",
  "b2b.documents.view",
  "reports.view",
]

const FINANCE_PERMISSIONS: Permission[] = [
  "admin.access", "dashboard.view", "activity.view",
  "payments.view", "payments.export",
  "business.view", "business.packages.view",
]

export const ROLE_PERMISSIONS: Record<StaffRole, Permission[] | ["*"]> = {
  OWNER:            ["*"],
  ADMIN:            ADMIN_PERMISSIONS,
  MODERATOR:        MODERATOR_PERMISSIONS,
  SUPPORT:          SUPPORT_PERMISSIONS,
  BUSINESS_MANAGER: BUSINESS_MANAGER_PERMISSIONS,
  B2B_MODERATOR:    B2B_MODERATOR_PERMISSIONS,
  FINANCE:          FINANCE_PERMISSIONS,
}

// ─── Guard helpers ────────────────────────────────────────────────────────────

export type StaffContext = {
  role: StaffRole
  status: StaffStatus
}

/**
 * Проверяет наличие разрешения. Deny-by-default.
 * false если статус не ACTIVE.
 */
export function hasAdminPermission(
  staff: StaffContext,
  permission: Permission,
): boolean {
  if (staff.status !== StaffStatus.ACTIVE) return false
  const perms = ROLE_PERMISSIONS[staff.role]
  if (perms.length === 1 && perms[0] === "*") return true
  return (perms as Permission[]).includes(permission)
}

/**
 * Кидает AdminForbiddenError если нет разрешения.
 */
export function requireAdminPermission(
  staff: StaffContext,
  permission: Permission,
): void {
  if (!hasAdminPermission(staff, permission)) {
    throw new AdminForbiddenError(`Требуется разрешение: ${permission}`)
  }
}

/**
 * Проверяет наличие хотя бы одного из разрешений.
 */
export function requireAnyAdminPermission(
  staff: StaffContext,
  permissions: Permission[],
): void {
  const has = permissions.some((p) => hasAdminPermission(staff, p))
  if (!has) {
    throw new AdminForbiddenError(`Требуется одно из: ${permissions.join(", ")}`)
  }
}

/**
 * Требует роль OWNER. Для критичных операций.
 */
export function requireOwner(staff: StaffContext): void {
  if (staff.status !== StaffStatus.ACTIVE || staff.role !== StaffRole.OWNER) {
    throw new AdminForbiddenError("Требуется роль Владельца")
  }
}

/**
 * Возвращает развёрнутый список разрешений для роли (без wildcard).
 */
export function expandPermissions(role: StaffRole): Permission[] {
  const perms = ROLE_PERMISSIONS[role]
  if (perms.length === 1 && perms[0] === "*") {
    return Object.keys(PERMISSIONS) as Permission[]
  }
  return perms as Permission[]
}
