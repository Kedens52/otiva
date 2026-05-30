import type { AdCampaign, AdStatus, Prisma, PrismaClient } from "@prisma/client"
import { hasModerationSensitiveChanges } from "@/lib/ads/campaign-moderation"
import { sanitizeAdTargetUrl } from "@/lib/ads/url-safety"

export async function logAdCampaignChange(
  prisma: PrismaClient,
  input: {
    adCampaignId: string
    userId?: string | null
    action: string
    oldValue?: Prisma.InputJsonValue
    newValue?: Prisma.InputJsonValue
  },
) {
  await prisma.adCampaignChangeLog.create({
    data: {
      adCampaignId: input.adCampaignId,
      userId: input.userId ?? null,
      action: input.action,
      oldValue: input.oldValue,
      newValue: input.newValue,
    },
  })
}

export function serializeCampaignForClient(campaign: AdCampaign) {
  return {
    ...campaign,
    ctr:
      campaign.impressions > 0
        ? Math.round((campaign.clicks / campaign.impressions) * 10000) / 100
        : 0,
    budgetRemaining:
      campaign.budget != null ? Math.max(0, campaign.budget - campaign.spent) : null,
  }
}

export function resolveStatusAfterUserEdit(
  currentStatus: AdStatus,
  changedKeys: string[],
): AdStatus {
  if (currentStatus !== "ACTIVE") return currentStatus
  if (hasModerationSensitiveChanges(changedKeys)) return "PENDING_REVIEW"
  return currentStatus
}

export function validateCampaignTargetUrl(url: string) {
  return sanitizeAdTargetUrl(url)
}

export const USER_EDITABLE_STATUSES: AdStatus[] = [
  "DRAFT",
  "WAITING_PAYMENT",
  "NEEDS_CHANGES",
  "PAUSED",
  "ACTIVE",
]
