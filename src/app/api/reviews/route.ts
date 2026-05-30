import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUser } from "@/lib/auth"
import {
  canUserReviewTarget,
  recalculateUserRating,
  getAuthorReviewCounts,
  getMutualReviewCount,
  countSimilarTexts,
} from "@/lib/reviews/user-reviews"
import { reviewTextNeedsModeration } from "@/lib/reviews/abusive-review"
import { calculateReviewRiskScore } from "@/lib/reviews/risk-score"
import { prisma } from "@/lib/prisma"
import { addUserTrustEvent, recalculateUserTrust } from "@/lib/user-trust-engine"

export const dynamic = "force-dynamic"

const ALLOWED_TAGS = [
  "Всё отлично",
  "Быстро договорились",
  "Товар соответствует описанию",
  "Приятное общение",
  "Надёжный пользователь",
  "Были сложности",
  "Не рекомендую",
]

const createSchema = z
  .object({
    targetUserId: z.string().min(1).optional(),
    sellerId: z.string().min(1).optional(),
    listingId: z.string().optional(),
    conversationId: z.string().optional(),
    dealId: z.string().optional(),
    rating: z.number().int().min(1, "Оценка должна быть от 1 до 5").max(5, "Оценка должна быть от 1 до 5"),
    text: z
      .string()
      .min(10, "Напишите отзыв подробнее (минимум 10 символов)")
      .max(1000, "Отзыв не может быть длиннее 1000 символов")
      .trim(),
    tags: z
      .array(z.string().refine((t) => ALLOWED_TAGS.includes(t), { message: "Недопустимый тег" }))
      .max(4)
      .optional()
      .default([]),
  })
  .transform((b) => ({ ...b, targetUserId: b.targetUserId ?? b.sellerId ?? "" }))
  .refine((b) => Boolean(b.targetUserId?.trim()), { message: "Укажите пользователя" })

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

    if (user.isBanned) {
      return NextResponse.json({ error: "Ваш аккаунт заблокирован" }, { status: 403 })
    }

    const body = createSchema.parse(await req.json())

    if (user.id === body.targetUserId) {
      return NextResponse.json({ error: "Вы не можете оставить отзыв самому себе" }, { status: 403 })
    }

    const target = await prisma.user.findUnique({
      where: { id: body.targetUserId },
      select: { id: true },
    })
    if (!target) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 })

    // Check permission
    const check = await canUserReviewTarget(
      user.id,
      body.targetUserId,
      body.listingId,
      body.conversationId,
      body.dealId,
    )
    if (!check.allowed) {
      return NextResponse.json({ error: check.reason }, { status: 403 })
    }

    // Rate limit
    const rateCounts = await getAuthorReviewCounts(user.id)
    if (rateCounts.inHour >= 3) {
      return NextResponse.json({ error: "Слишком много отзывов за короткое время. Подождите." }, { status: 429 })
    }
    if (rateCounts.inDay >= 10) {
      return NextResponse.json({ error: "Достигнут дневной лимит отзывов." }, { status: 429 })
    }

    // Calculate risk score
    const [mutualCount, similarCount] = await Promise.all([
      getMutualReviewCount(user.id, body.targetUserId),
      countSimilarTexts(user.id, body.text),
    ])

    const riskResult = calculateReviewRiskScore({
      text: body.text,
      rating: body.rating,
      authorCreatedAt: new Date((user as { createdAt?: Date | string }).createdAt ?? Date.now()),
      authorHasAvatar: Boolean((user as { avatar?: string | null }).avatar),
      authorHasPhone: Boolean(user.phone),
      authorHasVerifiedPhone: Boolean((user as { phoneVerifiedAt?: Date | null }).phoneVerifiedAt),
      authorReviewsToday: rateCounts.inDay,
      authorReviewsInHour: rateCounts.inHour,
      similarTextCount: similarCount,
      mutualReviewCount: mutualCount,
      authorIp: null,
      targetUserIp: null,
    })

    if (riskResult.recommendation === "REJECTED") {
      return NextResponse.json(
        { error: "Отзыв не прошёл проверку. Пожалуйста, напишите его корректно." },
        { status: 400 },
      )
    }

    const needsAbusiveCheck = reviewTextNeedsModeration(body.text)
    const isPending = needsAbusiveCheck || riskResult.recommendation === "PENDING"
    const reviewModerationState = isPending ? "PENDING_MODERATION" : "PUBLISHED"

    const review = await prisma.review.create({
      data: {
        authorId: user.id,
        targetUserId: body.targetUserId,
        listingId: body.listingId ?? null,
        conversationId: body.conversationId ?? null,
        dealId: body.dealId ?? null,
        rating: body.rating,
        text: body.text,
        tags: body.tags ?? [],
        reviewModerationState,
        reviewStatus: isPending ? "PENDING" : "PUBLISHED",
        riskScore: riskResult.score,
        moderationNote: riskResult.reasons.length > 0 ? riskResult.reasons.join("; ") : null,
      },
    })

    if (!isPending) {
      await recalculateUserRating(body.targetUserId)
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

    if (!isPending) {
      const { tryReviewBonuses } = await import("@/lib/bonuses/hooks")
      void tryReviewBonuses(
        {
          id: review.id,
          authorId: review.authorId,
          targetUserId: review.targetUserId,
          rating: review.rating,
          reviewStatus: review.reviewStatus,
        },
        prisma,
      ).catch(() => {})
    }

    const message = isPending
      ? "Отзыв отправлен на модерацию"
      : "Отзыв опубликован"

    return NextResponse.json({ ok: true, review, message }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("POST /api/reviews error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
