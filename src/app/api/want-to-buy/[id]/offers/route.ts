import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { parseWantToBuyOfferSort, wantToBuyOfferOrderBy } from "@/lib/want-to-buy/offer-sort"
import { serializeWantToBuyOfferForOwner } from "@/lib/want-to-buy/serialize"
import { WANT_TO_BUY_OFFER_SELLER_SELECT } from "@/lib/want-to-buy/selects"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const wantToBuy = await prisma.wantToBuy.findUnique({
      where: { id: params.id },
      select: { id: true, userId: true, title: true },
    })
    if (!wantToBuy || wantToBuy.userId !== user.id) {
      return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 })
    }

    const sort = parseWantToBuyOfferSort(request.nextUrl.searchParams.get("sort"))

    const offers = await prisma.wantToBuyOffer.findMany({
      where: { wantToBuyId: wantToBuy.id },
      orderBy: wantToBuyOfferOrderBy(sort),
      include: {
        seller: { select: WANT_TO_BUY_OFFER_SELLER_SELECT },
        listing: {
          select: { id: true, title: true, slug: true, city: true, status: true },
        },
      },
    })

    return NextResponse.json({
      wantToBuyId: wantToBuy.id,
      title: wantToBuy.title,
      sort,
      items: offers.map(serializeWantToBuyOfferForOwner),
    })
  } catch (error) {
    console.error("want-to-buy offers GET error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
