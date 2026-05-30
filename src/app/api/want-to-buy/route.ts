import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { WANT_TO_BUY_ACTIVE_DAYS } from "@/lib/want-to-buy/constants"
import { getWantToBuyFeed } from "@/lib/want-to-buy/feed"
import { assertCanCreateWantToBuy } from "@/lib/want-to-buy/limits"
import {
  evaluateWantToBuyContent,
  notifyWantToBuyContentIncident,
} from "@/lib/content-policy/want-to-buy-flow"
import { checkWantToBuyCreateRateLimit } from "@/lib/want-to-buy/rate-limit"
import { createWantToBuySchema, wantToBuyConditionSchema, wantToBuyFeedSortSchema } from "@/lib/want-to-buy/schemas"
import { WANT_TO_BUY_CARD_INCLUDE } from "@/lib/want-to-buy/selects"
import { notifyWantToBuyRejected } from "@/lib/want-to-buy/notify"
import { serializeWantToBuyCard } from "@/lib/want-to-buy/serialize"

export const dynamic = "force-dynamic"

const feedQuerySchema = z.object({
  cursor: z.string().max(32).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  q: z.string().max(120).optional(),
  city: z.string().max(100).optional(),
  category: z.string().max(64).optional(),
  priceMax: z.coerce.number().int().min(0).optional(),
  condition: wantToBuyConditionSchema.optional(),
  sort: wantToBuyFeedSortSchema.optional(),
  mine: z.enum(["1", "true"]).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const raw = Object.fromEntries(request.nextUrl.searchParams)
    const query = feedQuerySchema.parse(raw)

    if (query.mine === "1" || query.mine === "true") {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
      }

      const rows = await prisma.wantToBuy.findMany({
        where: { userId: user.id },
        include: WANT_TO_BUY_CARD_INCLUDE,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      })

      return NextResponse.json({
        items: rows.map(serializeWantToBuyCard),
      })
    }

    const data = await getWantToBuyFeed({
      cursor: query.cursor,
      limit: query.limit,
      q: query.q,
      city: query.city,
      categorySlug: query.category,
      priceMax: query.priceMax,
      condition: query.condition,
      sort: query.sort,
    })

    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Некорректные параметры" }, { status: 400 })
    }
    console.error("want-to-buy GET error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const restrictions = await prisma.user.findUnique({
      where: { id: user.id },
      select: { accountRestricted: true },
    })
    if (restrictions?.accountRestricted) {
      return NextResponse.json(
        { error: "По правилам сервиса это действие требует дополнительной проверки." },
        { status: 403 },
      )
    }

    const body = await request.json()
    const data = createWantToBuySchema.parse(body)

    const canCreate = await assertCanCreateWantToBuy(user.id)
    if (!canCreate.ok) {
      return NextResponse.json({ error: canCreate.error }, { status: canCreate.status })
    }

    const allowedByRate = await checkWantToBuyCreateRateLimit(user.id)
    if (!allowedByRate) {
      return NextResponse.json(
        { error: "Не более 3 новых заявок в сутки. Попробуйте завтра." },
        { status: 429 },
      )
    }

    const category = await prisma.category.findUnique({
      where: { slug: data.categorySlug },
    })
    if (!category) {
      return NextResponse.json({ error: "Категория не найдена" }, { status: 400 })
    }

    const contentEval = await evaluateWantToBuyContent(prisma, {
      title: data.title,
      description: data.description,
      categorySlug: category.slug,
      user: {
        id: user.id,
        isBanned: user.isBanned,
        phoneVerifiedAt: user.phoneVerifiedAt,
      },
      request,
    })
    const verdict = contentEval.verdict

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + WANT_TO_BUY_ACTIVE_DAYS)

    const created = await prisma.wantToBuy.create({
      data: {
        userId: user.id,
        title: data.title,
        description: data.description,
        categoryId: category.id,
        priceMax: data.priceMax ?? null,
        city: data.city?.trim() || null,
        condition: data.condition,
        status: verdict.status,
        autoApproved: verdict.autoApproved,
        moderationReasonCode: contentEval.moderationCode,
        rejectionReason: verdict.status === "REJECTED" ? verdict.reason : null,
        contentFingerprint: contentEval.contentFingerprint,
        expiresAt,
      },
      include: WANT_TO_BUY_CARD_INCLUDE,
    })

    if (verdict.status === "REJECTED") {
      void notifyWantToBuyRejected({
        buyerUserId: user.id,
        title: data.title,
        wantToBuyId: created.id,
        reason: verdict.reason,
      })
    }

    void notifyWantToBuyContentIncident({
      title: data.title,
      description: data.description,
      categorySlug: category.slug,
      user: {
        id: user.id,
        isBanned: user.isBanned,
        phoneVerifiedAt: user.phoneVerifiedAt,
      },
      evaluation: contentEval,
      wantToBuyId: created.id,
      priceMax: data.priceMax ?? null,
      city: data.city?.trim() || null,
      condition: data.condition,
      request,
    })

    return NextResponse.json(
      {
        item: serializeWantToBuyCard(created),
        moderation: {
          status: verdict.status,
          reason: verdict.reason,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Проверьте поля формы" }, { status: 400 })
    }
    console.error("want-to-buy POST error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
