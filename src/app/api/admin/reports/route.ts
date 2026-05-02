import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || !['ADMIN', 'MODERATOR'].includes(user.role)) return null
  return user
}

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })

  try {
    const reports = await prisma.report.findMany({
      include: {
        listing: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    return NextResponse.json({ reports })
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })

  try {
    const { id, status } = await request.json()
    if (!id || !status) return NextResponse.json({ error: 'Неверные данные' }, { status: 400 })

    await prisma.report.update({
      where: { id },
      data: { status },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
