import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'
import type { ListingStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !['ADMIN', 'MODERATOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
    }

    const { searchParams } = request.nextUrl
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const pageSize = Math.min(50, parseInt(searchParams.get('pageSize') || '20'))
    const status = searchParams.get('status') as ListingStatus | null
    const query = searchParams.get('q')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { seller: { phone: { contains: query } } },
      ]
    }

    const [items, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          seller: { select: { id: true, name: true, phone: true, avatar: true } },
          category: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.listing.count({ where }),
    ])

    return NextResponse.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

const moderateSchema = z.object({
  listingId: z.string(),
  action: z.enum(['APPROVED', 'REJECTED']),
  reason: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !['ADMIN', 'MODERATOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
    }

    const body = await request.json()
    const { listingId, action, reason } = moderateSchema.parse(body)

    const newStatus: ListingStatus = action === 'APPROVED' ? 'ACTIVE' : 'REJECTED'

    const [listing] = await prisma.$transaction([
      prisma.listing.update({
        where: { id: listingId },
        data: { status: newStatus },
      }),
      prisma.moderationLog.create({
        data: {
          listingId,
          moderatorId: user.id,
          action,
          reason,
        },
      }),
    ])

    return NextResponse.json({ listing })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
