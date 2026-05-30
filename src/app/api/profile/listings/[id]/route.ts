import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// PATCH /api/profile/listings/[id] — сменить статус
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentUser()
    if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

    const listing = await prisma.listing.findFirst({ where: { id: params.id, sellerId: session.id } })
    if (!listing) return NextResponse.json({ error: 'Не найдено' }, { status: 404 })

    const { status } = await request.json()
    const allowed = ['ACTIVE', 'ARCHIVED']
    if (!allowed.includes(status)) return NextResponse.json({ error: 'Недопустимый статус' }, { status: 400 })

    const updated = await prisma.listing.update({ where: { id: params.id }, data: { status } })
    return NextResponse.json({ listing: updated })
  } catch (e) {
    console.error('PATCH /api/profile/listings/[id]', e)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

// DELETE /api/profile/listings/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentUser()
    if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

    const listing = await prisma.listing.findFirst({ where: { id: params.id, sellerId: session.id } })
    if (!listing) return NextResponse.json({ error: 'Не найдено' }, { status: 404 })

    await prisma.listing.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('DELETE /api/profile/listings/[id]', e)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

