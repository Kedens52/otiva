import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

const updateSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().min(10).max(3000).optional(),
  price: z.number().min(0).max(1_000_000_000).optional(),
  images: z.array(z.string()).min(1).max(10).optional(),
  location: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  attributes: z.record(z.unknown()).optional(),
  status: z.enum(['ACTIVE', 'SOLD', 'ARCHIVED']).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            avatar: true,
            phone: true,
            rating: true,
            reviewCount: true,
            isVerified: true,
            createdAt: true,
          },
        },
        category: true,
        _count: { select: { favorites: true } },
      },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Объявление не найдено' }, { status: 404 })
    }

    // Increment views (fire and forget)
    prisma.listing.update({
      where: { id: params.id },
      data: { views: { increment: 1 } },
    }).catch(console.error)

    return NextResponse.json({ listing })
  } catch (error) {
    console.error('listing GET error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const listing = await prisma.listing.findUnique({ where: { id: params.id } })
    if (!listing) {
      return NextResponse.json({ error: 'Не найдено' }, { status: 404 })
    }

    const isOwner = listing.sellerId === user.id
    const isAdmin = ['ADMIN', 'MODERATOR'].includes(user.role)

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
    }

    const body = await request.json()
    const data = updateSchema.parse(body)

    // Non-admins cannot change status to ACTIVE directly (requires moderation)
    if (!isAdmin && data.status === 'ACTIVE') {
      delete data.status
    }

    const updated = await prisma.listing.update({
      where: { id: params.id },
      data: {
        ...data,
        attributes: data.attributes as Prisma.InputJsonValue | undefined,
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            avatar: true,
            phone: true,
            rating: true,
            reviewCount: true,
            isVerified: true,
          },
        },
        category: true,
      },
    })

    return NextResponse.json({ listing: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const listing = await prisma.listing.findUnique({ where: { id: params.id } })
    if (!listing) {
      return NextResponse.json({ error: 'Не найдено' }, { status: 404 })
    }

    const isOwner = listing.sellerId === user.id
    const isAdmin = ['ADMIN', 'MODERATOR'].includes(user.role)

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
    }

    await prisma.listing.delete({ where: { id: params.id } })

    return NextResponse.json({ message: 'Удалено' })
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
