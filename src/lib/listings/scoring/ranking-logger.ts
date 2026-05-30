import type { ListingScoreBreakdown } from "@/lib/listings/scoring/types"

export type RankingLogEntry = {
  position: number
  listingId: string
  title: string
  finalScore: number
  organicScore: number
  promotionBoostCapped: number
  isPromoted: boolean
  reasons: string[]
}

export function buildRankingLogEntries(
  items: Array<{ id: string; title: string; ranking: ListingScoreBreakdown }>,
  page: number,
  pageSize: number,
): RankingLogEntry[] {
  const offset = (page - 1) * pageSize
  return items.map((item, index) => ({
    position: offset + index + 1,
    listingId: item.id,
    title: item.title,
    finalScore: item.ranking.finalScore,
    organicScore: item.ranking.organicScore,
    promotionBoostCapped: item.ranking.promotionBoostCapped,
    isPromoted: item.ranking.isPromotedListing,
    reasons: item.ranking.reasons,
  }))
}

/** Серверные логи: почему объявление заняло позицию в выдаче. */
export function logListingRankingPositions(
  entries: RankingLogEntry[],
  meta: { page: number; query?: string | null; sortMode?: string | null; city?: string | null },
): void {
  if (entries.length === 0) return
  const payload = {
    kind: "listing-ranking",
    page: meta.page,
    q: meta.query ?? null,
    sort: meta.sortMode ?? null,
    city: meta.city ?? null,
    count: entries.length,
    items: entries.map((e) => ({
      pos: e.position,
      id: e.listingId,
      score: e.finalScore,
      organic: e.organicScore,
      promo: e.promotionBoostCapped,
      promoted: e.isPromoted,
      why: e.reasons.join("; "),
    })),
  }
  console.info("[listing-ranking]", JSON.stringify(payload))
}
