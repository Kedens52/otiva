import { prisma } from "@/lib/prisma"
import { mergeListingScoreWeights } from "@/lib/listings/scoring/weights-default"
import type { ListingScoreWeights } from "@/lib/listings/scoring/types"

let cache: { weights: ListingScoreWeights; loadedAt: number } | null = null
const TTL_MS = 60_000

export async function loadListingScoreWeights(): Promise<ListingScoreWeights> {
  if (cache && Date.now() - cache.loadedAt < TTL_MS) return cache.weights
  try {
    const row = await prisma.listingRankingSettings.findUnique({ where: { id: "default" } })
    const partial = row?.weights as Partial<ListingScoreWeights> | undefined
    const weights = mergeListingScoreWeights(partial)
    cache = { weights, loadedAt: Date.now() }
    return weights
  } catch {
    return mergeListingScoreWeights()
  }
}

export function invalidateListingScoreWeightsCache() {
  cache = null
}
