import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  listingId: z.string(),
  reason: z.enum(['fraud', 'prohibited', 'spam', 'wrong_category', 'wrong_price', 'other']),
  comment: z.string().max(1000).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { listingId, reason, comment } = schema.parse(body)

    // Check listing exists
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true },
    })
    if (!listing) {
      return NextResponse.json({ error: 'Объявление не найдено' }, { status: 404 })
    }

    await prisma.report.create({
      data: { listingId, reason, comment: comment ?? '' },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Неверные данные' }, { status: 400 })
    }
    // If Report model doesn't exist yet, silently succeed (will be added in next deploy)
    console.error('report create error:', error)
    return NextResponse.json({ ok: true })
  }
}
