import { NextResponse } from "next/server"
import { withAdminApi } from "@/lib/admin/guards"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export const GET = withAdminApi(async () => {
  try {
    const items = await prisma.review.findMany({
      where: {
        isDeleted: false,
        OR: [{ reviewModerationState: "PENDING_MODERATION" }, { reviewModerationState: "DISPUTED" }],
      },
      orderBy: { updatedAt: "desc" },
      take: 80,
      select: {
        id: true,
        rating: true,
        text: true,
        reviewModerationState: true,
        isHidden: true,
        createdAt: true,
        author: { select: { id: true, name: true, phone: true } },
        targetUser: { select: { id: true, name: true, phone: true } },
        listing: { select: { id: true, title: true } },
      },
    })
    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}, "listings.moderate")
