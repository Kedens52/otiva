import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { notifyRecipientNewMessage } from "@/lib/push/notify-new-message"
import { canSendMarketplaceMessage } from "@/lib/messaging-trust"
import {
  BUSINESS_CONVERSATION_TYPE,
  businessConversationWhere,
  countUnreadInConversation,
} from "@/lib/messaging/scope"
import { conversationListInclude } from "@/lib/messaging/conversation-include"
import { getBusinessMessageAccess } from "@/lib/messaging/business-access"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const companyId = request.nextUrl.searchParams.get("companyId")
    const { companyIds, primaryCompanyId } = await getBusinessMessageAccess(user.id)
    if (companyIds.length === 0) {
      return NextResponse.json({ conversations: [], companyId: null })
    }

    const activeCompanyId =
      companyId && companyIds.includes(companyId) ? companyId : primaryCompanyId

    const conversations = await prisma.conversation.findMany({
      where: {
        ...businessConversationWhere(user.id, activeCompanyId ? [activeCompanyId] : companyIds),
      },
      include: conversationListInclude,
      orderBy: { updatedAt: "desc" },
    })

    const result = await Promise.all(
      conversations.map(async (conv) => {
        const member = conv.members.find((m) => m.userId === user.id)
        const unreadCount = await countUnreadInConversation(
          conv.id,
          user.id,
          member?.lastReadAt,
        )
        return { ...conv, lastMessage: conv.messages[0] || null, unreadCount }
      }),
    )

    return NextResponse.json({
      conversations: result,
      companyId: activeCompanyId,
      companyIds,
    })
  } catch (error) {
    console.error("business conversations GET:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}

const createSchema = z.object({
  companyId: z.string().min(1),
  businessListingId: z.string().optional(),
  businessRequestId: z.string().optional(),
  message: z.string().min(1).max(2000),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Некорректные данные" }, { status: 400 })
    }

    const { companyId, businessListingId, businessRequestId, message } = parsed.data

    const company = await prisma.company.findFirst({
      where: { id: companyId, isBlocked: false, verificationStatus: "VERIFIED", isPublic: true },
      select: { id: true, ownerId: true, name: true },
    })
    if (!company) {
      return NextResponse.json({ error: "Компания недоступна" }, { status: 404 })
    }
    if (company.ownerId === user.id) {
      return NextResponse.json({ error: "Нельзя писать своей компании" }, { status: 400 })
    }

    const gate = await canSendMarketplaceMessage(user.id, { recipientId: company.ownerId })
    if (!gate.ok) {
      return NextResponse.json({ error: gate.message }, { status: 403 })
    }

    let contextType: "BUSINESS_LISTING" | "BUSINESS_REQUEST" | "DIRECT" = "DIRECT"
    if (businessListingId) {
      const listing = await prisma.businessListing.findFirst({
        where: { id: businessListingId, companyId, status: "ACTIVE" },
        select: { id: true },
      })
      if (!listing) {
        return NextResponse.json({ error: "B2B-объявление не найдено" }, { status: 404 })
      }
      contextType = "BUSINESS_LISTING"
    } else if (businessRequestId) {
      const req = await prisma.businessRequest.findFirst({
        where: { id: businessRequestId, companyId },
        select: { id: true },
      })
      if (!req) {
        return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 })
      }
      contextType = "BUSINESS_REQUEST"
    }

    let conversation = await prisma.conversation.findFirst({
      where: {
        conversationType: BUSINESS_CONVERSATION_TYPE,
        companyId,
        businessListingId: businessListingId ?? null,
        businessRequestId: businessRequestId ?? null,
        members: { some: { userId: user.id } },
      },
    })

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          conversationType: BUSINESS_CONVERSATION_TYPE,
          contextType,
          companyId,
          businessListingId: businessListingId ?? null,
          businessRequestId: businessRequestId ?? null,
          members: {
            create: [{ userId: user.id }, { userId: company.ownerId }],
          },
        },
      })
    }

    const newMessage = await prisma.message.create({
      data: {
        text: message,
        conversationId: conversation.id,
        senderId: user.id,
        senderType: "USER",
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    })

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    })

    const preview = message.length > 200 ? `${message.slice(0, 200)}…` : message
    const members = await prisma.conversationMember.findMany({
      where: { conversationId: conversation.id },
      select: { userId: true },
    })
    for (const m of members) {
      if (m.userId === user.id) continue
      void notifyRecipientNewMessage({
        recipientUserId: m.userId,
        senderName: company.name,
        messageText: preview,
        conversationId: conversation.id,
        linkPath: `/business/dashboard/messages/${conversation.id}`,
      })
    }

    return NextResponse.json({ conversation, message: newMessage }, { status: 201 })
  } catch (error) {
    console.error("business conversations POST:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
