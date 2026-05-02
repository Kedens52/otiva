import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getOrCreateSupportConversation } from "@/lib/support"

const messageSchema = z.object({
  text: z.string().trim().min(1).max(2000),
})

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

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

    const { conversation } = await getOrCreateSupportConversation(user.id)
    const full = await prisma.conversation.findUnique({
      where: { id: conversation.id },
      include: conversationInclude(),
    })

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

    const body = await request.json()
    const { text } = messageSchema.parse(body)
    const { conversation } = await getOrCreateSupportConversation(user.id)

    const message = await prisma.message.create({
      data: {
        text,
        conversationId: conversation.id,
        senderId: user.id,
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true, role: true } },
      },
    })

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("support POST error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
