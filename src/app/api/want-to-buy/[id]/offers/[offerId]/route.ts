import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  notifyWantToBuyOfferAccepted,
  notifyWantToBuyOfferDeclined,
} from "@/lib/want-to-buy/notify"
import { patchOfferSchema } from "@/lib/want-to-buy/schemas"
import { serializeWantToBuyOfferForOwner } from "@/lib/want-to-buy/serialize"
import { WANT_TO_BUY_OFFER_SELLER_SELECT } from "@/lib/want-to-buy/selects"

export const dynamic = "force-dynamic"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; offerId: string } },
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const wantToBuy = await prisma.wantToBuy.findUnique({
      where: { id: params.id },
      select: { id: true, userId: true, title: true, status: true },
    })
    if (!wantToBuy || wantToBuy.userId !== user.id) {
      return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 })
    }

    const offer = await prisma.wantToBuyOffer.findFirst({
      where: { id: params.offerId, wantToBuyId: wantToBuy.id },
      select: { id: true, sellerId: true, status: true },
    })
    if (!offer) {
      return NextResponse.json({ error: "Отклик не найден" }, { status: 404 })
    }

    const body = await request.json()
    const { action } = patchOfferSchema.parse(body)

    if (action === "viewed") {
      if (offer.status !== "PENDING") {
        return NextResponse.json({ error: "Отклик уже обработан" }, { status: 400 })
      }
      const updated = await prisma.wantToBuyOffer.update({
        where: { id: offer.id },
        data: { status: "VIEWED" },
        include: {
          seller: { select: WANT_TO_BUY_OFFER_SELLER_SELECT },
          listing: {
            select: { id: true, title: true, slug: true, city: true, status: true },
          },
        },
      })
      return NextResponse.json({ offer: serializeWantToBuyOfferForOwner(updated) })
    }

    if (action === "decline") {
      if (offer.status === "ACCEPTED" || offer.status === "DECLINED") {
        return NextResponse.json({ error: "Отклик уже обработан" }, { status: 400 })
      }
      const updated = await prisma.wantToBuyOffer.update({
        where: { id: offer.id },
        data: { status: "DECLINED" },
        include: {
          seller: { select: WANT_TO_BUY_OFFER_SELLER_SELECT },
          listing: {
            select: { id: true, title: true, slug: true, city: true, status: true },
          },
        },
      })
      void notifyWantToBuyOfferDeclined({
        sellerUserId: offer.sellerId,
        title: wantToBuy.title,
        wantToBuyId: wantToBuy.id,
      })
      return NextResponse.json({ offer: serializeWantToBuyOfferForOwner(updated) })
    }

    if (wantToBuy.status === "CLOSED") {
      return NextResponse.json({ error: "Заявка уже закрыта" }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const accepted = await tx.wantToBuyOffer.update({
        where: { id: offer.id },
        data: { status: "ACCEPTED" },
        include: {
          seller: { select: WANT_TO_BUY_OFFER_SELLER_SELECT },
          listing: {
            select: { id: true, title: true, slug: true, city: true, status: true },
          },
        },
      })

      await tx.wantToBuyOffer.updateMany({
        where: {
          wantToBuyId: wantToBuy.id,
          id: { not: offer.id },
          status: { in: ["PENDING", "VIEWED"] },
        },
        data: { status: "DECLINED" },
      })

      await tx.wantToBuy.update({
        where: { id: wantToBuy.id },
        data: { status: "CLOSED" },
      })

      return accepted
    })

    void notifyWantToBuyOfferAccepted({
      sellerUserId: offer.sellerId,
      wantToBuyId: wantToBuy.id,
    })

    return NextResponse.json({ offer: serializeWantToBuyOfferForOwner(result) })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Некорректное действие" }, { status: 400 })
    }
    console.error("want-to-buy offer PATCH error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
