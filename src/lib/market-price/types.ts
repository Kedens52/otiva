export type MarketPriceStatus =
  | "NORMAL"
  | "LOW"
  | "VERY_LOW"
  | "HIGH"
  | "VERY_HIGH"
  | "UNKNOWN"

export type MarketPriceGroupKey =
  | "transport"
  | "realEstate"
  | "electronics"
  | "services"
  | "jobs"
  | "goods"

export type MarketPriceEstimateInput = {
  categorySlug: string
  subcategory?: string
  price: number
  city?: string
  region?: string
  attributes?: Record<string, unknown>
  excludeListingId?: string
}

export type PriceStats = {
  min: number
  max: number
  median: number
  average: number
  p25: number
  p75: number
  sampleSize: number
}

export type MarketPriceRange = {
  min: number
  max: number
  median: number
  p25: number
  p75: number
  sampleSize: number
  confidence: "low" | "medium" | "high"
}

export type MarketPriceEstimateResult = {
  status: MarketPriceStatus
  range: MarketPriceRange | null
  sampleSize: number
  confidence: "low" | "medium" | "high"
  message: string
  reasonsRequired: boolean
  comparableListingsCount: number
  buyerHint?: string | null
}
