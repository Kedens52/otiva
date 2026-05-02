import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const seller = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        avatar: true,
        description: true,
        city: true,
        isVerified: true,
        rating: true,
        reviewCount: true,
        createdAt: true,
        listings: {
          where: { status: 'ACTIVE' },
          include: { category: true, _count: { select: { favorites: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        reviews: {
          include: {
            author: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!seller) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    return NextResponse.json({ seller })
  } catch (error) {
    console.error('profile GET error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
