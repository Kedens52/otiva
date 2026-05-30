import type { CompanyMemberRole, CompanyVerificationStatus } from "@prisma/client"

export type BusinessSection =
  | "overview"
  | "company"
  | "listings"
  | "requests"
  | "messages"
  | "ads"
  | "employees"
  | "documents"
  | "settings"
  | "security"

const ROLE_SECTIONS: Record<CompanyMemberRole, BusinessSection[]> = {
  OWNER: [
    "overview",
    "company",
    "listings",
    "requests",
    "messages",
    "ads",
    "employees",
    "documents",
    "settings",
    "security",
  ],
  ADMIN: [
    "overview",
    "company",
    "listings",
    "requests",
    "messages",
    "ads",
    "employees",
    "documents",
    "settings",
    "security",
  ],
  MANAGER: ["overview", "listings", "requests", "messages"],
  SALES: ["overview", "requests", "messages"],
  SUPPORT: ["overview", "messages"],
  VIEWER: ["overview"],
}

export function canAccessSection(role: CompanyMemberRole, section: BusinessSection): boolean {
  return ROLE_SECTIONS[role]?.includes(section) ?? false
}

export function canPerformActions(status: CompanyVerificationStatus): boolean {
  return status !== "BLOCKED"
}

export function canPublishB2B(status: CompanyVerificationStatus): boolean {
  return status === "VERIFIED"
}

export function isLimitedCabinet(status: CompanyVerificationStatus): boolean {
  return status === "PENDING_REVIEW" || status === "DRAFT"
}

export function buildPermissionFlags(
  role: CompanyMemberRole,
  status: CompanyVerificationStatus,
) {
  const actions = canPerformActions(status)
  return {
    canViewDashboard: true,
    canPerformActions: actions,
    canPublish: canPublishB2B(status) && actions,
    isLimited: isLimitedCabinet(status),
    canManageCompany: actions && canAccessSection(role, "company"),
    canManageListings: actions && canAccessSection(role, "listings"),
    canManageRequests: actions && canAccessSection(role, "requests"),
    canManageMessages: actions && canAccessSection(role, "messages"),
    canManageAds: actions && canAccessSection(role, "ads"),
    canManageEmployees: actions && canAccessSection(role, "employees"),
    canManageDocuments: actions && canAccessSection(role, "documents"),
    canManageSettings: actions && canAccessSection(role, "settings"),
  }
}

export const BUSINESS_NAV_ITEMS: {
  href: string
  label: string
  section: BusinessSection
  exact?: boolean
}[] = [
  { href: "/business/dashboard", label: "Обзор", section: "overview", exact: true },
  { href: "/business/dashboard/company", label: "Компания", section: "company" },
  { href: "/business/dashboard/listings", label: "B2B-объявления", section: "listings" },
  { href: "/business/dashboard/requests", label: "Заявки", section: "requests" },
  { href: "/business/dashboard/inquiries", label: "Запросы прайса", section: "requests" },
  { href: "/business/dashboard/messages", label: "Сообщения", section: "messages" },
  { href: "/business/dashboard/ads", label: "Реклама", section: "ads" },
  { href: "/business/dashboard/employees", label: "Сотрудники", section: "employees" },
  { href: "/business/dashboard/documents", label: "Документы", section: "documents" },
  { href: "/business/dashboard/settings", label: "Настройки", section: "settings" },
  { href: "/business/dashboard/security", label: "Безопасность", section: "security" },
]
