import { NextRequest, NextResponse } from "next/server"
import { withAdminApi } from "@/lib/admin/guards"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

/**
 * GET /api/admin/reviews?status=PENDING&page=1&limit=30&search=...
 */
export const GET = withAdminApi(async ({ req }) => {
  const sp = req.nextUrl.searchParams
  const status = sp.get("status") ?? "PENDING_MODERATION"
  const page = Math.max(1, parseInt(sp.get("page") ?? "1"))
  const limit = Math.min(100, parseInt(sp.get("limit") ?? "30"))
  const search = sp.get("search")?.trim() ?? ""
  const rating = sp.get("rating") ? parseInt(sp.get("rating")!) : null

  // Map UI status names to DB fields
  const whereStatus = (() => {
    if (status === "PENDING") return { reviewModerationState: "PENDING_MODERATION", isHidden: false, isDeleted: false }
    if (status === "PUBLISHED") return { reviewModerationState: "PUBLISHED", isHidden: false, isDeleted: false }
    if (status === "REPORTED") return { reportCount: { gt: 0 }, isDeleted: false }
    if (status === "HIDDEN") return { isHidden: true, isDeleted: false }
    if (status === "REJECTED") return { reviewModerationState: "REJECTED", isDeleted: false }
    if (status === "DELETED") return { isDeleted: true }
    return { isDeleted: false }
  })()

  const searchFilter = search
    ? {
        OR: [
          { author: { name: { contains: search, mode: "insensitive" as const } } },
          { targetUser: { name: { contains: search, mode: "insensitive" as const } } },
          { text: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {}

  const ratingFilter = rating ? { rating } : {}

  const where = { ...whereStatus, ...searchFilter, ...ratingFilter }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        rating: true,
        text: true,
        tags: true,
        replyText: true,
        reviewModerationState: true,
        reviewStatus: true,
        isHidden: true,
        isDeleted: true,
        reportCount: true,
        riskScore: true,
        moderationNote: true,
        createdAt: true,
        dealId: true,
        listingId: true,
        author: { select: { id: true, name: true, avatar: true } },
        targetUser: { select: { id: true, name: true, avatar: true } },
        listing: { select: { id: true, title: true } },
        reports: {
          select: { reason: true, comment: true, createdAt: true, reporter: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    }),
    prisma.review.count({ where }),
  ])

  return NextResponse.json({ ok: true, reviews, total, page, limit })
}, "listings.moderate")
