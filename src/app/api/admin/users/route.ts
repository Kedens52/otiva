import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !['ADMIN', 'MODERATOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
    }

    const { searchParams } = request.nextUrl
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const pageSize = Math.min(50, parseInt(searchParams.get('pageSize') || '20'))
    const query = searchParams.get('q')
    const isBanned = searchParams.get('banned')

    const where: Record<string, unknown> = {}
    if (query) {
      where.OR = [
        { phone: { contains: query } },
        { name: { contains: query, mode: 'insensitive' } },
      ]
    }
    if (isBanned !== null) {
      where.isBanned = isBanned === 'true'
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          phone: true,
          name: true,
          avatar: true,
          role: true,
          isVerified: true,
          isBanned: true,
          rating: true,
          reviewCount: true,
          createdAt: true,
          _count: { select: { listings: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

const updateUserSchema = z.object({
  userId: z.string(),
  isBanned: z.boolean().optional(),
  role: z.enum(['USER', 'MODERATOR', 'ADMIN']).optional(),
})

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, isBanned, role } = updateUserSchema.parse(body)

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isBanned, role },
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        isBanned: true,
      },
    })

    return NextResponse.json({ user: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
