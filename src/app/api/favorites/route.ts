import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      include: {
        listing: {
          include: {
            seller: { select: { id: true, name: true, avatar: true, rating: true, isVerified: true } },
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ favorites: favorites.map((f) => f.listing) })
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

const schema = z.object({ listingId: z.string() })

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

    const body = await request.json()
    const { listingId } = schema.parse(body)

    const existing = await prisma.favorite.findUnique({
      where: { userId_listingId: { userId: user.id, listingId } },
    })

    if (existing) {
      await prisma.favorite.delete({
        where: { userId_listingId: { userId: user.id, listingId } },
      })
      return NextResponse.json({ favorited: false })
    }

    await prisma.favorite.create({
      data: { userId: user.id, listingId },
    })

    return NextResponse.json({ favorited: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Неверные данные' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
