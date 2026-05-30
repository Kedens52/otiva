import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const db = prisma as any

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getCurrentUser()
    if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

    const s = await db.session.findUnique({ where: { id: params.id } })
    if (!s || s.userId !== session.id) {
      return NextResponse.json({ error: 'Не найдено' }, { status: 404 })
    }

    await db.session.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('DELETE /api/profile/sessions/[id]', e)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

