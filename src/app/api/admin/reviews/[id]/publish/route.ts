import { NextResponse } from "next/server"
import { withAdminApi } from "@/lib/admin/guards"
import { prisma } from "@/lib/prisma"
import { recalculateUserRating } from "@/lib/reviews/user-reviews"
import { recalculateUserTrust } from "@/lib/user-trust-engine"

export const dynamic = "force-dynamic"

/** Вернуть отзыв в публикацию после модерации или отклонить спор (оставить видимым). */
export const POST = withAdminApi(async ({ req }) => {
  const id = req.nextUrl.pathname.split("/").at(-2) ?? ""
  try {
    const review = await prisma.review.findUnique({ where: { id } })
    if (!review || review.isDeleted) {
      return NextResponse.json({ error: "Отзыв не найден" }, { status: 404 })
    }

    await prisma.review.update({
      where: { id },
      data: {
        reviewModerationState: "PUBLISHED",
        disputedAt: null,
        isHidden: false,
      },
    })
    await recalculateUserRating(review.targetUserId)
    void recalculateUserTrust(review.targetUserId).catch(() => {})
    void recalculateUserTrust(review.authorId).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("POST /api/admin/reviews/[id]/publish", e)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}, "listings.moderate")
