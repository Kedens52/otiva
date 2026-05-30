import type { MarketPriceGroupConfig } from "@/lib/market-price/marketPriceConfig"
import type { MarketPriceStatus, PriceStats } from "@/lib/market-price/types"

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0
  const idx = (sorted.length - 1) * p
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]!
  const w = idx - lo
  return Math.round(sorted[lo]! * (1 - w) + sorted[hi]! * w)
}

/** Убирает явные выбросы относительно медианы */
export function filterOutlierPrices(prices: number[]): number[] {
  if (prices.length < 6) return prices
  const sorted = [...prices].sort((a, b) => a - b)
  const median = percentile(sorted, 0.5)
  if (median <= 0) return prices
  return prices.filter((p) => p >= median * 0.05 && p <= median * 20)
}

export function calculatePriceStats(prices: number[]): PriceStats | null {
  const cleaned = filterOutlierPrices(prices.filter((p) => p > 0))
  if (!cleaned.length) return null
  const sorted = [...cleaned].sort((a, b) => a - b)
  const sum = sorted.reduce((a, b) => a + b, 0)
  return {
    min: sorted[0]!,
    max: sorted[sorted.length - 1]!,
    median: percentile(sorted, 0.5),
    average: Math.round(sum / sorted.length),
    p25: percentile(sorted, 0.25),
    p75: percentile(sorted, 0.75),
    sampleSize: sorted.length,
  }
}

export function detectPriceAnomaly(
  price: number,
  stats: PriceStats,
  config: MarketPriceGroupConfig,
): MarketPriceStatus {
  if (price <= 0) return "UNKNOWN"
  if (stats.sampleSize < config.minSampleSize) return "UNKNOWN"
  const { p25, p75 } = stats
  if (p25 <= 0 || p75 <= 0) return "UNKNOWN"

  if (price < p25 * config.veryLowRatio) return "VERY_LOW"
  if (price < p25 * config.lowRatio) return "LOW"
  if (price > p75 * config.veryHighRatio) return "VERY_HIGH"
  if (price > p75 * config.highRatio) return "HIGH"
  return "NORMAL"
}
