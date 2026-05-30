import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { addUserTrustEvent, recalculateUserTrust } from '@/lib/user-trust-engine'

const schema = z.object({
  listingId: z.string().min(1).optional(),
  targetUserId: z.string().min(1).optional(),
  reason: z.enum([
    'fraud', 'prohibited', 'spam', 'wrong_category', 'wrong_price',
    'duplicate', 'false_info', 'user_abuse', 'other',
  ]),
  comment: z.string().max(1000).optional(),
  reportCategory: z.string().max(64).optional(),
}).refine((v) => Boolean(v.listingId || v.targetUserId), { message: 'Укажите объявление или пользователя' })

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json())

    if (body.listingId) {
      const listing = await prisma.listing.findUnique({
        where: { id: body.listingId },
        select: { id: true, sellerId: true },
      })
      if (!listing) {
        return NextResponse.json({ error: 'Объявление не найдено' }, { status: 404 })
      }
      await prisma.report.create({
        data: {
          listingId: body.listingId,
          reason: body.reason,
          reportCategory: body.reportCategory ?? body.reason,
          comment: body.comment ?? '',
        },
      })
      const sellerId = listing.sellerId
      if (sellerId) {
        const meta = { listingId: body.listingId, reason: body.reason }
        void addUserTrustEvent(sellerId, "REPORT_RECEIVED", {
          reason: body.reason === "fraud" ? "Жалоба: мошенничество" : "Жалоба на объявление",
          metadata: meta as object,
        }).catch(() => {})
        void recalculateUserTrust(sellerId).catch(() => {})
      }
      return NextResponse.json({ ok: true })
    }

    const u = await prisma.user.findUnique({ where: { id: body.targetUserId! }, select: { id: true } })
    if (!u) return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })

    await prisma.report.create({
      data: {
        listingId: null,
        targetUserId: body.targetUserId,
        reason: body.reason,
        reportCategory: body.reportCategory ?? body.reason,
        comment: body.comment ?? '',
      },
    })
    const tid = body.targetUserId!
    void addUserTrustEvent(tid, "REPORT_RECEIVED", {
      reason: body.reason === "fraud" ? "Жалоба: мошенничество" : "Жалоба на пользователя",
      metadata: { targetUserId: tid, reason: body.reason },
    }).catch(() => {})
    void recalculateUserTrust(tid).catch(() => {})
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Неверные данные' }, { status: 400 })
    }
    console.error('report create error:', error)
    return NextResponse.json({ ok: true })
  }
}
