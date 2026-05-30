import { NextResponse } from "next/server"
import { getUserReviews } from "@/lib/reviews/user-reviews"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const [reviews, user] = await Promise.all([
      getUserReviews(params.id),
      prisma.user.findUnique({
        where: { id: params.id },
        select: {
          rating: true,
          reviewCount: true,
          positiveReviewsCount: true,
          negativeReviewsCount: true,
        },
      }),
    ])

    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 })
    }

    return NextResponse.json({
      ok: true,
      reviews,
      stats: {
        rating: user.rating,
        total: user.reviewCount,
        positive: user.positiveReviewsCount,
        negative: user.negativeReviewsCount,
      },
    })
  } catch (error) {
    console.error("GET /api/users/[id]/reviews error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
