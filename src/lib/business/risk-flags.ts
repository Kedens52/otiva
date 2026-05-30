import type { Company } from "@prisma/client"

export type RiskFlag = { id: string; label: string; severity: "low" | "medium" | "high" }

export function computeCompanyRiskFlags(
  company: Pick<
    Company,
    "createdAt" | "inn" | "contactPhone" | "contactEmail" | "verificationStatus" | "trustStatus"
  > & {
    ownerCreatedAt?: Date
    ownerPhoneVerified?: boolean
    duplicateInnCount?: number
    activeListingsCount?: number
    pendingReportsCount?: number
    inquiriesLast24h?: number
  },
): RiskFlag[] {
  const flags: RiskFlag[] = []
  const ageDays = (Date.now() - company.createdAt.getTime()) / (86400 * 1000)

  if (ageDays < 7) flags.push({ id: "new_company", label: "Новая компания (< 7 дней)", severity: "medium" })
  if (company.ownerCreatedAt) {
    const ownerAge = (Date.now() - company.ownerCreatedAt.getTime()) / (86400 * 1000)
    if (ownerAge < 14) flags.push({ id: "new_owner", label: "Новый аккаунт владельца", severity: "medium" })
  }
  if (!company.contactPhone) flags.push({ id: "no_phone", label: "Нет телефона компании", severity: "low" })
  if (!company.contactEmail) flags.push({ id: "no_email", label: "Нет email компании", severity: "low" })
  if (company.duplicateInnCount && company.duplicateInnCount > 1) {
    flags.push({ id: "dup_inn", label: "Дубли ИНН в системе", severity: "high" })
  }
  if ((company.activeListingsCount ?? 0) === 0 && company.verificationStatus === "VERIFIED") {
    flags.push({ id: "no_listings", label: "Нет активных B2B-предложений", severity: "low" })
  }
  if ((company.pendingReportsCount ?? 0) > 0) {
    flags.push({ id: "reports", label: `Жалобы: ${company.pendingReportsCount}`, severity: "high" })
  }
  if ((company.inquiriesLast24h ?? 0) > 50) {
    flags.push({ id: "inquiry_spam", label: "Много входящих запросов за сутки", severity: "medium" })
  }
  if (company.trustStatus === "RISK" || company.trustStatus === "HIGH_RISK") {
    flags.push({ id: "trust", label: "Повышенный риск (trustStatus)", severity: "high" })
  }

  return flags
}
