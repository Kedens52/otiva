import { tokenizeSearchQuery } from "@/lib/search/search-query"

export type ListingRankingInput = {
  id: string
  title: string
  description: string
  uniqueViews: number
  createdAt: Date
  images?: string[]
  isPromoted: boolean
  category?: { slug?: string } | null
  freshnessConfirmedAt?: Date | null
  sellerId: string
}

const REAL_ESTATE_SLUGS = new Set(["nedvizhimost", "real-estate", "real_estate", "realty", "kvartiry"])

const PROMO_BOOST_CAP = 18

export function realEstateFreshnessPenalty(listing: ListingRankingInput): number {
  const slug = listing.category?.slug
  if (!slug || !REAL_ESTATE_SLUGS.has(slug)) return 0
  const anchor = listing.freshnessConfirmedAt ?? listing.createdAt
  const days = (Date.now() - anchor.getTime()) / 86400000
  if (days <= 7) return 0
  return Math.min(35, (days - 7) * 1.5)
}

export function relevanceSubscore(listing: ListingRankingInput, q: string | null | undefined): number {
  const words = tokenizeSearchQuery(q ?? undefined)
  if (!words.length) return 0
  let s = 0
  const t = listing.title.toLowerCase()
  const d = (listing.description || "").toLowerCase()
  for (const w of words) {
    if (t.includes(w)) s += 40
    else if (d.includes(w)) s += 12
  }
  return s
}

export function qualitySubscore(listing: ListingRankingInput, sortBy: string): number {
  const desc = (listing.description || "").trim().length
  let s = Math.min(22, Math.floor(desc / 55))
  s += Math.min(12, (listing.images?.length ?? 0) * 2)
  s += Math.min(10, Math.log10((listing.uniqueViews ?? 0) + 1) * 4)
  if (sortBy === "popular" || sortBy === "views_desc") {
    s += Math.min(18, Math.log10((listing.uniqueViews ?? 0) + 1) * 6)
  }
  return s
}

export function promotionBoostSubscore(isPromoted: boolean): number {
  if (!isPromoted) return 0
  return Math.min(PROMO_BOOST_CAP, 14)
}

/** Итог для сортировки внутри страницы: релевантность + качество + промо (с потолком) + доверие − риски − «устаревшая» недвижимость. */
export function listingCompositeScore(
  listing: ListingRankingInput,
  q: string | null | undefined,
  sortBy: string,
  trustBoost: number,
  riskPenalty: number,
): number {
  return (
    relevanceSubscore(listing, q) +
    qualitySubscore(listing, sortBy) +
    promotionBoostSubscore(listing.isPromoted) +
    trustBoost -
    riskPenalty -
    realEstateFreshnessPenalty(listing)
  )
}

export function sortListingsByCompositeScore<T extends ListingRankingInput>(
  items: T[],
  q: string | null | undefined,
  sortBy: string,
  trustMap: Map<string, { trustBoost: number; riskPenalty: number }>,
): T[] {
  const stable = new Map(items.map((it, i) => [it.id, i]))
  return [...items].sort((a, b) => {
    const ta = trustMap.get(a.sellerId) ?? { trustBoost: 0, riskPenalty: 0 }
    const tb = trustMap.get(b.sellerId) ?? { trustBoost: 0, riskPenalty: 0 }
    const sa = listingCompositeScore(a, q, sortBy, ta.trustBoost, ta.riskPenalty)
    const sb = listingCompositeScore(b, q, sortBy, tb.trustBoost, tb.riskPenalty)
    if (sb !== sa) return sb - sa
    return (stable.get(a.id) ?? 0) - (stable.get(b.id) ?? 0)
  })
}

export function appliesCompositeListingRanking(sortBy: string, sortByRaw: string, q: string | null | undefined): boolean {
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
