import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const VALID_REASONS = [
  "Спам",
  "Оскорбления",
  "Ложная информация",
  "Не было сделки",
  "Мошенничество",
  "Другое",
]

const reportSchema = z.object({
  reason: z.string().min(1).refine(
    (r) => VALID_REASONS.includes(r),
    { message: "Недопустимая причина жалобы" },
  ),
  comment: z.string().max(500).optional(),
})

const AUTO_HIDE_THRESHOLD = 3

/**
 * POST /api/reviews/[id]/report
 * Жалоба на отзыв. Нельзя жаловаться дважды.
 * При >= AUTO_HIDE_THRESHOLD жалоб — автоматически переводим в REPORTED.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

    const review = await prisma.review.findUnique({
      where: { id: params.id },
      select: { id: true, authorId: true, isDeleted: true, reportCount: true },
    })

    if (!review || review.isDeleted) {
      return NextResponse.json({ error: "Отзыв не найден" }, { status: 404 })
    }

    // Нельзя жаловаться на свой отзыв
    if (review.authorId === user.id) {
      return NextResponse.json({ error: "Нельзя жаловаться на собственный отзыв" }, { status: 400 })
    }

    // Проверяем дубль жалобы
    const existing = await prisma.reviewReport.findUnique({
      where: { reviewId_reporterId: { reviewId: params.id, reporterId: user.id } },
    })
    if (existing) {
      return NextResponse.json({ error: "Вы уже жаловались на этот отзыв" }, { status: 409 })
    }

    const body = reportSchema.parse(await req.json())

    const newCount = (review.reportCount ?? 0) + 1
    const shouldAutoHide = newCount >= AUTO_HIDE_THRESHOLD

    await prisma.$transaction([
      prisma.reviewReport.create({
        data: {
          reviewId: params.id,
          reporterId: user.id,
          reason: body.reason,
          comment: body.comment?.trim() ?? null,
        },
      }),
      prisma.review.update({
        where: { id: params.id },
        data: {
          reportCount: newCount,
          ...(shouldAutoHide
            ? { reviewModerationState: "REPORTED", reviewStatus: "REPORTED" }
            : {}),
        },
      }),
    ])

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("POST /api/reviews/[id]/report error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
