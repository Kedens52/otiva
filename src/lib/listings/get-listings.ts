import type { Prisma, PrismaClient } from "@prisma/client"
import {
  normalizeListingsSearchParams,
  collectAppliedFilters,
  parseSafeInt,
} from "@/lib/listings/filters"
import { sortListingsByRelevancePage } from "@/lib/listings/search"
import { buildListingOrderBy } from "@/lib/listings/sorting"
import { fetchAvailableFilterOptions } from "@/lib/listings/available-filter-options"
import { buildListingWhereForPublicSearch } from "@/lib/listings/listing-public-where"
import {
  appliesFairListingRanking,
  buildListingScoreContextFromSearchParams,
  rankListingsFairly,
} from "@/lib/listings/scoring/rank-listings"
import { isPromotedListing } from "@/lib/listings/scoring/calculate-listing-score"
import { loadListingScoreWeights } from "@/lib/listings/scoring/load-weights"
import type { ListingScoreBreakdown } from "@/lib/listings/scoring/types"
import { calculateDistanceKm } from "@/lib/geo/distance"
import { toPublicSellerContact } from "@/lib/phone-privacy"
import { getPublicBadgesForUsers } from "@/lib/badges/get-public-badges"
import type { PublicUserBadge } from "@/lib/badges/badge-map"

export { buildListingWhereForPublicSearch } from "@/lib/listings/listing-public-where"
export type { BuildListingWhereOptions } from "@/lib/listings/listing-public-where"

export const LISTING_PUBLIC_LIST_INCLUDE = {
  seller: {
    select: {
      id: true,
      name: true,
      avatar: true,
      showPhone: true,
      rating: true,
      reviewCount: true,
      negativeReviewsCount: true,
      isVerified: true,
      phoneVerifiedAt: true,
      createdAt: true,
      accountRestricted: true,
      avgResponseMinutes: true,
      premiumUntil: true,
      description: true,
      city: true,
      trustTier: true,
      riskPenaltyScore: true,
    },
  },
  category: true,
  _count: { select: { favorites: true, reports: true } },
} as const

export type ListingPublicListItem = Prisma.ListingGetPayload<{
  include: typeof LISTING_PUBLIC_LIST_INCLUDE
}>

export type GetListingsResult = {
  items: (ListingPublicListItem & {
    favorited: boolean
    distanceKm?: number | null
    isPromoted?: boolean
    rankingExplain?: ListingScoreBreakdown
  })[]
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
  /** Вернуть breakdown ранжирования (админ / отладка). */
  explainRanking?: boolean
}

type ListingListPayloadItem = ListingPublicListItem & {
  favorited: boolean
  distanceKm?: number | null
}

type GeoSearchState = {
  latitude: number
  longitude: number
  radiusKm: number | null
  wholeCity: boolean
}

function parseGeoSearch(sp: URLSearchParams): GeoSearchState | null {
  const latitude = Number.parseFloat(sp.get("lat") ?? sp.get("nearLat") ?? "")
  const longitude = Number.parseFloat(sp.get("lng") ?? sp.get("nearLng") ?? "")
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null

  const radiusRaw = sp.get("radius")?.trim() ?? ""
  if (radiusRaw === "city") {
    return { latitude, longitude, radiusKm: null, wholeCity: true }
  }

  const radiusKm = Number.parseFloat(radiusRaw)
  return {
    latitude,
    longitude,
    radiusKm: Number.isFinite(radiusKm) && radiusKm > 0 ? radiusKm : null,
    wholeCity: false,
  }
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
  const pageSize = Math.min(60, Math.max(1, parseSafeInt(normalizedSp.get("pageSize")) ?? 20))
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
  const orderBy = buildListingOrderBy(sortBy, sortOrder)
  const geoSearch = parseGeoSearch(nsp)
  const useWindowedRelevancePage = !geoSearch && sortBy === "relevance"
  const fairRanking = !geoSearch && appliesFairListingRanking(sortBy, sortByRaw, q)
  const shouldLogRanking =
    opts.explainRanking || process.env.LISTING_RANKING_LOG === "1"

  async function applyFairRanking(items: ListingPublicListItem[]): Promise<ListingPublicListItem[]> {
    if (!fairRanking || items.length === 0) return items
    const weights = await loadListingScoreWeights()
    const scoreContext = buildListingScoreContextFromSearchParams(nsp, { weights })
    return rankListingsFairly(items, scoreContext, {
      page,
      pageSize,
      logPositions: shouldLogRanking,
    })
  }

  let orderedItems: ListingPublicListItem[] = []
  let payload: ListingListPayloadItem[] = []
  let total = 0

  if (geoSearch) {
    const candidateLimit = Math.max(pageSize * 30, 600)
    const includeWithoutDistance = Boolean(
      nsp.get("city")?.trim() || nsp.get("district")?.trim() || nsp.get("address")?.trim(),
    )
    const candidates = await prisma.listing.findMany({
      where,
      include: LISTING_PUBLIC_LIST_INCLUDE,
      orderBy,
      take: candidateLimit,
    })

    const withDistance = candidates
      .filter(
        (item): item is ListingPublicListItem & { lat: number; lng: number } =>
          typeof item.lat === "number" &&
          Number.isFinite(item.lat) &&
          typeof item.lng === "number" &&
          Number.isFinite(item.lng),
      )
      .map((item, index) => ({
        item,
        distanceKm: calculateDistanceKm(
          geoSearch.latitude,
          geoSearch.longitude,
          item.lat,
          item.lng,
        ),
        index,
      }))
      .filter((entry) => geoSearch.wholeCity || geoSearch.radiusKm == null || entry.distanceKm <= geoSearch.radiusKm)
      .sort((a, b) => {
        if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm
        return a.index - b.index
      })

    const withoutDistance = candidates
      .filter((item) => item.lat == null || item.lng == null)
      .map((item, index) => ({ item, index }))
      .sort((a, b) => a.index - b.index)

    const combined = [
      ...withDistance,
      ...(includeWithoutDistance
        ? withoutDistance.map((entry) => ({ ...entry, distanceKm: null }))
        : []),
    ]
    total = combined.length
    const paged = combined.slice((page - 1) * pageSize, page * pageSize)
    orderedItems = paged.map((entry) => entry.item)

    let favIds = new Set<string>()
    if (opts.currentUserId && orderedItems.length) {
      const favRows = await prisma.favorite.findMany({
        where: {
          userId: opts.currentUserId,
          listingId: { in: orderedItems.map((item) => item.id) },
        },
        select: { listingId: true },
      })
      favIds = new Set(favRows.map((row) => row.listingId))
    }

    payload = paged.map((entry) => ({
      ...entry.item,
      isPromoted: isPromotedListing({ ...entry.item, seller: entry.item.seller }),
      favorited: opts.currentUserId ? favIds.has(entry.item.id) : false,
      distanceKm: entry.distanceKm,
    }))
  } else {
    const relevanceWindowTake = Math.min(2000, Math.max(page * pageSize * 8, 240))
    const [items, totalCount] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: LISTING_PUBLIC_LIST_INCLUDE,
        orderBy,
        skip: useWindowedRelevancePage ? 0 : (page - 1) * pageSize,
        take: useWindowedRelevancePage ? relevanceWindowTake : pageSize,
      }),
      prisma.listing.count({ where }),
    ])
    total = totalCount
    orderedItems = items

    if (sortBy === "relevance") {
      orderedItems = sortListingsByRelevancePage(items, q)
    }
    if (sortBy === "nearby") {
      const nearLat = Number.parseFloat(nsp.get("lat") ?? nsp.get("nearLat") ?? "")
      const nearLng = Number.parseFloat(nsp.get("lng") ?? nsp.get("nearLng") ?? "")
      if (Number.isFinite(nearLat) && Number.isFinite(nearLng)) {
        orderedItems = [...orderedItems].sort((a, b) => {
          const metric = (row: ListingPublicListItem) => {
            if (row.lat == null || row.lng == null) return Number.POSITIVE_INFINITY
            return calculateDistanceKm(nearLat, nearLng, row.lat, row.lng)
          }
          return metric(a) - metric(b)
        })
      }
    }

    if (fairRanking) {
      orderedItems = await applyFairRanking(orderedItems)
    }

    const pagedItems = useWindowedRelevancePage
      ? orderedItems.slice((page - 1) * pageSize, page * pageSize)
      : orderedItems

    let favIds = new Set<string>()
    if (opts.currentUserId && pagedItems.length) {
      const favRows = await prisma.favorite.findMany({
        where: {
          userId: opts.currentUserId,
          listingId: { in: pagedItems.map((item) => item.id) },
        },
        select: { listingId: true },
      })
      favIds = new Set(favRows.map((row) => row.listingId))
    }

    payload = pagedItems.map((item) => {
      const ranked = item as ListingPublicListItem & { ranking?: ListingScoreBreakdown }
      const promoted = isPromotedListing({
        ...item,
        isPromoted: item.isPromoted,
        seller: item.seller,
      })
      return {
        ...item,
        isPromoted: promoted,
        favorited: opts.currentUserId ? favIds.has(item.id) : false,
        distanceKm: null,
        ...(opts.explainRanking && ranked.ranking ? { rankingExplain: ranked.ranking } : {}),
      }
    })
  }

  let availableFilterOptions: Record<string, string[]> = {}
  if (!opts.skipAvailableOptions) {
    availableFilterOptions = await fetchAvailableFilterOptions(
      prisma,
      nsp,
      categoryRow?.id ?? null,
      categorySlug,
    )
  }

  const viewerId = opts.currentUserId ?? null
  const sellerIds = [...new Set(payload.map((item) => item.seller?.id).filter(Boolean) as string[])]
  let badgesBySeller = new Map<string, PublicUserBadge[]>()
  try {
    badgesBySeller = await getPublicBadgesForUsers(sellerIds)
  } catch (error) {
    console.error("[listings] getPublicBadgesForUsers failed:", error)
  }

  const publicItems = payload.map((item) => ({
    ...item,
    seller: item.seller
      ? {
          ...toPublicSellerContact(item.seller, viewerId),
          badges: badgesBySeller.get(item.seller.id) ?? [],
        }
      : item.seller,
  }))

  return {
    items: publicItems,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    appliedFilters,
    availableFilterOptions,
  }
}
