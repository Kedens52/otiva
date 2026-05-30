import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { reviewTextRiskLevel } from "@/lib/reviews/risk-score"

export const dynamic = "force-dynamic"

const replySchema = z.object({
  text: z.string().min(1, "Напишите ответ").max(500, "Ответ не может быть длиннее 500 символов").trim(),
})

/**
 * POST /api/reviews/[id]/reply
 * Ответ получателя отзыва. Только targetUser. Один ответ на отзыв.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

    const review = await prisma.review.findUnique({
      where: { id: params.id },
      select: { id: true, targetUserId: true, replyText: true, isDeleted: true },
    })

    if (!review || review.isDeleted) {
      return NextResponse.json({ error: "Отзыв не найден" }, { status: 404 })
    }
    if (review.targetUserId !== user.id) {
      return NextResponse.json({ error: "Ответить может только получатель отзыва" }, { status: 403 })
    }
    if (review.replyText) {
      return NextResponse.json({ error: "Вы уже ответили на этот отзыв" }, { status: 409 })
    }

    const body = replySchema.parse(await req.json())

    // Проверка на подозрительный текст
    const riskLevel = reviewTextRiskLevel(body.text)
    if (riskLevel === "reject") {
      return NextResponse.json({ error: "Ответ содержит недопустимые слова или ссылки" }, { status: 400 })
    }

    const updated = await prisma.review.update({
      where: { id: params.id },
      data: { replyText: body.text, repliedAt: new Date() },
      select: { id: true, replyText: true, repliedAt: true },
    })

    return NextResponse.json({ ok: true, review: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("POST /api/reviews/[id]/reply error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
