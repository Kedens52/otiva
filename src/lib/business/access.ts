import { prisma } from "@/lib/prisma"
import type { CompanyMemberRole, CompanyVerificationStatus } from "@prisma/client"

export type CompanyAccess = {
  companyId: string
  role: CompanyMemberRole
  verificationStatus: CompanyVerificationStatus
  isOwner: boolean
}

/** Компании, к которым у пользователя есть доступ */
export async function getUserCompanyAccess(userId: string): Promise<CompanyAccess[]> {
  const [owned, memberships] = await Promise.all([
    prisma.company.findMany({
      where: { ownerId: userId, isBlocked: false },
      select: { id: true, verificationStatus: true },
    }),
    prisma.companyMember.findMany({
      where: { userId: userId, company: { isBlocked: false } },
      select: {
        role: true,
        companyId: true,
        company: { select: { verificationStatus: true, ownerId: true } },
      },
    }),
  ])

  const map = new Map<string, CompanyAccess>()

  for (const c of owned) {
    map.set(c.id, {
      companyId: c.id,
      role: "OWNER",
      verificationStatus: c.verificationStatus,
      isOwner: true,
    })
  }

  for (const m of memberships) {
    if (map.has(m.companyId)) continue
    map.set(m.companyId, {
      companyId: m.companyId,
      role: m.role,
      verificationStatus: m.company.verificationStatus,
      isOwner: m.company.ownerId === userId,
    })
  }

  return [...map.values()]
}

/** Первая доступная компания: владелец → участник */
export function pickPrimaryCompanyAccess(access: CompanyAccess[]): CompanyAccess | null {
  if (access.length === 0) return null
  return access.find((a) => a.isOwner) ?? access[0]
}

export async function requireCompanyAccess(
  userId: string,
  companyId: string,
  minRoles?: CompanyMemberRole[],
): Promise<CompanyAccess | null> {
  const all = await getUserCompanyAccess(userId)
  const row = all.find((a) => a.companyId === companyId)
  if (!row) return null
  if (minRoles?.length && !minRoles.includes(row.role) && row.role !== "OWNER") {
    return null
  }
  return row
}

export function canManageListings(role: CompanyMemberRole): boolean {
  return ["OWNER", "ADMIN", "MANAGER", "SALES"].includes(role)
}

export function canManageCompany(role: CompanyMemberRole): boolean {
  return ["OWNER", "ADMIN"].includes(role)
}
