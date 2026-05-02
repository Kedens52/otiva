import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

    const listings = await prisma.listing.findMany({
      where: { sellerId: user.id },
      select: {
        id: true, title: true, price: true, city: true,
        status: true, createdAt: true, images: true, views: true,
        category: { select: { slug: true, nameRu: true } },
        _count: { select: { favorites: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ listings })
  } catch (error) {
    console.error('my-listings error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
