import type { ListingScoreWeights } from "@/lib/listings/scoring/types"

export const DEFAULT_LISTING_SCORE_WEIGHTS: ListingScoreWeights = {
  relevance: {
    exactTitle: 100,
    brandModel: 70,
    category: 60,
    subcategory: 40,
    city: 30,
    description: 20,
    attributes: 15,
  },
  quality: {
    photos3Plus: 30,
    goodDescription: 20,
    hasPrice: 20,
    hasLocation: 15,
    hasAttributes: 10,
    recentPhotos: 10,
  },
  freshness: {
    today: 40,
    days3: 30,
    days7: 20,
    days14: 10,
    days30: 5,
  },
  location: {
    sameDistrict: 50,
    sameCity: 40,
    sameRegion: 25,
    nearbyRadius: 15,
  },
  sellerTrust: {
    verifiedPhone: 30,
    completeProfile: 20,
    goodRating: 20,
    fastResponse: 15,
    noComplaints: 10,
    goodAccountAge: 10,
  },
  promotion: {
    highlighted: 20,
    bump: 30,
    recommendation: 40,
    premium: 50,
    pinned: 60,
    turbo: 40,
  },
  penalty: {
    incomplete: 50,
    noPhotos: 80,
    complaints: 100,
    spamSuspicion: 120,
    duplicate: 150,
    forbidden: 200,
    fraudSuspicion: 300,
  },
  promotionCapPercent: 28,
  maxPromotedPageRatio: 0.3,
}

export function mergeListingScoreWeights(
  partial?: Partial<ListingScoreWeights>,
): ListingScoreWeights {
  if (!partial) return DEFAULT_LISTING_SCORE_WEIGHTS
  const d = DEFAULT_LISTING_SCORE_WEIGHTS
  return {
    relevance: { ...d.relevance, ...partial.relevance },
    quality: { ...d.quality, ...partial.quality },
    freshness: { ...d.freshness, ...partial.freshness },
    location: { ...d.location, ...partial.location },
    sellerTrust: { ...d.sellerTrust, ...partial.sellerTrust },
    promotion: { ...d.promotion, ...partial.promotion },
    penalty: { ...d.penalty, ...partial.penalty },
    promotionCapPercent: partial.promotionCapPercent ?? d.promotionCapPercent,
    maxPromotedPageRatio: partial.maxPromotedPageRatio ?? d.maxPromotedPageRatio,
  }
}
