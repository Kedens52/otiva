"use client"

import type { AdPlacement } from "@prisma/client"
import { AdCard } from "@/components/ads/AdCard"
import { ListingCard } from "@/components/marketplace/ListingCard"
import type { FeedItem } from "@/lib/ads/types"

type MixedFeedGridProps = {
  items: FeedItem[]
  placement: AdPlacement
  compact?: boolean
  sessionId?: string
  categoryId?: string
  cityId?: string
  className?: string
}

export function MixedFeedGrid({
  items,
  placement,
  compact = false,
  sessionId,
  categoryId,
  cityId,
  className,
}: MixedFeedGridProps) {
  return (
    <>
      {items.map((item) =>
        item.type === "ad" ? (
          <AdCard
            key={item.id}
            ad={item.ad}
            placement={placement}
            compact={compact}
            sessionId={sessionId}
            categoryId={categoryId}
            cityId={cityId}
          />
        ) : (
          <ListingCard key={item.listing.id} listing={item.listing} compact={compact} />
        ),
      )}
    </>
  )
}
