import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        isSupport: false,
        members: { some: { userId: user.id } },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true, phone: true },
            },
          },
        },
        listing: {
          select: { id: true, title: true, price: true, images: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    // Calculate unread count per conversation
    const result = await Promise.all(
      conversations.map(async (conv) => {
        const member = conv.members.find((m) => m.userId === user.id)
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: user.id },
            ...(member?.lastReadAt
              ? { createdAt: { gt: member.lastReadAt } }
              : {}),
          },
        })
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

    // Check if conversation already exists
    let conversation = await prisma.conversation.findFirst({
      where: {
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
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    })

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json({ conversation, message: newMessage }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
