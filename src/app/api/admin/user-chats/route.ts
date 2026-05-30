import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { withAdminApi } from "@/lib/admin/guards"
import { writeAudit, AuditAction } from "@/lib/admin/audit"
import { extractIp, extractUA } from "@/lib/admin/getRequestMeta"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 40

export const GET = withAdminApi(async ({ staff, req }) => {
  const url = req.nextUrl
  const userId = url.searchParams.get("userId")?.trim() || undefined
  const q = url.searchParams.get("q")?.trim() || undefined
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1)
  const skip = (page - 1) * PAGE_SIZE

  const searchFilters: Prisma.ConversationWhereInput[] = []
  if (q) {
    searchFilters.push(
      { listing: { is: { title: { contains: q, mode: "insensitive" } } } },
      {
        members: {
          some: {
            user: {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { phone: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { id: { equals: q } },
              ],
            },
          },
        },
      },
      { messages: { some: { text: { contains: q, mode: "insensitive" } } } },
    )
  }

  const where: Prisma.ConversationWhereInput = {
    isSupport: false,
    ...(userId ? { members: { some: { userId } } } : {}),
    ...(searchFilters.length ? { OR: searchFilters } : {}),
  }

  const [rows, total] = await Promise.all([
    prisma.conversation.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: PAGE_SIZE,
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, avatar: true, phone: true } },
          },
        },
        listing: { select: { id: true, title: true, price: true, status: true, images: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { sender: { select: { id: true, name: true } } },
        },
        _count: { select: { messages: true } },
      },
    }),
    prisma.conversation.count({ where }),
  ])

  const items = rows.map((c) => {
    const { messages, _count, ...rest } = c
    return {
      ...rest,
      lastMessage: messages[0] ?? null,
      messageCount: _count.messages,
    }
  })

  await writeAudit({
    actorId: staff.id,
    action: AuditAction.ADMIN_USER_CHATS_LIST_VIEWED,
    targetType: "MarketplaceChats",
    metadata: { userId: userId ?? null, q: q ?? null, page, total, returned: items.length },
    ip: extractIp(req),
    userAgent: extractUA(req),
  })

  return NextResponse.json({
    conversations: items,
    total,
    page,
    pageSize: PAGE_SIZE,
    hasMore: skip + items.length < total,
  })
}, "users.viewChats")
