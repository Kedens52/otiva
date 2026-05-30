import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const ALLOWED_STATUSES = ['ACTIVE', 'MODERATION', 'REJECTED', 'SOLD', 'ARCHIVED']

// GET /api/profile/listings?status=ACTIVE&page=1
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser()
    if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

    const { searchParams } = request.nextUrl
    const status = searchParams.get('status')
    const page   = Math.max(1, Number(searchParams.get('page') ?? '1'))
    const take   = 12

    const where = {
      sellerId: session.id,
      ...(status && ALLOWED_STATUSES.includes(status) ? { status: status as never } : {}),
    }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where, take, skip: (page - 1) * take,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { nameRu: true, slug: true } },
          _count:   { select: { favorites: true } },
        },
      }),
      prisma.listing.count({ where }),
    ])

    return NextResponse.json({ listings, total, page, pages: Math.ceil(total / take) })
  } catch (e) {
    console.error('GET /api/profile/listings', e)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

