import type { CompanyMemberRole } from "@prisma/client"
import { getUserCompanyAccess } from "@/lib/business/access"
import { canAccessSection } from "@/lib/business/permissions"
import { MESSAGE_ROLES } from "@/lib/messaging/scope"

export type BusinessMessageAccess = {
  companyIds: string[]
  primaryCompanyId: string | null
}

/** Компании, чьи BUSINESS-диалоги пользователь может видеть */
export async function getBusinessMessageAccess(userId: string): Promise<BusinessMessageAccess> {
  const access = await getUserCompanyAccess(userId)
  const eligible = access.filter(
    (a) => canAccessSection(a.role, "messages") && MESSAGE_ROLES.includes(a.role as (typeof MESSAGE_ROLES)[number]),
  )
  const companyIds = eligible.map((a) => a.companyId)
  return {
    companyIds,
    primaryCompanyId: companyIds[0] ?? null,
  }
}

export async function canAccessBusinessConversation(
  userId: string,
  conversation: { companyId: string | null; members: { userId: string }[] },
): Promise<boolean> {
  if (conversation.members.some((m) => m.userId === userId)) return true
  if (!conversation.companyId) return false
  const { companyIds } = await getBusinessMessageAccess(userId)
  return companyIds.includes(conversation.companyId)
}

export function canReplyAsCompany(role: CompanyMemberRole): boolean {
  return MESSAGE_ROLES.includes(role as (typeof MESSAGE_ROLES)[number])
}
