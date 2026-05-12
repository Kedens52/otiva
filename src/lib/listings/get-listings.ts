import type { Prisma, PrismaClient } from "@prisma/client"
import {
  normalizeListingsSearchParams,
  collectAppliedFilters,
  parseSafeInt,
} from "@/lib/listings/filters"
import { sortListingsByRelevancePage } from "@/lib/listings/search"
import { buildListingOrderBy } from "@/lib/listings/sorting"
import { getRankingTrustModifier } from "@/lib/user-trust-engine"
import { fetchAvailableFilterOptions } from "@/lib/listings/available-filter-options"
import { buildListingWhereForPublicSearch } from "@/lib/listings/listing-public-where"
import { sortListingsByCompositeScore, appliesCompositeListingRanking } from "@/lib/listings/listing-ranking"

export { buildListingWhereForPublicSearch } from "@/lib/listings/listing-public-where"
export type { BuildListingWhereOptions } from "@/lib/listings/listing-public-where"

export const LISTING_PUBLIC_LIST_INCLUDE = {
  seller: {
    select: {
      id: true,
      name: true,
      avatar: true,
      phone: true,
      rating: true,
      reviewCount: true,
      isVerified: true,
    },
  },
  category: true,
  _count: { select: { favorites: true } },
} as const

export type ListingPublicListItem = Prisma.ListingGetPayload<{
  include: typeof LISTING_PUBLIC_LIST_INCLUDE
}>

export type GetListingsResult = {
  items: (ListingPublicListItem & { favorited: boolean })[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  appliedFilters: Record<string, string>
  availableFilterOptions: Record<string, string[]>
}

export type GetListingsOptions = {
  /** Подставить category=… до нормализации (например /api/cars). */
  forcedCategorySlug?: string
  currentUserId?: string | null
  /** Не считать availableFilterOptions (ускорение). */
  skipAvailableOptions?: boolean
}

/**
 * Единая выдача объявлений: where + поиск + числовые JSON-фильтры + сортировка + trust-твик + избранное.
 */
export async function getListings(
  prisma: PrismaClient,
  inputSp: URLSearchParams,
  opts: GetListingsOptions = {},
): Promise<GetListingsResult> {
  const sp = new URLSearchParams(inputSp.toString())
  if (opts.forcedCategorySlug) {
    sp.set("category", opts.forcedCategorySlug)
  }

  const normalizedSp = normalizeListingsSearchParams(sp)
  const page = Math.max(1, parseSafeInt(normalizedSp.get("page")) ?? 1)
  const pageSize = Math.min(50, Math.max(1, parseSafeInt(normalizedSp.get("pageSize")) ?? 20))
  const sortByRaw = normalizedSp.get("sortBy") || "default"
  const sortOrder = (normalizedSp.get("sortOrder") || "desc") as "asc" | "desc"
  const q = normalizedSp.get("q")

  const { where, empty, categoryRow, categorySlug, normalizedSp: nsp } =
    await buildListingWhereForPublicSearch(prisma, sp)

  const appliedFilters = collectAppliedFilters(nsp)

  if (empty) {
    return {
      items: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
      appliedFilters,
      availableFilterOptions: {},
    }
  }

  const sortBy = sortByRaw === "default" && q?.trim() ? "relevance" : sortByRaw
  let orderBy = buildListingOrderBy(sortBy, sortOrder)

  const [items, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: LISTING_PUBLIC_LIST_INCLUDE,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.listing.count({ where }),
  ])

  let orderedItems: ListingPublicListItem[] = items
  if (sortBy === "relevance") {
    orderedItems = sortListingsByRelevancePage(items, q)
  }
  if (sortBy === "nearby") {
    const nearLat = Number.parseFloat(nsp.get("nearLat") ?? "")
    const nearLng = Number.parseFloat(nsp.get("nearLng") ?? "")
    if (Number.isFinite(nearLat) && Number.isFinite(nearLng)) {
      orderedItems = [...orderedItems].sort((a, b) => {
        const metric = (row: ListingPublicListItem) => {
          if (row.lat == null || row.lng == null) return Number.POSITIVE_INFINITY
          const dx = row.lat - nearLat
          const dy = row.lng - nearLng
          return dx * dx + dy * dy
        }
        return metric(a) - metric(b)
      })
    }
  }

  const sellerIds = [...new Set(orderedItems.map((i) => i.sellerId))]
  if (sellerIds.length) {
    const trustRows = await prisma.user.findMany({
      where: { id: { in: sellerIds } },
      select: { id: true, trustTier: true, internalTrustScore: true, riskPenaltyScore: true },
    })
    const trustMap = new Map(
      trustRows.map((u) => [
        u.id,
        getRankingTrustModifier(u.trustTier, u.internalTrustScore, u.riskPenaltyScore),
      ]),
    )
      const composite = appliesCompositeListingRanking(sortBy, sortByRaw, q)
    if (composite) {
      orderedItems = sortListingsByCompositeScore(orderedItems, q, sortBy, trustMap)
    } else {
      const stable = new Map(orderedItems.map((it, idx) => [it.id, idx]))
      orderedItems = [...orderedItems].sort((a, b) => {
        const ma = trustMap.get(a.sellerId) ?? { trustBoost: 0, riskPenalty: 0, accountLevel: "NORMAL" }
        const mb = trustMap.get(b.sellerId) ?? { trustBoost: 0, riskPenalty: 0, accountLevel: "NORMAL" }
        const biasB = mb.trustBoost - mb.riskPenalty
        const biasA = ma.trustBoost - ma.riskPenalty
        if (biasB !== biasA) return biasB - biasA
        return (stable.get(a.id) ?? 0) - (stable.get(b.id) ?? 0)
      })
    }
  }

  let favIds = new Set<string>()
  if (opts.currentUserId && orderedItems.length) {
    const favRows = await prisma.favorite.findMany({
      where: {
        userId: opts.currentUserId,
        listingId: { in: orderedItems.map((i) => i.id) },
      },
      select: { listingId: true },
    })
    favIds = new Set(favRows.map((f) => f.listingId))
  }

  const payload = orderedItems.map((item) => ({
    ...item,
    favorited: opts.currentUserId ? favIds.has(item.id) : false,
  }))

  let availableFilterOptions: Record<string, string[]> = {}
  if (!opts.skipAvailableOptions) {
    availableFilterOptions = await fetchAvailableFilterOptions(
      prisma,
      nsp,
      categoryRow?.id ?? null,
      categorySlug,
    )
  }

  return {
    items: payload,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    appliedFilters,
    availableFilterOptions,
  }
}
