import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { BONUS_SPEND_OFFERS } from "@/lib/bonuses/rules"
import { spendBonus } from "@/lib/bonuses/service"
import { isQualityListing } from "@/lib/bonuses/quality"

export const dynamic = "force-dynamic"

const OFFER_KEYS = Object.keys(BONUS_SPEND_OFFERS) as (keyof typeof BONUS_SPEND_OFFERS)[]

const schema = z.object({
  listingId: z.string().min(1),
  offer: z.enum(OFFER_KEYS as [keyof typeof BONUS_SPEND_OFFERS, ...Array<keyof typeof BONUS_SPEND_OFFERS>]),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

    const body = schema.parse(await req.json())
    const offer = BONUS_SPEND_OFFERS[body.offer]

    const listing = await prisma.listing.findFirst({
      where: { id: body.listingId, sellerId: user.id, status: "ACTIVE" },
      select: { id: true, title: true, description: true, images: true, status: true },
    })
    if (!listing) {
      return NextResponse.json({ error: "Объявление не найдено" }, { status: 404 })
    }
    if (!isQualityListing(listing)) {
      return NextResponse.json({
        error: "Сначала улучшите объявление: 3+ фото и описание от 50 символов",
      }, { status: 400 })
    }

    const refKey = `spend:${body.offer}:${listing.id}:${new Date().toISOString().slice(0, 10)}`
    const spent = await spendBonus(user.id, offer.reason, offer.points, refKey, listing.id)
    if (!spent.ok) {
      return NextResponse.json(
        { error: spent.message, code: spent.code, need: offer.points },
        { status: spent.code === "INSUFFICIENT" ? 402 : 400 },
      )
    }

    const now = new Date()
    const endsAt = new Date(now.getTime() + offer.days * 86_400_000)
    const update: Record<string, unknown> = {}

    if (offer.service === "BUMP") {
      update.promotedUntil = endsAt
      update.isPromoted = true
    } else if (offer.service === "HIGHLIGHT") {
      update.highlightedUntil = endsAt
    } else if (offer.service === "RECOMMENDATIONS") {
      update.recommendedUntil = endsAt
    } else if (offer.service === "AUTOBOOST") {
      update.autoboostUntil = endsAt
      update.promotedUntil = endsAt
      update.isPromoted = true

    } else if (offer.service === "PROMO_DISCOUNT") {
      // Promo discount is applied at payment step -- no listing date update needed
    }

    if (Object.keys(update).length > 0) {
      await prisma.listing.update({ where: { id: listing.id }, data: update })
    }

    return NextResponse.json({
      ok: true,
      balance: spent.balanceAfter,
      promotedUntil: update.promotedUntil ?? null,
      highlightedUntil: update.highlightedUntil ?? null,
      recommendedUntil: update.recommendedUntil ?? null,
      autoboostUntil: update.autoboostUntil ?? null,
    })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message ?? "\u041d\u0435\u0432\u0435\u0440\u043d\u044b\u0435 \u0434\u0430\u043d\u043d\u044b\u0435" }, { status: 400 })
    }
    console.error("[bonuses/spend]", e)
    return NextResponse.json({ error: "\u041e\u0448\u0438\u0431\u043a\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430" }, { status: 500 })
  }
}
