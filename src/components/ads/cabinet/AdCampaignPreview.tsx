"use client"

import { AdCard } from "@/components/ads/AdCard"
import { toSelectedAdPayload } from "@/lib/ads/select-ad"
import type { AdCampaign, AdMediaType } from "@prisma/client"

export function AdCampaignPreview({
  campaign,
}: {
  campaign: Pick<
    AdCampaign,
    | "id"
    | "title"
    | "description"
    | "imageUrl"
    | "targetUrl"
    | "ctaText"
    | "label"
    | "city"
    | "type"
  > & {
    mediaType?: AdMediaType | null
    mediaUrl?: string | null
    mediaPosterUrl?: string | null
    mediaAlt?: string | null
    mediaWidth?: number | null
    mediaHeight?: number | null
    mediaDuration?: number | null
  }
}) {
  const ad = toSelectedAdPayload(campaign)
  if (!ad) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-500">
        Укажите корректную ссылку для превью
      </div>
    )
  }
  return (
    <div className="max-w-[280px]">
      <AdCard ad={ad} placement="MOBILE_FEED_INLINE" compact />
    </div>
  )
}
