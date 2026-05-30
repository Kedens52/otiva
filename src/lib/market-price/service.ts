import { prisma } from "@/lib/prisma"
import { findComparableListings } from "@/lib/market-price/comparable"
import {
  MARKET_PRICE_CONFIG,
  resolveMarketPriceGroup,
} from "@/lib/market-price/marketPriceConfig"
import { calculatePriceStats, detectPriceAnomaly } from "@/lib/market-price/stats"
import { getPriceWarning } from "@/lib/market-price/messages"
import type {
  MarketPriceEstimateInput,
  MarketPriceEstimateResult,
  MarketPriceRange,
} from "@/lib/market-price/types"

function confidenceFromSample(n: number): "low" | "medium" | "high" {
  if (n >= 20) return "high"
  if (n >= 10) return "medium"
  return "low"
}

function buildRange(stats: NonNullable<ReturnType<typeof calculatePriceStats>>): MarketPriceRange {
  return {
    min: stats.p25,
    max: stats.p75,
    median: stats.median,
    p25: stats.p25,
    p75: stats.p75,
    sampleSize: stats.sampleSize,
    confidence: confidenceFromSample(stats.sampleSize),
  }
}

export async function getMarketPriceEstimate(
  input: MarketPriceEstimateInput,
): Promise<MarketPriceEstimateResult> {
  if (input.price <= 0) {
    return {
      status: "UNKNOWN",
      range: null,
      sampleSize: 0,
      confidence: "low",
      message: "Для бесплатных объявлений рыночная оценка не применяется.",
      reasonsRequired: false,
      comparableListingsCount: 0,
      buyerHint: null,
    }
  }

  const category = await prisma.category.findUnique({
    where: { slug: input.categorySlug },
    select: { id: true },
  })
  if (!category) {
    return {
      status: "UNKNOWN",
      range: null,
      sampleSize: 0,
      confidence: "low",
      message: "Категория не найдена.",
      reasonsRequired: false,
      comparableListingsCount: 0,
      buyerHint: null,
    }
  }

  const subcategory =
    input.subcategory ??
    (typeof input.attributes?.subcategory === "string"
      ? input.attributes.subcategory
      : undefined)

  const comparables = await findComparableListings(
    { ...input, subcategory },
    category.id,
  )
  const prices = comparables.map((c) => c.price)
  const stats = calculatePriceStats(prices)
  const group = resolveMarketPriceGroup(input.categorySlug)
  const config = MARKET_PRICE_CONFIG[group]

  if (!stats || stats.sampleSize < config.minSampleSize) {
    const warn = getPriceWarning("UNKNOWN", input.categorySlug)
    return {
      status: "UNKNOWN",
      range: null,
      sampleSize: stats?.sampleSize ?? 0,
      confidence: "low",
      message: warn.message,
      reasonsRequired: false,
      comparableListingsCount: comparables.length,
      buyerHint: warn.buyerHint,
    }
  }

  const status = detectPriceAnomaly(input.price, stats, config)
  const warn = getPriceWarning(status, input.categorySlug)

  return {
    status,
    range: buildRange(stats),
    sampleSize: stats.sampleSize,
    confidence: confidenceFromSample(stats.sampleSize),
    message: warn.message,
    reasonsRequired: warn.reasonsRequired,
    comparableListingsCount: comparables.length,
    buyerHint: warn.buyerHint,
  }
}

export { detectPriceAnomaly, calculatePriceStats, getPriceWarning }
