import {
  calculateListingScore,
  isPromotedListing,
  toListingForScoring,
  type ListingForScoring,
} from "@/lib/listings/scoring/calculate-listing-score"
import { applyFirstPageOrganicPromotedMix } from "@/lib/listings/scoring/page-mix"
import {
  buildRankingLogEntries,
  logListingRankingPositions,
} from "@/lib/listings/scoring/ranking-logger"
import { mergeListingScoreWeights } from "@/lib/listings/scoring/weights-default"
import type { ListingScoreBreakdown, ListingScoreContext } from "@/lib/listings/scoring/types"

export type RankedListing<T extends ListingForScoring> = T & {
  ranking: ListingScoreBreakdown
}

export function buildListingScoreContextFromSearchParams(
  sp: URLSearchParams,
  extras?: Partial<ListingScoreContext>,
): ListingScoreContext {
  const lat = Number.parseFloat(sp.get("lat") ?? sp.get("nearLat") ?? "")
  const lng = Number.parseFloat(sp.get("lng") ?? sp.get("nearLng") ?? "")
  return {
    searchQuery: sp.get("q")?.trim() || null,
    categoryId: sp.get("category")?.trim() || sp.get("cat")?.trim() || null,
    subcategoryId: sp.get("subcategory")?.trim() || null,
    cityId: sp.get("city")?.trim() || null,
    districtId: sp.get("district")?.trim() || null,
    sortMode: sp.get("sortBy") || sp.get("sort") || "default",
    userLocation: {
      lat: Number.isFinite(lat) ? lat : null,
      lng: Number.isFinite(lng) ? lng : null,
      city: sp.get("city")?.trim() || null,
      district: sp.get("district")?.trim() || null,
    },
    ...extras,
  }
}

export function appliesFairListingRanking(sortBy: string, sortByRaw: string, q: string | null | undefined): boolean {
  if (sortBy === "price_asc" || sortBy === "price_desc" || sortBy === "newest" || sortBy === "new" || sortBy === "nearby") {
    return false
  }
  if (sortBy === "default" && q?.trim()) return false
  return (
    sortBy === "default" ||
    sortBy === "relevance" ||
    sortByRaw === "relevance" ||
    sortBy === "promoted_first" ||
    sortBy === "promoted" ||
    sortBy === "popular" ||
    sortBy === "views_desc"
  )
}

export function rankListingsFairly<T extends ListingForScoring>(
  items: T[],
  context: ListingScoreContext,
  opts?: { page?: number; pageSize?: number; logPositions?: boolean },
): RankedListing<T>[] {
  const weights = mergeListingScoreWeights(context.weights)
  const page = opts?.page ?? 1
  const pageSize = opts?.pageSize ?? 20
  const ranked: RankedListing<T>[] = items.map((listing) => {
    const scored = toListingForScoring(listing)
    return {
      ...listing,
      ranking: calculateListingScore(scored, { ...context, weights }),
    }
  })

  const stable = new Map(ranked.map((it, i) => [it.id, i]))
  ranked.sort((a, b) => {
    if (b.ranking.finalScore !== a.ranking.finalScore) return b.ranking.finalScore - a.ranking.finalScore
    return (stable.get(a.id) ?? 0) - (stable.get(b.id) ?? 0)
  })

  const scored = ranked.map((row) => ({
    ...row,
    finalScore: row.ranking.finalScore,
    isPromotedListing: row.ranking.isPromotedListing,
  }))

  const mixed = applyFirstPageOrganicPromotedMix(
    scored,
    page,
    pageSize,
    weights.maxPromotedPageRatio,
  )

  const result = mixed.map(({ finalScore: _fs, isPromotedListing: _ip, ...rest }) => rest as RankedListing<T>)

  if (opts?.logPositions) {
    const sliceStart = (page - 1) * pageSize
    const pageSlice = result.slice(sliceStart, sliceStart + pageSize)
    logListingRankingPositions(buildRankingLogEntries(pageSlice, page, pageSize), {
      page,
      query: context.searchQuery,
      sortMode: context.sortMode,
      city: context.cityId,
    })
  }

  return result
}

export function explainListingRanking(listing: ListingForScoring, context: ListingScoreContext): string {
  const b = calculateListingScore(listing, context)
  return b.reasons.join("; ")
}

export { isPromotedListing }
