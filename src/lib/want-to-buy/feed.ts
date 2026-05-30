import type { Prisma, WantToBuyCondition } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import {
  WANT_TO_BUY_FEED_DEFAULT_LIMIT,
  WANT_TO_BUY_FEED_MAX_LIMIT,
} from "@/lib/want-to-buy/constants"
import { expireStaleWantToBuys } from "@/lib/want-to-buy/expire"
import { WANT_TO_BUY_CARD_INCLUDE } from "@/lib/want-to-buy/selects"
import { serializeWantToBuyCard } from "@/lib/want-to-buy/serialize"
import type { wantToBuyFeedSortSchema } from "@/lib/want-to-buy/schemas"
import type { z } from "zod"

export type WantToBuyFeedSort = z.infer<typeof wantToBuyFeedSortSchema>

export type WantToBuyFeedParams = {
  cursor?: string
  limit?: number
  q?: string
  city?: string
  categorySlug?: string
  priceMax?: number
  condition?: WantToBuyCondition
  sort?: WantToBuyFeedSort
}

function buildOrderBy(sort: WantToBuyFeedSort): Prisma.WantToBuyOrderByWithRelationInput[] {
  switch (sort) {
    case "offers":
      return [{ offers: { _count: "desc" } }, { createdAt: "desc" }, { id: "desc" }]
    case "no_offers":
      return [{ createdAt: "desc" }, { id: "desc" }]
    case "price":
      return [{ priceMax: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }, { id: "desc" }]
    case "expires":
      return [{ expiresAt: "asc" }, { createdAt: "desc" }, { id: "desc" }]
    case "newest":
    default:
      return [{ createdAt: "desc" }, { id: "desc" }]
  }
}

const EMPTY_FEED = { items: [] as ReturnType<typeof serializeWantToBuyCard>[], nextCursor: null as string | null }

export async function getWantToBuyFeed(params: WantToBuyFeedParams) {
  try {
    await expireStaleWantToBuys()

    const limit = Math.min(
      Math.max(params.limit ?? WANT_TO_BUY_FEED_DEFAULT_LIMIT, 1),
      WANT_TO_BUY_FEED_MAX_LIMIT,
    )
    const sort = params.sort ?? "newest"

    const searchQ = params.q?.trim()
    const where: Prisma.WantToBuyWhereInput = {
      status: "ACTIVE",
      expiresAt: { gt: new Date() },
      ...(sort === "no_offers" ? { offers: { none: {} } } : {}),
      ...(searchQ
        ? {
            OR: [
              { title: { contains: searchQ, mode: "insensitive" } },
              { description: { contains: searchQ, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(params.city?.trim() ? { city: { equals: params.city.trim(), mode: "insensitive" } } : {}),
      ...(params.condition ? { condition: params.condition } : {}),
      ...(params.priceMax != null ? { OR: [{ priceMax: null }, { priceMax: { lte: params.priceMax } }] } : {}),
      ...(params.categorySlug?.trim()
        ? { category: { slug: params.categorySlug.trim() } }
        : {}),
    }

    const rows = await prisma.wantToBuy.findMany({
      where,
      include: WANT_TO_BUY_CARD_INCLUDE,
      orderBy: buildOrderBy(sort),
      take: limit + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
    })

    const hasMore = rows.length > limit
    const page = hasMore ? rows.slice(0, limit) : rows
    const nextCursor = hasMore ? page[page.length - 1]?.id ?? null : null

    return {
      items: page.map(serializeWantToBuyCard),
      nextCursor,
    }
  } catch (error) {
    console.error("getWantToBuyFeed:", error)
    return EMPTY_FEED
  }
}
