import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { notifyRecipientNewMessage } from "@/lib/push/notify-new-message"
import { canSendMarketplaceMessage } from "@/lib/messaging-trust"
import { BUSINESS_CONVERSATION_TYPE } from "@/lib/messaging/scope"
import { conversationDetailInclude } from "@/lib/messaging/conversation-include"
import {
  canAccessBusinessConversation,
  canReplyAsCompany,
  getBusinessMessageAccess,
} from "@/lib/messaging/business-access"
import { requireCompanyAccess } from "@/lib/business/access"

export const dynamic = "force-dynamic"

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const conversation = await prisma.conversation.findFirst({
      where: { id: params.id, conversationType: BUSINESS_CONVERSATION_TYPE },
      include: conversationDetailInclude,
    })

    if (!conversation) {
      return NextResponse.json({ error: "Не найдено" }, { status: 404 })
    }

    const allowed = await canAccessBusinessConversation(user.id, conversation)
    if (!allowed) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 })
    }

    const member = conversation.members.find((m) => m.userId === user.id)
    if (member) {
      await prisma.conversationMember.updateMany({
        where: { conversationId: params.id, userId: user.id },
        data: { lastReadAt: new Date() },
      })
    }

    return NextResponse.json({ conversation })
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}

const messageSchema = z.object({
  text: z.string().min(1).max(2000),
  images: z.array(z.string()).max(5).optional(),
  companyId: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const conversation = await prisma.conversation.findFirst({
      where: { id: params.id, conversationType: BUSINESS_CONVERSATION_TYPE },
      include: {
        members: { select: { userId: true } },
        company: { select: { id: true, name: true, ownerId: true } },
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: "Не найдено" }, { status: 404 })
    }

    const allowed = await canAccessBusinessConversation(user.id, conversation)
    if (!allowed) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 })
    }

    const body = await request.json()
    const { text, images, companyId: replyCompanyId } = messageSchema.parse(body)

    const isExternalBuyer = conversation.members.some((m) => m.userId === user.id)
    let senderType: "USER" | "COMPANY" = "USER"
    let senderCompanyId: string | null = null
    let displayName: string | null = null

    if (!isExternalBuyer && conversation.companyId) {
      const access = await requireCompanyAccess(
        user.id,
        replyCompanyId ?? conversation.companyId,
        ["OWNER", "ADMIN", "MANAGER", "SALES", "SUPPORT"],
      )
      if (!access || !canReplyAsCompany(access.role)) {
        return NextResponse.json({ error: "Нет прав отвечать от компании" }, { status: 403 })
      }
      senderType = "COMPANY"
      senderCompanyId = conversation.companyId
      displayName = conversation.company?.name ?? null
    } else if (!isExternalBuyer) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 })
    } else {
      const gate = await canSendMarketplaceMessage(user.id, { conversationId: params.id })
      if (!gate.ok) {
        return NextResponse.json({ error: gate.message }, { status: 403 })
      }
      displayName = null
    }

    const message = await prisma.message.create({
      data: {
        text,
        images: images || [],
        conversationId: params.id,
        senderId: user.id,
        senderType,
        senderCompanyId,
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    })

    await prisma.conversation.update({
      where: { id: params.id },
      data: { updatedAt: new Date() },
    })

    const preview = text.length > 200 ? `${text.slice(0, 200)}…` : text
    const senderLabel =
      senderType === "COMPANY"
        ? displayName
        : message.sender?.name ?? null

    for (const m of conversation.members) {
      if (m.userId === user.id) continue
      void notifyRecipientNewMessage({
        recipientUserId: m.userId,
        senderName: senderLabel,
        messageText: preview,
        conversationId: params.id,
        linkPath: `/business/dashboard/messages/${params.id}`,
      })
    }

    if (senderType === "COMPANY" && conversation.companyId) {
      const { companyIds } = await getBusinessMessageAccess(user.id)
      const staff = await prisma.companyMember.findMany({
        where: {
          companyId: conversation.companyId,
          userId: { not: user.id },
        },
        select: { userId: true },
      })
      const notifyIds = new Set<string>()
      if (conversation.company?.ownerId) notifyIds.add(conversation.company.ownerId)
      for (const s of staff) {
        if (companyIds.includes(conversation.companyId)) notifyIds.add(s.userId)
      }
      for (const uid of Array.from(notifyIds)) {
        if (conversation.members.some((m) => m.userId === uid)) continue
        void notifyRecipientNewMessage({
          recipientUserId: uid,
          senderName: senderLabel,
          messageText: preview,
          conversationId: params.id,
          linkPath: `/business/dashboard/messages/${params.id}`,
        })
      }
    }

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
