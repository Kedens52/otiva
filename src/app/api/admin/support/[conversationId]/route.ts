import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSupportUser } from "@/lib/support"
import { withAdminApi } from "@/lib/admin/guards"
import { hasAdminPermission } from "@/lib/admin/permissions"
import { loadSupportTicketContext } from "@/lib/admin/support-ticket-context"
import { writeAudit, AuditAction } from "@/lib/admin/audit"
import { extractIp, extractUA } from "@/lib/admin/getRequestMeta"

export const dynamic = "force-dynamic"

const includeConversation = {
  members: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
          phone: true,
          email: true,
          role: true,
          createdAt: true,
        },
      },
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
  const parts = req.nextUrl.pathname.split("/")
  const conversationId = parts[parts.length - 1] ?? ""

  if (!conversationId || conversationId === "support") {
    return NextResponse.json({ error: "Не указан диалог" }, { status: 400 })
  }

  try {
    const supportUser = await getSupportUser()
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, isSupport: true },
      include: includeConversation,
    })

    if (!conversation) {
      return NextResponse.json({ error: "Обращение не найдено" }, { status: 404 })
    }

    const client =
      conversation.members.find((member) => member.userId !== supportUser.id)?.user ?? null

    const canViewSensitive = hasAdminPermission(staff, "users.viewSensitive")

    const context = await loadSupportTicketContext({
      conversationId: conversation.id,
      supportTopic: conversation.supportTopic,
      supportSubtopic: conversation.supportSubtopic,
      supportListingId: conversation.supportListingId,
      supportAdCampaignId: conversation.supportAdCampaignId,
      listingId: conversation.listingId,
      companyId: conversation.companyId,
      businessListingId: conversation.businessListingId,
      businessRequestId: conversation.businessRequestId,
      clientUserId: client?.id ?? null,
      canViewSensitive,
    })

    const lastMessage = conversation.messages.at(-1) ?? null
    const unreadCount = conversation.messages.filter(
      (message) => message.senderId !== supportUser.id && message.status !== "READ",
    ).length

    await writeAudit({
      actorId: staff.id,
      action: AuditAction.ADMIN_SUPPORT_CONVERSATIONS_VIEWED,
      targetType: "Conversation",
      targetId: conversationId,
      metadata: { detail: true },
      ip: extractIp(req),
      userAgent: extractUA(req),
    })

    return NextResponse.json({
      conversation: {
        ...conversation,
        client,
        lastMessage,
        unreadCount,
      },
      context,
      permissions: {
        canReply: hasAdminPermission(staff, "support.reply"),
        canManageQuickReplies: hasAdminPermission(staff, "support.quickReplies.manage"),
        canViewSensitive,
      },
    })
  } catch (error) {
    console.error("admin support detail GET error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}, "support.view")
