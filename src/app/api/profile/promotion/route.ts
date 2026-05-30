import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// Прайс-лист: serviceType -> durationDays -> price (рубли)
const PRICE_TABLE: Record<string, Record<number, number>> = {
  BUMP:      { 1: 49,  3: 99,  7: 199 },
  HIGHLIGHT: { 3: 79,  7: 149 },
  PIN:       { 1: 149, 3: 299, 7: 499 },
  TURBO:     { 3: 299, 7: 499 },
}

const applySchema = z.object({
  listingId:    z.string().min(1),
  serviceType:  z.enum(["BUMP", "HIGHLIGHT", "PIN", "TURBO"]),
  durationDays: z.number().int().positive(),
})

// GET — список активных объявлений и услуг
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const db = prisma as any

  const [listings, services] = await Promise.all([
    db.listing.findMany({
      where: { sellerId: user.id, status: "ACTIVE" },
      select: {
        id: true, title: true, price: true, images: true, views: true,
        promotedUntil: true, highlightedUntil: true, pinnedUntil: true,
        category: { select: { nameRu: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.paidService.findMany({
      where: { userId: user.id, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ])

  return NextResponse.json({ listings, services, priceTable: PRICE_TABLE })
}

// POST — подключить услугу
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = applySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Неверные данные" }, { status: 400 })

  const { listingId, serviceType, durationDays } = parsed.data

  const db = prisma as any

  const listing = await db.listing.findFirst({
    where: { id: listingId, sellerId: user.id, status: "ACTIVE" },
  })
  if (!listing) return NextResponse.json({ error: "Объявление не найдено" }, { status: 404 })

  const price = PRICE_TABLE[serviceType]?.[durationDays]
  if (!price) return NextResponse.json({ error: "Неверный тариф" }, { status: 400 })

  const account = await db.user.findUnique({
    where: { id: user.id },
    select: { walletBalance: true },
  })
  if (!account || account.walletBalance < price) {
    return NextResponse.json({ error: "Недостаточно средств на балансе", needTopUp: true }, { status: 402 })
  }

  const now    = new Date()
  const endsAt = new Date(now.getTime() + durationDays * 86_400_000)

  await db.$transaction(async (tx: typeof db) => {
    await tx.user.update({
      where: { id: user.id },
      data:  { walletBalance: { decrement: price } },
    })

    await tx.walletTransaction.create({
      data: {
        userId:      user.id,
        type:        "DEBIT",
        status:      "COMPLETED",
        amount:      -price,
        balanceAfter: account.walletBalance - price,
        title:       `Продвижение: ${serviceType} × ${durationDays} дн.`,
        listingId,
      },
    })

    const listingUpdate: Record<string, unknown> = {}
    if (serviceType === "BUMP" || serviceType === "TURBO") {
      listingUpdate.promotedUntil = endsAt
      listingUpdate.isPromoted    = true
    }
    if (serviceType === "HIGHLIGHT" || serviceType === "TURBO") {
      listingUpdate.highlightedUntil = endsAt
    }
    if (serviceType === "PIN") {
      listingUpdate.pinnedUntil = endsAt
    }
    await tx.listing.update({ where: { id: listingId }, data: listingUpdate })

    await tx.paidService.create({
      data: {
        userId: user.id,
        listingId,
        serviceType,
        durationDays,
        price,
        status:   "ACTIVE",
        startsAt: now,
        endsAt,
      },
    })
  })

  return NextResponse.json({ ok: true, message: "Услуга подключена" })
}
