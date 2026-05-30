import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getSupportUser } from "@/lib/support"
import { withAdminApi } from "@/lib/admin/guards"
import { writeAudit, AuditAction } from "@/lib/admin/audit"
import { extractIp, extractUA } from "@/lib/admin/getRequestMeta"

export const dynamic = 'force-dynamic'

const replySchema = z.object({
  conversationId: z.string().min(1),
  text: z.string().trim().min(1).max(2000),
  quickReplyId: z.string().optional(),
  quickReplyWasEdited: z.boolean().optional(),
})

const resolveSchema = z.object({
  conversationId: z.string().min(1),
  action: z.enum(["close", "reopen"]).optional().default("close"),
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

export const GET = withAdminApi(async ({ staff, req }) => {
  try {
    const supportUser = await getSupportUser()
    const conversations = await prisma.conversation.findMany({
      where: { isSupport: true },
      include: includeConversation,
      orderBy: { updatedAt: "desc" },
      take: 100,
    })

    const items = conversations
      .map((conversation) => {
        const client = conversation.members.find((member) => member.userId !== supportUser.id)?.user ?? null
        const lastMessage = conversation.messages.at(-1) ?? null
        const unreadCount = conversation.messages.filter((message) => message.senderId !== supportUser.id && message.status !== "READ").length
        return { ...conversation, client, lastMessage, unreadCount }
      })
      .sort((a, b) => {
        const wa = a.operatorNeeded || a.supportWorkflowStatus === "WAITING_OPERATOR" ? 1 : 0
        const wb = b.operatorNeeded || b.supportWorkflowStatus === "WAITING_OPERATOR" ? 1 : 0
        if (wa !== wb) return wb - wa
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      })

    await writeAudit({
      actorId: staff.id,
      action: AuditAction.ADMIN_SUPPORT_CONVERSATIONS_VIEWED,
      targetType: "Support",
      metadata: { total: items.length },
      ip: extractIp(req),
      userAgent: extractUA(req),
    })

    return NextResponse.json({ conversations: items })
  } catch (error) {
    console.error("admin support GET error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}, "support.view")

export const POST = withAdminApi(async ({ staff, req }) => {
  try {
    const body = await req.json()
    const { conversationId, text, quickReplyId, quickReplyWasEdited } = replySchema.parse(body)
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
        images:         [],
        conversationId,
        senderId:       supportUser.id,
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true, role: true } },
      },
    })

    const usageTasks: Promise<unknown>[] = [
      prisma.conversation.update({
        where: { id: conversationId },
        data: {
          updatedAt:              new Date(),
          operatorNeeded:         false,
          supportWorkflowStatus:  "ACTIVE",
        },
      }),
      prisma.conversationMember.updateMany({
        where: { conversationId, userId: supportUser.id },
        data: { lastReadAt: new Date() },
      }),
      prisma.message.updateMany({
        where: { conversationId, senderId: { not: supportUser.id } },
        data: { status: "READ" },
      }),
    ]

    if (quickReplyId) {
      usageTasks.push(
        prisma.supportQuickReplyUsage.create({
          data: {
            quickReplyId,
            conversationId,
            staffId: staff.id,
            wasEdited: Boolean(quickReplyWasEdited),
          },
        }),
        prisma.supportOperatorQuickReply.update({
          where: { id: quickReplyId },
          data: { usageCount: { increment: 1 } },
        }),
      )
    }

    await Promise.all(usageTasks)

    await writeAudit({
      actorId: staff.id,
      action: AuditAction.ADMIN_SUPPORT_REPLY_SENT,
      targetType: "Conversation",
      targetId: conversationId,
      metadata: { length: text.length },
      ip: extractIp(req),
      userAgent: extractUA(req),
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("admin support POST error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}, "support.reply")

export const PATCH = withAdminApi(async ({ staff, req }) => {
  try {
    const body = await req.json()
    const { conversationId, action } = resolveSchema.parse(body)

    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, isSupport: true },
    })

    if (!conversation) {
      return NextResponse.json({ error: "Чат не найден" }, { status: 404 })
    }

    await prisma.conversation.update({
      where: { id: conversationId },
      data:
        action === "reopen"
          ? {
              supportWorkflowStatus: "ACTIVE",
              operatorNeeded: false,
              updatedAt: new Date(),
            }
          : {
              supportWorkflowStatus: "CLOSED",
              operatorNeeded: false,
              updatedAt: new Date(),
            },
    })

    await writeAudit({
      actorId: staff.id,
      action: AuditAction.ADMIN_SUPPORT_REPLY_SENT,
      targetType: "Conversation",
      targetId: conversationId,
      metadata: { action: "resolve" },
      ip: extractIp(req),
      userAgent: extractUA(req),
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("admin support PATCH error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}, "support.reply")

