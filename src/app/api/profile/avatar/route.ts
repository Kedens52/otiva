import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// DELETE /api/profile/avatar
export async function DELETE() {
  try {
    const session = await getCurrentUser()
    if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

    await prisma.user.update({ where: { id: session.id }, data: { avatar: null } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('DELETE /api/profile/avatar', e)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

