import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUser } from "@/lib/auth"
import { canUserReviewTarget, recalculateUserRating } from "@/lib/reviews/user-reviews"
import { reviewTextNeedsModeration } from "@/lib/reviews/abusive-review"
import { prisma } from "@/lib/prisma"
import { addUserTrustEvent, recalculateUserTrust } from "@/lib/user-trust-engine"

export const dynamic = "force-dynamic"

const createSchema = z
  .object({
    targetUserId: z.string().min(1).optional(),
    /** Совместимость со старым клиентом карточки объявления */
    sellerId: z.string().min(1).optional(),
    listingId: z.string().optional(),
    conversationId: z.string().optional(),
    rating: z.number().int().min(1).max(5),
    text: z.string().max(1000).optional(),
  })
  .transform((b) => ({
    ...b,
    targetUserId: b.targetUserId ?? b.sellerId ?? "",
  }))
  .refine((b) => Boolean(b.targetUserId?.trim()), { message: "Укажите пользователя" })

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

    const body = createSchema.parse(await req.json())

    if (user.id === body.targetUserId) {
      return NextResponse.json({ error: "Нельзя оставить отзыв самому себе" }, { status: 403 })
    }

    const target = await prisma.user.findUnique({ where: { id: body.targetUserId }, select: { id: true } })
    if (!target) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 })

    const check = await canUserReviewTarget(user.id, body.targetUserId, body.listingId, body.conversationId)
    if (!check.allowed) {
      return NextResponse.json({ error: check.reason }, { status: 403 })
    }

    const needsModQueue = reviewTextNeedsModeration(body.text)
    const reviewModerationState = needsModQueue ? "PENDING_MODERATION" : "PUBLISHED"

    const review = await prisma.review.create({
      data: {
        authorId: user.id,
        targetUserId: body.targetUserId,
        listingId: body.listingId ?? null,
        conversationId: body.conversationId ?? null,
        rating: body.rating,
        text: body.text?.trim() ?? null,
        reviewModerationState,
      },
    })

    await recalculateUserRating(body.targetUserId)

    if (reviewModerationState === "PUBLISHED") {
      if (body.rating >= 4) {
        void addUserTrustEvent(body.targetUserId, "POSITIVE_REVIEW", {
          reason: `Оценка ${body.rating}`,
          metadata: { reviewId: review.id, authorId: user.id },
        }).catch(() => {})
      } else if (body.rating <= 2) {
        void addUserTrustEvent(body.targetUserId, "NEGATIVE_REVIEW", {
          reason: `Оценка ${body.rating}`,
          metadata: { reviewId: review.id, authorId: user.id },
        }).catch(() => {})
      }
    }
    void recalculateUserTrust(body.targetUserId).catch(() => {})
    void recalculateUserTrust(user.id).catch(() => {})

    return NextResponse.json({ ok: true, review }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("POST /api/reviews error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
