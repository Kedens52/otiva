/**
 * @deprecated Используйте `@/lib/listings/scoring/*`. Оставлено для обратной совместимости.
 */
export type { ListingForScoring as ListingRankingInput } from "@/lib/listings/scoring/calculate-listing-score"
export {
  appliesFairListingRanking as appliesCompositeListingRanking,
  rankListingsFairly,
  buildListingScoreContextFromSearchParams,
  explainListingRanking,
} from "@/lib/listings/scoring/rank-listings"
export { calculateListingScore as listingCompositeScore } from "@/lib/listings/scoring/calculate-listing-score"

import type { ListingForScoring } from "@/lib/listings/scoring/calculate-listing-score"
import { rankListingsFairly } from "@/lib/listings/scoring/rank-listings"
import type { ListingScoreContext } from "@/lib/listings/scoring/types"

/** @deprecated */
export function sortListingsByCompositeScore<T extends ListingForScoring>(
  items: T[],
  q: string | null | undefined,
  sortBy: string,
  _trustMap: Map<string, { trustBoost: number; riskPenalty: number }>,
): T[] {
  const ctx: ListingScoreContext = { searchQuery: q, sortMode: sortBy }
  return rankListingsFairly(
    items.map((item) => ({
      ...item,
      seller: item.seller ?? undefined,
    })),
    ctx,
  )
}
