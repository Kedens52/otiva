import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { findWantToBuyForViewer } from "@/lib/want-to-buy/access"
import { WANT_TO_BUY_ACTIVE_DAYS } from "@/lib/want-to-buy/constants"
import { getListingPublicPath } from "@/lib/seo/paths"
import {
  evaluateWantToBuyContent,
  notifyWantToBuyContentIncident,
} from "@/lib/content-policy/want-to-buy-flow"
import { patchWantToBuySchema } from "@/lib/want-to-buy/schemas"
import { WANT_TO_BUY_CARD_INCLUDE } from "@/lib/want-to-buy/selects"
import { notifyWantToBuyRejected } from "@/lib/want-to-buy/notify"
import { serializeWantToBuyCard, serializeWantToBuyDetail } from "@/lib/want-to-buy/serialize"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const viewer = await getCurrentUser()
    const found = await findWantToBuyForViewer(params.id, viewer?.id ?? null)
    if (!found) {
      return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 })
    }

    const { row, isOwner } = found

    if (!isOwner) {
      prisma.wantToBuy
        .update({
          where: { id: row.id },
          data: { views: { increment: 1 } },
        })
        .catch(console.error)
    }

    let myOffer: {
      id: string
      status: string
      price: number
      message: string
      listingId: string | null
      listingPath: string | null
      createdAt: string
    } | null = null

    if (viewer && !isOwner) {
      const offer = await prisma.wantToBuyOffer.findUnique({
        where: {
          wantToBuyId_sellerId: {
            wantToBuyId: row.id,
            sellerId: viewer.id,
          },
        },
        include: {
          listing: {
            select: { id: true, title: true, slug: true, city: true },
          },
        },
      })
      if (offer) {
        myOffer = {
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
        }
      }
    }

    return NextResponse.json({
      item: serializeWantToBuyDetail(row, { isOwner, myOffer }),
    })
  } catch (error) {
    console.error("want-to-buy [id] GET error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const existing = await prisma.wantToBuy.findUnique({
      where: { id: params.id },
      include: { category: { select: { slug: true } } },
    })
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 })
    }

    const body = await request.json()
    const data = patchWantToBuySchema.parse(body)

    if (
      !data.close &&
      !data.renew &&
      (existing.status === "CLOSED" || existing.status === "REJECTED")
    ) {
      return NextResponse.json(
        { error: "Редактирование недоступно для этой заявки" },
        { status: 400 },
      )
    }

    if (data.close) {
      const updated = await prisma.wantToBuy.update({
        where: { id: existing.id },
        data: { status: "CLOSED" },
        include: WANT_TO_BUY_CARD_INCLUDE,
      })
      return NextResponse.json({ item: serializeWantToBuyCard(updated) })
    }

    if (data.renew) {
      if (existing.status !== "EXPIRED") {
        return NextResponse.json(
          { error: "Продлить можно только истёкшую заявку" },
          { status: 400 },
        )
      }
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + WANT_TO_BUY_ACTIVE_DAYS)
      const updated = await prisma.wantToBuy.update({
        where: { id: existing.id },
        data: {
          status: "ACTIVE",
          expiresAt,
          expiringSoonNotifiedAt: null,
        },
        include: WANT_TO_BUY_CARD_INCLUDE,
      })
      return NextResponse.json({ item: serializeWantToBuyCard(updated) })
    }

    const nextTitle = data.title ?? existing.title
    const nextDescription = data.description ?? existing.description

    const contentEval = await evaluateWantToBuyContent(prisma, {
      title: nextTitle,
      description: nextDescription,
      categorySlug: existing.category.slug,
      user: {
        id: user.id,
        isBanned: user.isBanned,
        phoneVerifiedAt: user.phoneVerifiedAt,
      },
      excludeWantToBuyId: existing.id,
      request,
    })
    const verdict = contentEval.verdict

    const updated = await prisma.wantToBuy.update({
      where: { id: existing.id },
      data: {
        ...(data.title != null ? { title: data.title } : {}),
        ...(data.description != null ? { description: data.description } : {}),
        ...(data.priceMax !== undefined ? { priceMax: data.priceMax } : {}),
        ...(data.city !== undefined ? { city: data.city } : {}),
        ...(data.condition != null ? { condition: data.condition } : {}),
        status: verdict.status,
        autoApproved: verdict.autoApproved,
        moderationReasonCode: contentEval.moderationCode,
        rejectionReason: verdict.status === "REJECTED" ? verdict.reason : null,
        contentFingerprint: contentEval.contentFingerprint,
        ...(verdict.status === "ACTIVE" ? { expiringSoonNotifiedAt: null } : {}),
      },
      include: WANT_TO_BUY_CARD_INCLUDE,
    })

    void notifyWantToBuyContentIncident({
      title: nextTitle,
      description: nextDescription,
      categorySlug: existing.category.slug,
      user: {
        id: user.id,
        isBanned: user.isBanned,
        phoneVerifiedAt: user.phoneVerifiedAt,
      },
      evaluation: contentEval,
      wantToBuyId: existing.id,
      priceMax: data.priceMax ?? existing.priceMax,
      city: data.city ?? existing.city,
      condition: data.condition ?? existing.condition,
      request,
    })

    if (verdict.status === "REJECTED" && existing.status !== "REJECTED") {
      void notifyWantToBuyRejected({
        buyerUserId: user.id,
        title: nextTitle,
        wantToBuyId: existing.id,
        reason: verdict.reason,
      })
    }

    return NextResponse.json({
      item: serializeWantToBuyCard(updated),
      moderation: { status: verdict.status, reason: verdict.reason },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Некорректные данные" }, { status: 400 })
    }
    console.error("want-to-buy [id] PATCH error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const existing = await prisma.wantToBuy.findUnique({
      where: { id: params.id },
      select: { id: true, userId: true, status: true, _count: { select: { offers: true } } },
    })
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 })
    }

    if (existing._count.offers > 0) {
      await prisma.wantToBuy.update({
        where: { id: existing.id },
        data: { status: "CLOSED" },
      })
      return NextResponse.json({ ok: true, closed: true })
    }

    await prisma.wantToBuy.delete({ where: { id: existing.id } })
    return NextResponse.json({ ok: true, deleted: true })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({ error: "Не удалось удалить заявку" }, { status: 400 })
    }
    console.error("want-to-buy [id] DELETE error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
