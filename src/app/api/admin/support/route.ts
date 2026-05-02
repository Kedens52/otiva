import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { isAdminAuthed } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import { getSupportUser } from "@/lib/support"

const replySchema = z.object({
  conversationId: z.string().min(1),
  text: z.string().trim().min(1).max(2000),
})

const includeConversation = {
  members: {
    include: {
      user: { select: { id: true, name: true, avatar: true, phone: true, email: true, role: true, createdAt: true } },
    },
  },
  messages: {
    orderBy: { createdAt: "asc" as const },
    include: {
      sender: { select: { id: true, name: true, avatar: true, role: true } },
    },
  },
}

export async function GET() {
  if (!isAdminAuthed()) return NextResponse.json({ error: "Нет доступа" }, { status: 403 })

  try {
    const supportUser = await getSupportUser()
    const conversations = await prisma.conversation.findMany({
      where: { isSupport: true },
      include: includeConversation,
      orderBy: { updatedAt: "desc" },
      take: 100,
    })

    const items = conversations.map((conversation) => {
      const client = conversation.members.find((member) => member.userId !== supportUser.id)?.user ?? null
      const lastMessage = conversation.messages.at(-1) ?? null
      const unreadCount = conversation.messages.filter((message) => message.senderId !== supportUser.id && message.status !== "READ").length
      return { ...conversation, client, lastMessage, unreadCount }
    })

    return NextResponse.json({ conversations: items })
  } catch (error) {
    console.error("admin support GET error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminAuthed()) return NextResponse.json({ error: "Нет доступа" }, { status: 403 })

  try {
    const body = await request.json()
    const { conversationId, text } = replySchema.parse(body)
    const supportUser = await getSupportUser()

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        isSupport: true,
        members: { some: { userId: supportUser.id } },
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: "Чат поддержки не найден" }, { status: 404 })
    }

    const message = await prisma.message.create({
      data: {
        text,
        conversationId,
        senderId: supportUser.id,
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true, role: true } },
      },
    })

    await Promise.all([
      prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } }),
      prisma.conversationMember.updateMany({
        where: { conversationId, userId: supportUser.id },
        data: { lastReadAt: new Date() },
      }),
      prisma.message.updateMany({
        where: { conversationId, senderId: { not: supportUser.id } },
        data: { status: "READ" },
      }),
    ])

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("admin support POST error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
