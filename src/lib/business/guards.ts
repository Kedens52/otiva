import { prisma } from "@/lib/prisma"
import { B2B_LIMITS } from "@/lib/business/config"
import { normalizeInn } from "@/lib/business/validation"

export async function canRegisterCompany(userId: string): Promise<{ ok: boolean; error?: string }> {
  const count = await prisma.company.count({ where: { ownerId: userId } })
  if (count >= B2B_LIMITS.maxCompaniesPerUser) {
    return { ok: false, error: "Достигнут лимит компаний на аккаунт. Дождитесь проверки существующих." }
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const recent = await prisma.company.count({
    where: { ownerId: userId, createdAt: { gte: since } },
  })
  if (recent >= B2B_LIMITS.registerPerDay) {
    return { ok: false, error: "Слишком много попыток регистрации. Попробуйте завтра." }
  }

  return { ok: true }
}

export async function isInnTaken(inn: string, excludeCompanyId?: string): Promise<boolean> {
  const normalized = normalizeInn(inn)
  if (!normalized) return false
  const existing = await prisma.company.findFirst({
    where: {
      inn: normalized,
      ...(excludeCompanyId ? { id: { not: excludeCompanyId } } : {}),
    },
    select: { id: true },
  })
  return Boolean(existing)
}

export async function canCreateBusinessListing(
  companyId: string,
  verificationStatus: string,
): Promise<{ ok: boolean; error?: string }> {
  if (verificationStatus !== "VERIFIED") {
    const active = await prisma.businessListing.count({
      where: {
        companyId,
        status: { in: ["ACTIVE", "PENDING"] },
      },
    })
    if (active >= B2B_LIMITS.maxListingsBeforeVerified) {
      return {
        ok: false,
        error: "До проверки компании можно разместить не более 3 предложений.",
      }
    }
  }
  return { ok: true }
}
