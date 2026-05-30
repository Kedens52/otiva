import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { findWantToBuyForViewer } from "@/lib/want-to-buy/access"
import { resolveInternalListingReference } from "@/lib/want-to-buy/listing-link"
import { notifyWantToBuyNewOffer } from "@/lib/want-to-buy/notify"
import { checkWantToBuyOfferRateLimit } from "@/lib/want-to-buy/rate-limit"
import { createOfferSchema } from "@/lib/want-to-buy/schemas"
import { getListingPublicPath } from "@/lib/seo/paths"

export const dynamic = "force-dynamic"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const seller = await getCurrentUser()
    if (!seller) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const restrictions = await prisma.user.findUnique({
      where: { id: seller.id },
      select: { accountRestricted: true },
    })
    if (restrictions?.accountRestricted) {
      return NextResponse.json(
        { error: "По правилам сервиса это действие требует дополнительной проверки." },
        { status: 403 },
      )
    }

    const found = await findWantToBuyForViewer(params.id, seller.id)
    if (!found?.isPublic) {
      return NextResponse.json(
        { error: "Заявка недоступна для отклика" },
        { status: 404 },
      )
    }

    const { row } = found
    if (row.userId === seller.id) {
      return NextResponse.json(
        { error: "Нельзя откликнуться на свою заявку" },
        { status: 403 },
      )
    }

    const existingOffer = await prisma.wantToBuyOffer.findUnique({
      where: {
        wantToBuyId_sellerId: {
          wantToBuyId: row.id,
          sellerId: seller.id,
        },
      },
      select: { id: true },
    })
    if (existingOffer) {
      return NextResponse.json(
        { error: "Вы уже отправили отклик на эту заявку" },
        { status: 409 },
      )
    }

    const allowedByRate = await checkWantToBuyOfferRateLimit(seller.id)
    if (!allowedByRate) {
      return NextResponse.json(
        { error: "Не более 10 откликов в сутки. Попробуйте завтра." },
        { status: 429 },
      )
    }

    const body = await request.json()
    const data = createOfferSchema.parse(body)

    const listingRef = resolveInternalListingReference({
      listingId: data.listingId,
      listingPath: data.listingPath,
    })
    if (!listingRef.ok) {
      return NextResponse.json({ error: listingRef.error }, { status: 400 })
    }

    let listingId: string | null = listingRef.listingId ?? null
    if (listingId) {
      const listing = await prisma.listing.findFirst({
        where: {
          id: listingId,
          sellerId: seller.id,
          status: "ACTIVE",
        },
        select: { id: true },
      })
      if (!listing) {
        return NextResponse.json(
          { error: "Укажите своё активное объявление на Нашло" },
          { status: 400 },
        )
      }
    }

    const offer = await prisma.wantToBuyOffer.create({
      data: {
        wantToBuyId: row.id,
        sellerId: seller.id,
        message: data.message,
        price: data.price,
        listingId,
        status: "PENDING",
      },
      include: {
        listing: {
          select: { id: true, title: true, slug: true, city: true },
        },
      },
    })

    void notifyWantToBuyNewOffer({
      buyerUserId: row.userId,
      sellerName: seller.name,
      wantToBuyId: row.id,
      title: row.title,
    })

    return NextResponse.json(
      {
        offer: {
          id: offer.id,
          status: offer.status,
          price: offer.price,
          message: offer.message,
          listingId: offer.listingId,
          listingPath: offer.listing
            ? getListingPublicPath({
                id: offer.listing.id,
                slug: offer.listing.slug,
                title: offer.listing.title,
                city: offer.listing.city,
              })
            : null,
          createdAt: offer.createdAt.toISOString(),
        },
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Проверьте поля формы" }, { status: 400 })
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Вы уже отправили отклик на эту заявку" },
        { status: 409 },
      )
    }
    console.error("want-to-buy offer POST error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
