import type { ConversationType, Prisma } from "@prisma/client"

export const PERSONAL_CONVERSATION_TYPE = "PERSONAL" as const satisfies ConversationType
export const BUSINESS_CONVERSATION_TYPE = "BUSINESS" as const satisfies ConversationType
export const SUPPORT_CONVERSATION_TYPE = "SUPPORT" as const satisfies ConversationType

export const MESSAGE_ROLES = ["OWNER", "ADMIN", "MANAGER", "SALES", "SUPPORT"] as const

export function personalConversationWhere(userId: string): Prisma.ConversationWhereInput {
  return {
    conversationType: PERSONAL_CONVERSATION_TYPE,
    isSupport: false,
    members: { some: { userId } },
  }
}

export function businessConversationWhere(
  userId: string,
  companyIds: string[],
): Prisma.ConversationWhereInput {
  return {
    conversationType: BUSINESS_CONVERSATION_TYPE,
    OR: [
      { members: { some: { userId } } },
      ...(companyIds.length > 0 ? [{ companyId: { in: companyIds } }] : []),
    ],
  }
}

export async function countUnreadInConversation(
  conversationId: string,
  userId: string,
  lastReadAt: Date | null | undefined,
) {
  const { prisma } = await import("@/lib/prisma")
  return prisma.message.count({
    where: {
      conversationId,
      senderId: { not: userId },
      ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
    },
  })
}
