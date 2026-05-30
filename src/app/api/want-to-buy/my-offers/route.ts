import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getListingPublicPath } from "@/lib/seo/paths"
import { getWantToBuyDetailPath } from "@/lib/want-to-buy/routes"

export const dynamic = "force-dynamic"

/** Отклики текущего пользователя как продавца (для /profile/my-offers). */
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const offers = await prisma.wantToBuyOffer.findMany({
      where: { sellerId: user.id },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        wantToBuy: {
          select: {
            id: true,
            title: true,
            status: true,
            city: true,
            priceMax: true,
            category: { select: { slug: true } },
          },
        },
        listing: {
          select: { id: true, title: true, slug: true, city: true },
        },
      },
    })

    return NextResponse.json({
      items: offers.map((offer) => ({
        id: offer.id,
        status: offer.status,
        price: offer.price,
        message: offer.message,
        createdAt: offer.createdAt.toISOString(),
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
    console.error("want-to-buy my-offers GET error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
