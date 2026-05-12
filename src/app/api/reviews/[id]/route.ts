import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUser } from "@/lib/auth"
import { recalculateUserRating } from "@/lib/reviews/user-reviews"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const updateSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  text: z.string().max(1000).optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const review = await prisma.review.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        rating: true,
        text: true,
        createdAt: true,
        updatedAt: true,
        listingId: true,
        conversationId: true,
        isHidden: true,
        reviewModerationState: true,
        author: { select: { id: true, name: true, avatar: true } },
        targetUser: { select: { id: true, name: true } },
        listing: { select: { id: true, title: true } },
      },
    })
    if (!review || review.isHidden || review.reviewModerationState !== "PUBLISHED") {
      return NextResponse.json({ error: "Отзыв не найден" }, { status: 404 })
    }
    return NextResponse.json({ ok: true, review })
  } catch (error) {
    console.error("GET /api/reviews/[id] error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

    const review = await prisma.review.findUnique({ where: { id: params.id } })
    if (!review || review.isDeleted) {
      return NextResponse.json({ error: "Отзыв не найден" }, { status: 404 })
    }
    if (review.authorId !== user.id) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 })
    }

    const body = updateSchema.parse(await req.json())
    const updated = await prisma.review.update({
      where: { id: params.id },
      data: {
        ...(body.rating !== undefined ? { rating: body.rating } : {}),
        ...(body.text !== undefined ? { text: body.text.trim() } : {}),
      },
    })

    await recalculateUserRating(review.targetUserId)
    return NextResponse.json({ ok: true, review: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("PATCH /api/reviews/[id] error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

    const review = await prisma.review.findUnique({ where: { id: params.id } })
    if (!review || review.isDeleted) {
      return NextResponse.json({ error: "Отзыв не найден" }, { status: 404 })
    }
    if (review.authorId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 })
    }

    await prisma.review.update({
      where: { id: params.id },
      data: { isDeleted: true },
    })
    await recalculateUserRating(review.targetUserId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("DELETE /api/reviews/[id] error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
