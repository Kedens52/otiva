import { NextResponse } from 'next/server'
import { getCurrentUser, COOKIE_NAME } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const db = prisma as any

export async function GET() {
  try {
    const session = await getCurrentUser()
    if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

    const sessions = await db.session.findMany({
      where: { userId: session.id, expiresAt: { gt: new Date() } },
      orderBy: { lastActiveAt: 'desc' },
      select: { id: true, device: true, ip: true, lastActiveAt: true, createdAt: true, token: true },
    })
    return NextResponse.json({ sessions })
  } catch (e) {
    console.error('GET /api/profile/sessions', e)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await getCurrentUser()
    if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

    await db.session.deleteMany({ where: { userId: session.id } })

    const response = NextResponse.json({ ok: true })
    response.cookies.delete(COOKIE_NAME)
    return response
  } catch (e) {
    console.error('DELETE /api/profile/sessions', e)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

