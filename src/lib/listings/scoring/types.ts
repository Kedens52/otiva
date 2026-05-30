export type ListingScoreWeights = {
  relevance: {
    exactTitle: number
    brandModel: number
    category: number
    subcategory: number
    city: number
    description: number
    attributes: number
  }
  quality: {
    photos3Plus: number
    goodDescription: number
    hasPrice: number
    hasLocation: number
    hasAttributes: number
    recentPhotos: number
  }
  freshness: {
    today: number
    days3: number
    days7: number
    days14: number
    days30: number
  }
  location: {
    sameDistrict: number
    sameCity: number
    sameRegion: number
    nearbyRadius: number
  }
  sellerTrust: {
    verifiedPhone: number
    completeProfile: number
    goodRating: number
    fastResponse: number
    noComplaints: number
    goodAccountAge: number
  }
  promotion: {
    highlighted: number
    bump: number
    recommendation: number
    premium: number
    pinned: number
    turbo: number
  }
  penalty: {
    incomplete: number
    noPhotos: number
    complaints: number
    spamSuspicion: number
    duplicate: number
    forbidden: number
    fraudSuspicion: number
  }
  promotionCapPercent: number
  maxPromotedPageRatio: number
}

export type ListingScoreContext = {
  searchQuery?: string | null
  categoryId?: string | null
  subcategoryId?: string | null
  cityId?: string | null
  districtId?: string | null
  regionId?: string | null
  userLocation?: {
    lat?: number | null
    lng?: number | null
    city?: string | null
    district?: string | null
    region?: string | null
  } | null
  sortMode?: string | null
  currentDate?: Date
  weights?: Partial<ListingScoreWeights>
}

export type ListingScoreBreakdown = {
  relevanceScore: number
  qualityScore: number
  freshnessScore: number
  locationScore: number
  sellerTrustScore: number
  promotionBoostRaw: number
  promotionBoostCapped: number
  organicScore: number
  penaltyScore: number
  finalScore: number
  isPromotedListing: boolean
  reasons: string[]
}
