import type { AppListing } from "@/lib/listing-types"
import type { FeedItem, SelectedAdPayload } from "@/lib/ads/types"

export type InsertAdsOptions = {
  interval: number
  placementKey?: string
}

/**
 * Вставляет рекламу внутрь ленты карточек (после каждых N объявлений).
 */
export function insertAdsIntoFeed(
  listings: AppListing[],
  ads: SelectedAdPayload[],
  options: InsertAdsOptions,
): FeedItem[] {
  const interval = Math.max(3, options.interval)
  if (!listings.length || !ads.length) {
    return listings.map((listing) => ({ type: "listing" as const, listing }))
  }

  const out: FeedItem[] = []
  let adIndex = 0
  let lastAdId: string | null = null

  function nextAd(): SelectedAdPayload | null {
    if (!ads.length) return null
    for (let attempt = 0; attempt < ads.length; attempt++) {
      const candidate = ads[adIndex % ads.length]
      adIndex += 1
      if (candidate.id !== lastAdId) {
        lastAdId = candidate.id
        return candidate
      }
    }
    return null
  }

  for (let i = 0; i < listings.length; i++) {
    out.push({ type: "listing", listing: listings[i] })

    const isSlot = (i + 1) % interval === 0
    if (!isSlot) continue

    const ad = nextAd()
    if (!ad) continue

    out.push({
      type: "ad",
      id: `${options.placementKey ?? "feed"}-ad-${ad.id}-${i}`,
      ad,
    })
  }

  return out
}

export function listingsFromFeedItems(items: FeedItem[]): AppListing[] {
  return items.filter((i): i is Extract<FeedItem, { type: "listing" }> => i.type === "listing").map((i) => i.listing)
}
