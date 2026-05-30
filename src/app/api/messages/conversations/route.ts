import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { notifyRecipientNewMessage } from '@/lib/push/notify-new-message'
import { canSendMarketplaceMessage } from '@/lib/messaging-trust'
import { personalConversationWhere, PERSONAL_CONVERSATION_TYPE, countUnreadInConversation } from '@/lib/messaging/scope'
import { conversationListInclude } from '@/lib/messaging/conversation-include'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const conversations = await prisma.conversation.findMany({
      where: personalConversationWhere(user.id),
      include: conversationListInclude,
      orderBy: { updatedAt: 'desc' },
    })

    const result = await Promise.all(
      conversations.map(async (conv) => {
        const member = conv.members.find((m) => m.userId === user.id)
        const unreadCount = await countUnreadInConversation(
          conv.id,
          user.id,
          member?.lastReadAt,
        )
        return {
          ...conv,
          lastMessage: conv.messages[0] || null,
          unreadCount,
        }
      })
    )

    return NextResponse.json({ conversations: result })
  } catch (error) {
    console.error('conversations GET error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

const createSchema = z.object({
  listingId: z.string().optional(),
  recipientId: z.string(),
  message: z.string().min(1).max(1000),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await request.json()
    const { listingId, recipientId, message } = createSchema.parse(body)

    if (recipientId === user.id) {
      return NextResponse.json({ error: 'Нельзя писать самому себе' }, { status: 400 })
    }

    const gate = await canSendMarketplaceMessage(user.id, { recipientId })
    if (!gate.ok) {
      return NextResponse.json({ error: gate.message }, { status: 403 })
    }

    if (listingId) {
      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: { sellerId: true },
      })
      if (!listing) {
        return NextResponse.json({ error: 'Объявление не найдено' }, { status: 404 })
      }
      if (listing.sellerId === user.id) {
        return NextResponse.json(
          { error: 'Нельзя начать переписку по своему объявлению' },
          { status: 400 },
        )
      }
      if (recipientId !== listing.sellerId) {
        return NextResponse.json({ error: 'Неверный получатель сообщения' }, { status: 400 })
      }
    }

    // Check if conversation already exists
    let conversation = await prisma.conversation.findFirst({
      where: {
        conversationType: PERSONAL_CONVERSATION_TYPE,
        listingId: listingId || null,
        members: {
          every: { userId: { in: [user.id, recipientId] } },
        },
        AND: [
          { members: { some: { userId: user.id } } },
          { members: { some: { userId: recipientId } } },
        ],
      },
    })

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          conversationType: PERSONAL_CONVERSATION_TYPE,
          contextType: listingId ? 'LISTING' : 'DIRECT',
          listingId: listingId || null,
          members: {
            create: [{ userId: user.id }, { userId: recipientId }],
          },
        },
      })
    }

    const newMessage = await prisma.message.create({
      data: {
        text: message,
        conversationId: conversation.id,
        senderId: user.id,
        senderType: 'USER',
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
    const senderName = newMessage.sender?.name ?? null
    if (recipientId !== user.id) {
      void notifyRecipientNewMessage({
        recipientUserId: recipientId,
        senderName,
        messageText: preview,
        conversationId: conversation.id,
      })
    }

    return NextResponse.json({ conversation, message: newMessage }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

