import type { PrismaClient } from "@prisma/client"
import { scoreAdCampaign } from "@/lib/ads/score"
import { isAdBlockedForUser } from "@/lib/ads/frequency"
import { buildAdClickHref, sanitizeAdTargetUrl } from "@/lib/ads/url-safety"
import { resolveCampaignMedia } from "@/lib/ads/media"
import type { AdSelectContext, SelectedAdPayload } from "@/lib/ads/types"

const MIN_SCORE = 1

export async function selectAds(
  prisma: PrismaClient,
  ctx: AdSelectContext,
): Promise<SelectedAdPayload[]> {
  const count = Math.min(Math.max(ctx.count ?? 1, 1), 12)
  const campaigns = await prisma.adCampaign.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { ownerId: null },
        { payments: { some: { status: "PAID" } } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  })

  const scored: Array<{ campaign: (typeof campaigns)[number]; score: number }> = []

  for (const campaign of campaigns) {
    const score = scoreAdCampaign(campaign, ctx)
    if (score < MIN_SCORE) continue

    const blocked = await isAdBlockedForUser(prisma, campaign.id, ctx.userId, ctx.sessionId, {
      maxPerDay: campaign.maxImpressionsPerUserPerDay,
      maxPerSession: campaign.maxImpressionsPerSession,
    })
    if (blocked.blocked) continue

    if (ctx.excludeAdIds?.includes(campaign.id)) continue
    if (ctx.lastAdId && ctx.lastAdId === campaign.id) continue

    scored.push({ campaign, score })
  }

  scored.sort((a, b) => b.score - a.score || b.campaign.impressions - a.campaign.impressions)

  const picked: SelectedAdPayload[] = []
  let lastId = ctx.lastAdId ?? null

  for (const { campaign, score } of scored) {
    if (picked.length >= count) break
    if (lastId === campaign.id) continue
    if (picked.some((p) => p.id === campaign.id)) continue

    const safe = sanitizeAdTargetUrl(campaign.targetUrl)
    if (!safe.ok) continue

    const media = resolveCampaignMedia(campaign)
    picked.push({
      id: campaign.id,
      title: campaign.title,
      description: campaign.description,
      imageUrl: media.imageUrl,
      mediaType: media.mediaType,
      mediaUrl: media.mediaUrl,
      mediaPosterUrl: media.mediaPosterUrl,
      mediaAlt: media.mediaAlt,
      mediaWidth: media.mediaWidth,
      mediaHeight: media.mediaHeight,
      mediaDuration: media.mediaDuration,
      targetUrl: safe.url,
      ctaText: campaign.ctaText,
      label: campaign.label,
      city: campaign.city,
      type: campaign.type,
      score,
      isExternal: safe.isExternal,
      clickHref: buildAdClickHref(campaign.id, safe.url, safe.isExternal),
    })
    lastId = campaign.id
  }

  return picked
}

export function toSelectedAdPayload(
  campaign: {
    id: string
    title: string
    description: string | null
    imageUrl?: string | null
    mediaType?: import("@prisma/client").AdMediaType | null
    mediaUrl?: string | null
    mediaPosterUrl?: string | null
    mediaAlt?: string | null
    mediaWidth?: number | null
    mediaHeight?: number | null
    mediaDuration?: number | null
    targetUrl: string
    ctaText: string | null
    label: string | null
    city: string | null
    type: import("@prisma/client").AdType
  },
  score = 0,
): SelectedAdPayload | null {
  const safe = sanitizeAdTargetUrl(campaign.targetUrl)
  if (!safe.ok) return null
  const media = resolveCampaignMedia(campaign)
  return {
    id: campaign.id,
    title: campaign.title,
    description: campaign.description,
    imageUrl: media.imageUrl,
    mediaType: media.mediaType,
    mediaUrl: media.mediaUrl,
    mediaPosterUrl: media.mediaPosterUrl,
    mediaAlt: media.mediaAlt,
    mediaWidth: media.mediaWidth,
    mediaHeight: media.mediaHeight,
    mediaDuration: media.mediaDuration,
    targetUrl: safe.url,
    ctaText: campaign.ctaText,
    label: campaign.label,
    city: campaign.city,
    type: campaign.type,
    score,
    isExternal: safe.isExternal,
    clickHref: buildAdClickHref(campaign.id, safe.url, safe.isExternal),
  }
}
