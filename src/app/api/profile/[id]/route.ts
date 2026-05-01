import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { listings } from '@/lib/mock-marketplace'

function mockProfile(id: string) {
  return NextResponse.json({
    seller: {
      id,
      name: id === 'demo' ? 'ANTONOV I' : 'Демо продавец',
      avatar: null,
      description: 'Демо-профиль на мок-данных, пока база не подключена.',
      city: 'Санкт-Петербург',
      isVerified: true,
      rating: 4.9,
      reviewCount: 21,
      createdAt: new Date('2026-01-01').toISOString(),
      listings: listings.slice(0, 6),
      reviews: [],
    },
    source: 'mock',
  })
}

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
      return mockProfile(params.id)
    }

    return NextResponse.json({ seller })
  } catch (error) {
    console.error('profile GET fallback to mock:', error)
    return mockProfile(params.id)
  }
}
