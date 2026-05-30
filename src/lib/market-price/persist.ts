import { prisma } from "@/lib/prisma"
import type { MarketPriceEstimateResult } from "@/lib/market-price/types"

export async function persistListingPriceInsight(
  listingId: string,
  estimate: MarketPriceEstimateResult,
  reason?: string | null,
) {
  const data = {
    status: estimate.status,
    min: estimate.range?.min ?? null,
    max: estimate.range?.max ?? null,
    median: estimate.range?.median ?? null,
    p25: estimate.range?.p25 ?? null,
    p75: estimate.range?.p75 ?? null,
    sampleSize: estimate.sampleSize,
    confidence: estimate.confidence,
    message: estimate.message,
    reason: reason?.trim() || null,
    checkedAt: new Date(),
  }

  return prisma.listingPriceInsight.upsert({
    where: { listingId },
    create: { listingId, ...data },
    update: data,
  })
}

export function shouldFlagLowPriceForModeration(estimate: MarketPriceEstimateResult): boolean {
  return estimate.status === "VERY_LOW" && estimate.sampleSize >= 5
}
