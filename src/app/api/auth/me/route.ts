import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, clearAuthCookie } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    return NextResponse.json({ user })
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

const updateSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  description: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  avatar: z.string().url().optional(),
})

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await request.json()
    const data = updateSchema.parse(body)

    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
      select: {
        id: true,
        phone: true,
        name: true,
        avatar: true,
        description: true,
        city: true,
        role: true,
        isVerified: true,
        rating: true,
        reviewCount: true,
        createdAt: true,
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

export async function DELETE() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    clearAuthCookie()
    return NextResponse.json({ message: 'Вы вышли из системы' })
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
