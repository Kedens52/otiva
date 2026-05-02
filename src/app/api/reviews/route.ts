import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

const createSchema = z.object({
  sellerId: z.string(),
  rating: z.number().int().min(1).max(5),
  text: z.string().max(1000).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

    const body = await request.json()
    const { sellerId, rating, text } = createSchema.parse(body)

    if (sellerId === user.id) {
      return NextResponse.json({ error: 'Нельзя оставить отзыв себе' }, { status: 400 })
    }

    const seller = await prisma.user.findUnique({ where: { id: sellerId } })
    if (!seller) return NextResponse.json({ error: 'Продавец не найден' }, { status: 404 })

    const review = await prisma.review.upsert({
      where: { sellerId_authorId: { sellerId, authorId: user.id } },
      update: { rating, text: text || null },
      create: { sellerId, authorId: user.id, rating, text: text || null },
      include: { author: { select: { id: true, name: true, avatar: true } } },
    })

    // Update seller rating
    const agg = await prisma.review.aggregate({
      where: { sellerId },
      _avg: { rating: true },
      _count: true,
    })
    await prisma.user.update({
      where: { id: sellerId },
      data: {
        rating: agg._avg.rating ?? 0,
        reviewCount: agg._count,
      },
    })

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('reviews POST error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
