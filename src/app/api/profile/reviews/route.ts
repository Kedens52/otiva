import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

/**
 * GET /api/profile/reviews?filter=all|positive|neutral|negative&sort=newest|oldest|high|low
 * Отзывы текущего пользователя (полученные) + сводка.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

    const filter = req.nextUrl.searchParams.get("filter") ?? "all"
    const sort = req.nextUrl.searchParams.get("sort") ?? "newest"

    const ratingFilter =
      filter === "positive" ? { gte: 4 } :
      filter === "neutral" ? { equals: 3 } :
      filter === "negative" ? { lte: 2 } :
      undefined

    const orderBy =
      sort === "oldest" ? { createdAt: "asc" as const } :
      sort === "high" ? { rating: "desc" as const } :
      sort === "low" ? { rating: "asc" as const } :
      { createdAt: "desc" as const }

    const [reviews, allReviews] = await Promise.all([
      prisma.review.findMany({
        where: {
          targetUserId: user.id,
          isDeleted: false,
          isHidden: false,
          reviewModerationState: "PUBLISHED",
          ...(ratingFilter ? { rating: ratingFilter } : {}),
        },
        orderBy,
        select: {
          id: true,
          rating: true,
          text: true,
          tags: true,
          replyText: true,
          repliedAt: true,
          createdAt: true,
          listingId: true,
          dealId: true,
          reviewModerationState: true,
          author: { select: { id: true, name: true, avatar: true } },
          listing: { select: { id: true, title: true, slug: true } },
        },
      }),
      prisma.review.findMany({
        where: { targetUserId: user.id, isDeleted: false, isHidden: false, reviewModerationState: "PUBLISHED" },
        select: { rating: true },
      }),
    ])

    const count = allReviews.length
    const avg = count > 0 ? allReviews.reduce((s, r) => s + r.rating, 0) / count : 0
    const positive = allReviews.filter((r) => r.rating >= 4).length
    const neutral = allReviews.filter((r) => r.rating === 3).length
    const negative = allReviews.filter((r) => r.rating <= 2).length

    return NextResponse.json({
      ok: true,
      reviews,
      stats: {
        avg: Math.round(avg * 10) / 10,
        count,
        positive,
        neutral,
        negative,
      },
    })
  } catch (error) {
    console.error("GET /api/profile/reviews error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
