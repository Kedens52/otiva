import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getOrCreateSupportConversation } from "@/lib/support"
import { handleSupportUserMessage, loadSupportConversation } from "@/lib/support/handle-message"
import { checkSupportRateLimit } from "@/lib/support/rate-limit"
import { isAutoReplyPayload } from "@/lib/support/payload"
import { getSupportUser } from "@/lib/support"

export const dynamic = "force-dynamic"

const messageSchema = z.object({
  text: z.string().trim().min(1).max(2000).optional(),
  buttonId: z.string().min(1).max(120).optional(),
  listingId: z.string().min(1).max(80).optional(),
})

const feedbackSchema = z.object({
  messageId: z.string().min(1),
  action: z.enum(["helpful", "escalate"]),
})

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

    const { conversation } = await getOrCreateSupportConversation(user.id)
    const full = await loadSupportConversation(conversation.id)

    await prisma.conversationMember.updateMany({
      where: { conversationId: conversation.id, userId: user.id },
      data: { lastReadAt: new Date() },
    })

    return NextResponse.json({ conversation: full })
  } catch (error) {
    console.error("support GET error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

    if (!checkSupportRateLimit(user.id)) {
      return NextResponse.json({ error: "Слишком много сообщений. Подождите минуту." }, { status: 429 })
    }

    const body = await request.json()
    const parsed = messageSchema.parse(body)
    const { conversation } = await getOrCreateSupportConversation(user.id)

    let input:
      | { type: "text"; text: string }
      | { type: "button"; buttonId: string }
      | { type: "listing"; listingId: string }

    if (parsed.listingId) {
      input = { type: "listing", listingId: parsed.listingId }
    } else if (parsed.buttonId) {
      input = { type: "button", buttonId: parsed.buttonId }
    } else if (parsed.text) {
      input = { type: "text", text: parsed.text }
    } else {
      return NextResponse.json({ error: "Пустое сообщение" }, { status: 400 })
    }

    const full = await handleSupportUserMessage(user.id, user.name, conversation.id, input)
    return NextResponse.json({ conversation: full }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("support POST error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

    const body = await request.json()
    const { messageId, action } = feedbackSchema.parse(body)
    const { conversation } = await getOrCreateSupportConversation(user.id)
    const supportUser = await getSupportUser()

    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        conversationId: conversation.id,
        senderId: supportUser.id,
      },
    })

    if (!message || !isAutoReplyPayload(message.supportPayload)) {
      return NextResponse.json({ error: "Сообщение не найдено" }, { status: 404 })
    }

    const payload = message.supportPayload
    if (payload.actionState !== "pending") {
      return NextResponse.json({ error: "Ответ уже обработан" }, { status: 409 })
    }

    await prisma.message.update({
      where: { id: messageId },
      data: {
        supportPayload: {
          ...payload,
          actionState: action === "helpful" ? "helpful" : "escalated",
        },
      },
    })

    if (action === "helpful") {
      await prisma.message.create({
        data: {
          text: "Хорошо, обращение закрыто. Если появится другой вопрос, напишите снова.",
          images: [],
          conversationId: conversation.id,
          senderId: supportUser.id,
          supportPayload: { kind: "system" },
        },
      })
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { supportWorkflowStatus: "RESOLVED_AUTO", operatorNeeded: false },
      })
    } else {
      await handleSupportUserMessage(user.id, user.name, conversation.id, {
        type: "button",
        buttonId: "human",
      })
    }

    const full = await loadSupportConversation(conversation.id)
    return NextResponse.json({ conversation: full })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("support PATCH error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
