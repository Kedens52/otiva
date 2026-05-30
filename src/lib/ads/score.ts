import type { AdCampaign, AdDevice, AdStatus } from "@prisma/client"
import type { AdSelectContext } from "@/lib/ads/types"

const PENALTY = -100

function norm(s: string | null | undefined) {
  return (s ?? "").trim().toLowerCase()
}

function includesId(list: string[], id: string | null | undefined) {
  if (!id?.trim() || list.length === 0) return false
  const v = norm(id)
  return list.some((item) => norm(item) === v)
}

function keywordMatch(keywords: string[], query: string | null | undefined) {
  const q = norm(query)
  if (!q || keywords.length === 0) return false
  return keywords.some((kw) => {
    const k = norm(kw)
    return k && (q.includes(k) || k.includes(q))
  })
}

export function scoreAdCampaign(
  campaign: AdCampaign,
  ctx: AdSelectContext,
  now = new Date(),
): number {
  let score = 0

  if (campaign.status !== ("ACTIVE" as AdStatus)) return PENALTY
  if (campaign.startDate && campaign.startDate > now) return PENALTY
  if (campaign.endDate && campaign.endDate < now) return PENALTY

  if (campaign.budget != null && campaign.spent >= campaign.budget) return PENALTY

  if (ctx.placement && !campaign.placements.includes(ctx.placement)) return PENALTY

  if (includesId(campaign.categoryIds, ctx.categoryId)) score += 50
  if (includesId(campaign.cityIds, ctx.cityId)) score += 40
  if (includesId(campaign.districtIds, ctx.districtId)) score += 30
  if (keywordMatch(campaign.keywords, ctx.query)) score += 25

  const device = ctx.device ?? "ALL"
  if (campaign.device === "ALL" || campaign.device === device) {
    score += 20
  } else {
    score -= 20
  }

  if (ctx.userInterests?.length && campaign.interests.length) {
    const interests = new Set(ctx.userInterests.map(norm))
    if (campaign.interests.some((i) => interests.has(norm(i)))) score += 15
  }

  if (includesId(campaign.subcategoryIds, ctx.subcategoryId)) score += 10
  if (includesId(campaign.regionIds, ctx.regionId)) score += 10

  return score
}
