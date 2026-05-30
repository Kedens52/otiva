import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminApi } from "@/lib/admin/guards"
import { writeAudit, AuditAction } from "@/lib/admin/audit"
import { extractIp, extractUA } from "@/lib/admin/getRequestMeta"

export const dynamic = "force-dynamic"

const MAX_MESSAGES = 500

export const GET = withAdminApi(async ({ staff, req }) => {
  const id = req.nextUrl.pathname.split("/").filter(Boolean).pop() ?? ""
  if (!id) {
    return NextResponse.json({ error: "Не указан диалог" }, { status: 400 })
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id, isSupport: false },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, avatar: true, phone: true, email: true, role: true, createdAt: true } },
        },
      },
      listing: { select: { id: true, title: true, price: true, status: true, images: true, sellerId: true } },
    },
  })

  if (!conversation) {
    return NextResponse.json({ error: "Диалог не найден" }, { status: 404 })
  }

  const totalMessages = await prisma.message.count({ where: { conversationId: id } })

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "desc" },
    take: MAX_MESSAGES,
    include: {
      sender: { select: { id: true, name: true, avatar: true, role: true } },
    },
  })

  messages.reverse()

  await writeAudit({
    actorId: staff.id,
    action: AuditAction.ADMIN_USER_CHAT_CONVERSATION_VIEWED,
    targetType: "Conversation",
    targetId: id,
    metadata: {
      listingId: conversation.listingId,
      memberIds: conversation.members.map((m) => m.userId),
      messageCount: totalMessages,
      truncated: totalMessages > MAX_MESSAGES,
    },
    ip: extractIp(req),
    userAgent: extractUA(req),
  })

  return NextResponse.json({
    conversation: {
      ...conversation,
      messages,
      messageCountTotal: totalMessages,
      messagesTruncated: totalMessages > MAX_MESSAGES,
    },
  })
}, "users.viewChats")
