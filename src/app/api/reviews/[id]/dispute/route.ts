import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { recalculateUserRating } from "@/lib/reviews/user-reviews"
import { recalculateUserTrust } from "@/lib/user-trust-engine"

export const dynamic = "force-dynamic"

/**
 * Продавец оспаривает опубликованный отзыв — уходит в очередь администратора, рейтинг пересчитывается без этого отзыва.
 */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

    const review = await prisma.review.findUnique({ where: { id: params.id } })
    if (!review || review.isDeleted) {
      return NextResponse.json({ error: "Отзыв не найден" }, { status: 404 })
    }
    if (review.targetUserId !== user.id) {
      return NextResponse.json({ error: "Оспорить может только получатель отзыва" }, { status: 403 })
    }
    if (review.reviewModerationState !== "PUBLISHED") {
      return NextResponse.json({ error: "Отзыв уже на проверке или скрыт" }, { status: 409 })
    }

    await prisma.review.update({
      where: { id: review.id },
      data: { reviewModerationState: "DISPUTED", disputedAt: new Date() },
    })
    await recalculateUserRating(review.targetUserId)
    void recalculateUserTrust(review.targetUserId).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("POST /api/reviews/[id]/dispute", e)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
