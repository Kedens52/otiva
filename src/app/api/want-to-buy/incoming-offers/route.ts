import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getListingPublicPath } from "@/lib/seo/paths"
import { parseWantToBuyOfferSort, wantToBuyOfferOrderBy } from "@/lib/want-to-buy/offer-sort"
import { getWantToBuyDetailPath } from "@/lib/want-to-buy/routes"

export const dynamic = "force-dynamic"

/** Все отклики продавцов на заявки текущего покупателя. */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const sort = parseWantToBuyOfferSort(request.nextUrl.searchParams.get("sort"))

    const offers = await prisma.wantToBuyOffer.findMany({
      where: { wantToBuy: { userId: user.id } },
      orderBy: wantToBuyOfferOrderBy(sort),
      take: 200,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            avatar: true,
            rating: true,
            reviewCount: true,
            isVerified: true,
          },
        },
        wantToBuy: {
          select: {
            id: true,
            title: true,
            status: true,
            category: { select: { slug: true } },
          },
        },
        listing: {
          select: { id: true, title: true, slug: true, city: true },
        },
      },
    })

    return NextResponse.json({
      sort,
      items: offers.map((offer) => ({
        id: offer.id,
        status: offer.status,
        price: offer.price,
        message: offer.message,
        createdAt: offer.createdAt.toISOString(),
        seller: offer.seller,
        wantToBuy: {
          ...offer.wantToBuy,
          path: getWantToBuyDetailPath({
            id: offer.wantToBuy.id,
            categorySlug: offer.wantToBuy.category.slug,
          }),
        },
        listingId: offer.listingId,
        listingPath: offer.listing
          ? getListingPublicPath({
              id: offer.listing.id,
              slug: offer.listing.slug,
              title: offer.listing.title,
              city: offer.listing.city,
            })
          : null,
      })),
    })
  } catch (error) {
    console.error("want-to-buy incoming-offers GET error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
