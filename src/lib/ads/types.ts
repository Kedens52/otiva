import type { AdDevice, AdMediaType, AdPlacement, AdType } from "@prisma/client"
import type { AppListing } from "@/lib/listing-types"

export type { AdDevice, AdPlacement, AdType }

export type SelectedAdPayload = {
  id: string
  title: string
  description: string | null
  /** @deprecated используйте mediaUrl + mediaType */
  imageUrl: string | null
  mediaType: AdMediaType
  mediaUrl: string | null
  mediaPosterUrl: string | null
  mediaAlt: string | null
  mediaWidth: number | null
  mediaHeight: number | null
  mediaDuration: number | null
  targetUrl: string
  ctaText: string | null
  label: string | null
  city: string | null
  type: AdType
  score: number
  isExternal: boolean
  clickHref: string
}

export type FeedListingItem = {
  type: "listing"
  listing: AppListing
}

export type FeedAdItem = {
  type: "ad"
  id: string
  ad: SelectedAdPayload
}

export type FeedItem = FeedListingItem | FeedAdItem

export type AdSelectContext = {
  placement: AdPlacement
  categoryId?: string | null
  subcategoryId?: string | null
  cityId?: string | null
  regionId?: string | null
  districtId?: string | null
  device?: AdDevice | null
  query?: string | null
  userId?: string | null
  sessionId?: string | null
  userInterests?: string[]
  excludeAdIds?: string[]
  lastAdId?: string | null
  count?: number
}
