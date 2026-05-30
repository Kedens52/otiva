import type { MarketPriceGroupKey } from "@/lib/market-price/types"

export type MarketPriceGroupConfig = {
  minSampleSize: number
  veryLowRatio: number
  lowRatio: number
  highRatio: number
  veryHighRatio: number
  matchKeys: string[]
}

export const MARKET_PRICE_CONFIG: Record<MarketPriceGroupKey, MarketPriceGroupConfig> = {
  transport: {
    minSampleSize: 5,
    veryLowRatio: 0.6,
    lowRatio: 0.8,
    highRatio: 1.2,
    veryHighRatio: 1.4,
    matchKeys: ["vehicle_type", "make", "model", "year"],
  },
  realEstate: {
    minSampleSize: 5,
    veryLowRatio: 0.7,
    lowRatio: 0.85,
    highRatio: 1.15,
    veryHighRatio: 1.3,
    matchKeys: ["deal_type", "property_type", "rooms", "area"],
  },
  electronics: {
    minSampleSize: 5,
    veryLowRatio: 0.5,
    lowRatio: 0.7,
    highRatio: 1.25,
    veryHighRatio: 1.5,
    matchKeys: ["brand", "model", "condition"],
  },
  services: {
    minSampleSize: 5,
    veryLowRatio: 0.6,
    lowRatio: 0.75,
    highRatio: 1.4,
    veryHighRatio: 1.8,
    matchKeys: ["service_type", "subcategory"],
  },
  jobs: {
    minSampleSize: 5,
    veryLowRatio: 0.65,
    lowRatio: 0.8,
    highRatio: 1.3,
    veryHighRatio: 1.6,
    matchKeys: ["position", "employment_type", "subcategory"],
  },
  goods: {
    minSampleSize: 5,
    veryLowRatio: 0.55,
    lowRatio: 0.75,
    highRatio: 1.25,
    veryHighRatio: 1.45,
    matchKeys: ["subcategory", "condition", "brand"],
  },
}

const SLUG_TO_GROUP: Record<string, MarketPriceGroupKey> = {
  cars: "transport",
  "real-estate": "realEstate",
  electronics: "electronics",
  services: "services",
  jobs: "jobs",
}

export function resolveMarketPriceGroup(categorySlug: string): MarketPriceGroupKey {
  return SLUG_TO_GROUP[categorySlug] ?? "goods"
}
