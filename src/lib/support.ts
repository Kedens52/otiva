import { prisma } from "@/lib/prisma"

export async function getSupportUser() {
  return prisma.user.upsert({
    where: { email: "support@nashlo.local" },
    update: {
      name: "Поддержка Нашло",
      role: "MODERATOR",
      isVerified: true,
    },
    create: {
      email: "support@nashlo.local",
      name: "Поддержка Нашло",
      role: "MODERATOR",
      isVerified: true,
    },
  })
}

export async function getOrCreateSupportConversation(userId: string) {
  const supportUser = await getSupportUser()

  let conversation = await prisma.conversation.findFirst({
    where: {
      conversationType: "SUPPORT",
      isSupport: true,
      members: {
        every: { userId: { in: [userId, supportUser.id] } },
      },
      AND: [
        { members: { some: { userId } } },
        { members: { some: { userId: supportUser.id } } },
      ],
    },
  })

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        conversationType: "SUPPORT",
        contextType: "SUPPORT_TICKET",
        isSupport: true,
        members: {
          create: [{ userId }, { userId: supportUser.id }],
        },
      },
    })
  }

  return { conversation, supportUser }
}
