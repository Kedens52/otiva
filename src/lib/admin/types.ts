/**
 * Локальные типы, зеркалящие Prisma-сгенерированные enum'ы из schema.prisma.
 * После `prisma generate` на сервере значения совпадут полностью.
 * Не импортировать из @prisma/client напрямую до первого generate.
 */

export type StaffRole =
  | "OWNER"
  | "ADMIN"
  | "MODERATOR"
  | "SUPPORT"
  | "BUSINESS_MANAGER"
  | "B2B_MODERATOR"
  | "FINANCE"

export const StaffRole = {
  OWNER:            "OWNER",
  ADMIN:            "ADMIN",
  MODERATOR:        "MODERATOR",
  SUPPORT:          "SUPPORT",
  BUSINESS_MANAGER: "BUSINESS_MANAGER",
  B2B_MODERATOR:    "B2B_MODERATOR",
  FINANCE:          "FINANCE",
} as const satisfies Record<StaffRole, StaffRole>

export type StaffStatus = "ACTIVE" | "SUSPENDED" | "REVOKED"

export const StaffStatus = {
  ACTIVE:    "ACTIVE",
  SUSPENDED: "SUSPENDED",
  REVOKED:   "REVOKED",
} as const satisfies Record<StaffStatus, StaffStatus>

export type BusinessClientStatus =
  | "NEW"
  | "CONTACTED"
  | "NEGOTIATING"
  | "ACTIVE_CLIENT"
  | "PAUSED"
  | "LOST"

export const BusinessClientStatus = {
  NEW:          "NEW",
  CONTACTED:    "CONTACTED",
  NEGOTIATING:  "NEGOTIATING",
  ACTIVE_CLIENT:"ACTIVE_CLIENT",
  PAUSED:       "PAUSED",
  LOST:         "LOST",
} as const satisfies Record<BusinessClientStatus, BusinessClientStatus>

export type BusinessDealStatus =
  | "NEW"
  | "IN_PROGRESS"
  | "WON"
  | "LOST"
  | "ON_HOLD"

export const BusinessDealStatus = {
  NEW:         "NEW",
  IN_PROGRESS: "IN_PROGRESS",
  WON:         "WON",
  LOST:        "LOST",
  ON_HOLD:     "ON_HOLD",
} as const satisfies Record<BusinessDealStatus, BusinessDealStatus>
