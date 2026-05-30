import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getSupportUser } from "@/lib/support"
import { parseBotState } from "@/lib/support/bot-state"
import { processSupportBot, type BotInput } from "@/lib/support/bot-engine"
import { loadUserSupportContext } from "@/lib/support/context"
import type { AutoReplyPayload, BotFlowPayload, SystemSupportPayload } from "@/lib/support/payload"
import { SUPPORT_AUTO_REPLIES, supportTeaserForCategory } from "@/lib/support/auto-replies"

function conversationInclude() {
  return {
    members: {
      include: {
        user: { select: { id: true, name: true, avatar: true, phone: true, email: true, role: true } },
      },
    },
    messages: {
      orderBy: { createdAt: "asc" as const },
      include: {
        sender: { select: { id: true, name: true, avatar: true, role: true } },
      },
    },
  }
}

export async function loadSupportConversation(conversationId: string) {
  return prisma.conversation.findUnique({
    where: { id: conversationId },
    include: conversationInclude(),
  })
}

export async function handleSupportUserMessage(
  userId: string,
  userName: string | null,
  conversationId: string,
  input: BotInput
) {
  const supportUser = await getSupportUser()
  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { supportBotState: true },
  })

  const state = parseBotState(conv?.supportBotState)
  const ctx = await loadUserSupportContext(userId, userName)

  if (input.type === "text") {
    await prisma.message.create({
      data: {
        text: input.text,
        images: [],
        conversationId,
        senderId: userId,
      },
    })
  } else if (input.type === "button" && !input.buttonId.startsWith("bot:")) {
    await prisma.message.create({
      data: {
        text: `[выбор: ${input.buttonId}]`,
        images: [],
        conversationId,
        senderId: userId,
      },
    })
  } else if (input.type === "listing") {
    const listing = ctx.listings.find((l) => l.id === input.listingId)
    await prisma.message.create({
      data: {
        text: listing ? `Объявление: ${listing.title}` : `Объявление: ${input.listingId}`,
        images: [],
        conversationId,
        senderId: userId,
      },
    })
  }

  if (input.type === "button" && input.buttonId === "bot:helpful") {
    const systemPayload: SystemSupportPayload = { kind: "system" }
    await prisma.message.create({
      data: {
        text: "Рады, что помогло. Если появится другой вопрос — напишите снова.",
        images: [],
        conversationId,
        senderId: supportUser.id,
        supportPayload: systemPayload,
      },
    })
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { supportWorkflowStatus: "RESOLVED_AUTO", operatorNeeded: false },
    })
    return loadSupportConversation(conversationId)
  }

  if (input.type === "button" && input.buttonId === "bot:escalate") {
    input = { type: "button", buttonId: "human" }
  }

  const reply = processSupportBot(input, state, ctx)

  let supportPayload: AutoReplyPayload | BotFlowPayload | SystemSupportPayload

  if (reply.autoReplyId) {
    const found = SUPPORT_AUTO_REPLIES.find((r) => r.id === reply.autoReplyId)
    if (found) {
      supportPayload = {
        kind: "auto_reply",
        autoReplyId: found.id,
        title: found.title,
        teaser: supportTeaserForCategory(found.category),
        body: found.answer,
        links: found.links ?? [],
        actionState: "pending",
      }
    } else {
      supportPayload = {
        kind: "bot_flow",
        stepId: reply.state.step,
        buttons: reply.buttons,
        listings: reply.listings,
        breadcrumbs: reply.breadcrumbs,
        expectDescription: reply.expectDescription,
      }
    }
  } else {
    supportPayload = {
      kind: "bot_flow",
      stepId: reply.state.step,
      buttons: reply.buttons,
      listings: reply.listings,
      breadcrumbs: reply.breadcrumbs,
      expectDescription: reply.expectDescription,
      ticketCreated: reply.createTicket,
    }
  }

  await prisma.message.create({
    data: {
      text: reply.text,
      images: [],
      conversationId,
      senderId: supportUser.id,
      supportPayload: supportPayload as Prisma.InputJsonValue,
    },
  })

  const updateData: Prisma.ConversationUpdateInput = {
    supportBotState: reply.state as Prisma.InputJsonValue,
    supportTopic: reply.topicId ?? reply.state.topicId ?? undefined,
    supportSubtopic: reply.subtopicId ?? reply.state.subtopicId ?? undefined,
    supportListingId: reply.listingId ?? reply.state.listingId ?? undefined,
    updatedAt: new Date(),
  }

  if (reply.createTicket || reply.escalate) {
    updateData.operatorNeeded = true
    updateData.supportWorkflowStatus = "WAITING_OPERATOR"
    if (reply.createTicket) {
      await prisma.message.create({
        data: {
          text: "✓ Обращение зарегистрировано. Специалист ответит в этом чате.",
          images: [],
          conversationId,
          senderId: supportUser.id,
          supportPayload: { kind: "system" },
        },
      })
    }
  } else if (reply.expectDescription) {
    updateData.supportWorkflowStatus = "WAITING_USER"
    updateData.operatorNeeded = false
  } else {
    updateData.supportWorkflowStatus = "ACTIVE"
    updateData.operatorNeeded = false
  }

  await prisma.conversation.update({
    where: { id: conversationId },
    data: updateData,
  })

  return loadSupportConversation(conversationId)
}
