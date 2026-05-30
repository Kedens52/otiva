import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notificationsSchema } from '@/lib/validators/profile'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest) {
  try {
    const session = await getCurrentUser()
    if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

    const body = await request.json()
    const data = notificationsSchema.parse(body)

    await (prisma.user.update as any)({
      where: { id: session.id },
      data: { notificationSettings: data },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 })
    console.error('PATCH /api/profile/notifications', e)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

