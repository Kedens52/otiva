import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { notifyRecipientNewMessage } from '@/lib/push/notify-new-message'
import { canSendMarketplaceMessage } from '@/lib/messaging-trust'
import { messageLooksLikeDealRisk } from '@/lib/chat/deal-risk-keywords'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: params.id },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, avatar: true, phone: true } },
          },
        },
        listing: {
          select: { id: true, title: true, price: true, images: true, status: true },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Не найдено' }, { status: 404 })
    }

    const isMember = conversation.members.some((m) => m.userId === user.id)
    if (!isMember) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
    }

    // Mark as read
    await prisma.conversationMember.updateMany({
      where: { conversationId: params.id, userId: user.id },
      data: { lastReadAt: new Date() },
    })

    return NextResponse.json({ conversation })
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

const messageSchema = z.object({
  text: z.string().min(1).max(2000),
  images: z.array(z.string()).max(5).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const member = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId: params.id,
          userId: user.id,
        },
      },
    })

    if (!member) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
    }

    const gate = await canSendMarketplaceMessage(user.id, { conversationId: params.id })
    if (!gate.ok) {
      return NextResponse.json({ error: gate.message }, { status: 403 })
    }

    const body = await request.json()
    const { text, images } = messageSchema.parse(body)

    const message = await prisma.message.create({
      data: {
        text,
        images: images || [],
        conversationId: params.id,
        senderId: user.id,
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    })

    await prisma.conversation.update({
      where: { id: params.id },
      data: { updatedAt: new Date() },
    })

    const conv = await prisma.conversation.findUnique({
      where: { id: params.id },
      select: {
        isSupport: true,
        members: { select: { userId: true } },
      },
    })
    if (conv && !conv.isSupport) {
      const others = conv.members.filter((m) => m.userId !== user.id).map((m) => m.userId)
      const preview = text.length > 200 ? `${text.slice(0, 200)}…` : text
      const senderName = message.sender?.name ?? null
      for (const uid of others) {
        void notifyRecipientNewMessage({
          recipientUserId: uid,
          senderName,
          messageText: preview,
          conversationId: params.id,
        })
      }
    }

    return NextResponse.json(
      { message, dealRiskHint: messageLooksLikeDealRisk(text) },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

