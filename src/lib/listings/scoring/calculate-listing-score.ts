import { calculateDistanceKm } from "@/lib/geo/distance"
import { expandMarketplaceSearchTokenGroups } from "@/lib/listings/search-aliases"
import { tokenizeSearchQuery, tokenizeSearchQueryGroups } from "@/lib/search/search-query"
import { mergeListingScoreWeights } from "@/lib/listings/scoring/weights-default"
import type {
  ListingScoreBreakdown,
  ListingScoreContext,
  ListingScoreWeights,
} from "@/lib/listings/scoring/types"

export type ListingForScoring = {
  id: string
  title: string
  description: string
  price: number
  city?: string | null
  district?: string | null
  location?: string | null
  lat?: number | null
  lng?: number | null
  images?: string[]
  attributes?: unknown
  uniqueViews: number
  createdAt: Date
  updatedAt?: Date
  isPromoted: boolean
  promotedUntil?: Date | string | null
  highlightedUntil?: Date | string | null
  pinnedUntil?: Date | string | null
  status?: string
  rejectionReason?: string | null
  returnedForRevision?: boolean
  category?: { id?: string; slug?: string; name?: string | null; nameRu?: string | null } | null
  freshnessConfirmedAt?: Date | null
  sellerId: string
  seller?: {
    isVerified?: boolean
    phoneVerifiedAt?: Date | string | null
    rating?: number
    reviewCount?: number
    negativeReviewsCount?: number
    avgResponseMinutes?: number | null
    createdAt?: Date | string
    accountRestricted?: boolean
    premiumUntil?: Date | string | null
    name?: string | null
    description?: string | null
    city?: string | null
    avatar?: string | null
    trustTier?: string
    riskPenaltyScore?: number
  } | null
  reportCount?: number
}

function norm(s: string | null | undefined) {
  return (s ?? "").trim().toLowerCase()
}

function isActiveUntil(value: Date | string | null | undefined, now: Date) {
  if (!value) return false
  const d = value instanceof Date ? value : new Date(value)
  return !Number.isNaN(d.getTime()) && d.getTime() > now.getTime()
}

function attrsObj(attributes: unknown): Record<string, unknown> {
  if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) return {}
  return attributes as Record<string, unknown>
}

function daysSince(date: Date, now: Date) {
  return (now.getTime() - date.getTime()) / 86400000
}

function scoreRelevance(
  listing: ListingForScoring,
  ctx: ListingScoreContext,
  w: ListingScoreWeights["relevance"],
): { score: number; reasons: string[] } {
  const reasons: string[] = []
  let score = 0
  const q = norm(ctx.searchQuery)
  if (!q) return { score: 0, reasons }

  const title = norm(listing.title)
  const desc = norm(listing.description)
  const city = norm(listing.city)
  const district = norm(listing.district)
  const catSlug = norm(listing.category?.slug)
  const attrs = attrsObj(listing.attributes)
  const attrsStr = JSON.stringify(attrs).toLowerCase()
  const sub = norm(String(attrs.subcategory ?? attrs.animal_type ?? ""))

  const plainTokens = tokenizeSearchQuery(ctx.searchQuery ?? undefined)
  const exactQuery = plainTokens.join(" ").trim()

  if (exactQuery && title === exactQuery) {
    score += w.exactTitle
    reasons.push(`exact title +${w.exactTitle}`)
  } else if (exactQuery && title.includes(exactQuery)) {
    score += Math.round(w.exactTitle * 0.85)
    reasons.push(`title contains query +${Math.round(w.exactTitle * 0.85)}`)
  }

  const make = norm(String(attrs.make ?? attrs.brand ?? ""))
  const model = norm(String(attrs.model ?? ""))
  for (const token of plainTokens) {
    if (token.length < 2) continue
    if ((make && make.includes(token)) || (model && model.includes(token))) {
      score += w.brandModel
      reasons.push(`brand/model +${w.brandModel}`)
      break
    }
  }

  if (ctx.categoryId && catSlug === norm(ctx.categoryId)) {
    score += w.category
    reasons.push(`category +${w.category}`)
  }

  if (ctx.subcategoryId && sub === norm(ctx.subcategoryId)) {
    score += w.subcategory
    reasons.push(`subcategory +${w.subcategory}`)
  }

  if (ctx.cityId && city === norm(ctx.cityId)) {
    score += w.city
    reasons.push(`city +${w.city}`)
  }

  if (desc.includes(q) || tokenizeSearchQueryGroups(ctx.searchQuery ?? undefined).some((g) => g.some((t) => desc.includes(t)))) {
    score += w.description
    reasons.push(`description +${w.description}`)
  }

  const tokenGroups = expandMarketplaceSearchTokenGroups(tokenizeSearchQueryGroups(ctx.searchQuery ?? undefined))
  if (tokenGroups.some((g) => g.some((t) => attrsStr.includes(t)))) {
    score += w.attributes
    reasons.push(`attributes +${w.attributes}`)
  }

  return { score, reasons }
}

function scoreQuality(
  listing: ListingForScoring,
  w: ListingScoreWeights["quality"],
): { score: number; reasons: string[] } {
  const reasons: string[] = []
  let score = 0
  const photos = listing.images?.filter(Boolean).length ?? 0
  const descLen = (listing.description || "").trim().length
  const attrs = attrsObj(listing.attributes)

  if (photos >= 3) {
    score += w.photos3Plus
    reasons.push(`3+ photos +${w.photos3Plus}`)
  }
  if (descLen >= 120) {
    score += w.goodDescription
    reasons.push(`description +${w.goodDescription}`)
  }
  if (listing.price > 0) {
    score += w.hasPrice
    reasons.push(`price +${w.hasPrice}`)
  }
  if (listing.city || listing.district) {
    score += w.hasLocation
    reasons.push(`location fields +${w.hasLocation}`)
  }
  if (Object.keys(attrs).length > 0) {
    score += w.hasAttributes
    reasons.push(`attributes +${w.hasAttributes}`)
  }
  if (photos >= 1 && listing.updatedAt) {
    const days = daysSince(listing.updatedAt instanceof Date ? listing.updatedAt : new Date(listing.updatedAt), new Date())
    if (days <= 14) {
      score += w.recentPhotos
      reasons.push(`recent photos +${w.recentPhotos}`)
    }
  }

  return { score, reasons }
}

function scoreFreshness(
  listing: ListingForScoring,
  now: Date,
  w: ListingScoreWeights["freshness"],
): { score: number; reasons: string[] } {
  const anchor = listing.freshnessConfirmedAt ?? listing.createdAt
  const days = daysSince(anchor, now)
  const reasons: string[] = []
  if (days <= 1) return { score: w.today, reasons: [`fresh today +${w.today}`] }
  if (days <= 3) return { score: w.days3, reasons: [`fresh 3d +${w.days3}`] }
  if (days <= 7) return { score: w.days7, reasons: [`fresh 7d +${w.days7}`] }
  if (days <= 14) return { score: w.days14, reasons: [`fresh 14d +${w.days14}`] }
  if (days <= 30) return { score: w.days30, reasons: [`fresh 30d +${w.days30}`] }
  return { score: 0, reasons }
}

function scoreLocation(
  listing: ListingForScoring,
  ctx: ListingScoreContext,
  w: ListingScoreWeights["location"],
): { score: number; reasons: string[] } {
  const reasons: string[] = []
  let score = 0
  const ul = ctx.userLocation
  if (!ul) return { score: 0, reasons }

  if (ctx.districtId && norm(listing.district) === norm(ctx.districtId)) {
    score += w.sameDistrict
    reasons.push(`district +${w.sameDistrict}`)
  } else if (ul.district && norm(listing.district) === norm(ul.district)) {
    score += w.sameDistrict
    reasons.push(`user district +${w.sameDistrict}`)
  }

  if (ctx.cityId && norm(listing.city) === norm(ctx.cityId)) {
    score += w.sameCity
    reasons.push(`city +${w.sameCity}`)
  } else if (ul.city && norm(listing.city) === norm(ul.city)) {
    score += w.sameCity
    reasons.push(`user city +${w.sameCity}`)
  }

  if (ctx.regionId && ul.region && norm(ul.region) === norm(ctx.regionId)) {
    score += w.sameRegion
    reasons.push(`region +${w.sameRegion}`)
  }

  if (
    ul.lat != null &&
    ul.lng != null &&
    listing.lat != null &&
    listing.lng != null &&
    Number.isFinite(ul.lat) &&
    Number.isFinite(ul.lng)
  ) {
    const km = calculateDistanceKm(ul.lat, ul.lng, listing.lat, listing.lng)
    if (km <= 25) {
      score += w.nearbyRadius
      reasons.push(`nearby ${km.toFixed(0)}km +${w.nearbyRadius}`)
    }
  }

  return { score, reasons }
}

function scoreSellerTrust(
  listing: ListingForScoring,
  now: Date,
  w: ListingScoreWeights["sellerTrust"],
): { score: number; reasons: string[] } {
  const s = listing.seller
  if (!s) return { score: 0, reasons: [] }
  const reasons: string[] = []
  let score = 0

  if (s.isVerified || s.phoneVerifiedAt) {
    score += w.verifiedPhone
    reasons.push(`verified +${w.verifiedPhone}`)
  }
  if (s.name?.trim() && (s.description?.trim() || s.avatar) && s.city?.trim()) {
    score += w.completeProfile
    reasons.push(`profile +${w.completeProfile}`)
  }
  if ((s.rating ?? 0) >= 4 && (s.reviewCount ?? 0) >= 3) {
    score += w.goodRating
    reasons.push(`rating +${w.goodRating}`)
  }
  if (s.avgResponseMinutes != null && s.avgResponseMinutes <= 120) {
    score += w.fastResponse
    reasons.push(`fast response +${w.fastResponse}`)
  }
  if ((listing.reportCount ?? 0) === 0 && (s.negativeReviewsCount ?? 0) === 0) {
    score += w.noComplaints
    reasons.push(`no complaints +${w.noComplaints}`)
  }
  if (s.createdAt) {
    const ageDays = daysSince(s.createdAt instanceof Date ? s.createdAt : new Date(s.createdAt), now)
    if (ageDays >= 30) {
      score += w.goodAccountAge
      reasons.push(`account age +${w.goodAccountAge}`)
    }
  }

  return { score, reasons }
}

function promotionBoostRaw(
  listing: ListingForScoring,
  now: Date,
  w: ListingScoreWeights["promotion"],
): { boost: number; reasons: string[] } {
  const reasons: string[] = []
  let boost = 0
  const pinned = isActiveUntil(listing.pinnedUntil, now)
  const highlighted = isActiveUntil(listing.highlightedUntil, now)
  const bumped = listing.isPromoted && isActiveUntil(listing.promotedUntil, now)
  const premium = listing.seller?.premiumUntil && isActiveUntil(listing.seller.premiumUntil, now)

  if (pinned) {
    boost = Math.max(boost, w.pinned)
    reasons.push(`pinned +${w.pinned}`)
  }
  if (premium) {
    boost = Math.max(boost, w.premium)
    reasons.push(`premium +${w.premium}`)
  }
  if (highlighted && bumped) {
    boost = Math.max(boost, w.turbo)
    reasons.push(`turbo +${w.turbo}`)
  } else {
    if (highlighted) {
      boost = Math.max(boost, w.highlighted)
      reasons.push(`highlight +${w.highlighted}`)
    }
    if (bumped) {
      boost = Math.max(boost, w.bump)
      reasons.push(`bump +${w.bump}`)
    }
  }
  if (bumped && !highlighted && !pinned) {
    boost = Math.max(boost, w.recommendation)
    reasons.push(`recommendation +${w.recommendation}`)
  }

  return { boost, reasons }
}

function scorePenalties(
  listing: ListingForScoring,
  w: ListingScoreWeights["penalty"],
): { score: number; reasons: string[] } {
  const reasons: string[] = []
  let score = 0
  const photos = listing.images?.filter(Boolean).length ?? 0
  const descLen = (listing.description || "").trim().length
  const seller = listing.seller

  if (photos === 0) {
    score += w.noPhotos
    reasons.push(`no photos -${w.noPhotos}`)
  }
  if (descLen < 40 || !listing.city || listing.price < 0) {
    score += w.incomplete
    reasons.push(`incomplete -${w.incomplete}`)
  }
  const reports = listing.reportCount ?? 0
  if (reports >= 1) {
    score += w.complaints * Math.min(3, reports)
    reasons.push(`complaints -${w.complaints * Math.min(3, reports)}`)
  }
  if (listing.returnedForRevision || listing.status === "REJECTED") {
    score += w.spamSuspicion
    reasons.push(`moderation flag -${w.spamSuspicion}`)
  }
  if (seller?.trustTier === "HIGH_RISK" || seller?.trustTier === "BLOCKED") {
    score += w.fraudSuspicion
    reasons.push(`trust tier -${w.fraudSuspicion}`)
  } else if (seller?.trustTier === "WATCH") {
    score += w.spamSuspicion
    reasons.push(`watch tier -${w.spamSuspicion}`)
  }
  if (seller?.accountRestricted) {
    score += w.spamSuspicion
    reasons.push(`restricted -${w.spamSuspicion}`)
  }
  if ((seller?.riskPenaltyScore ?? 0) >= 50) {
    score += w.fraudSuspicion
    reasons.push(`risk score -${w.fraudSuspicion}`)
  }

  return { score, reasons }
}

/** Подготовка строки из Prisma include для скоринга. */
export function toListingForScoring<T extends ListingForScoring & { _count?: { reports?: number } }>(
  item: T,
): ListingForScoring {
  return {
    ...item,
    reportCount: item.reportCount ?? item._count?.reports ?? 0,
  }
}

export function isPromotedListing(listing: ListingForScoring, now = new Date()): boolean {
  return (
    (listing.isPromoted && isActiveUntil(listing.promotedUntil, now)) ||
    isActiveUntil(listing.highlightedUntil, now) ||
    isActiveUntil(listing.pinnedUntil, now)
  )
}

export function calculateListingScore(
  listing: ListingForScoring,
  context: ListingScoreContext = {},
): ListingScoreBreakdown {
  const now = context.currentDate ?? new Date()
  const weights = mergeListingScoreWeights(context.weights)

  const rel = scoreRelevance(listing, context, weights.relevance)
  const qual = scoreQuality(listing, weights.quality)
  const fresh = scoreFreshness(listing, now, weights.freshness)
  const loc = scoreLocation(listing, context, weights.location)
  const trust = scoreSellerTrust(listing, now, weights.sellerTrust)
  const promo = promotionBoostRaw(listing, now, weights.promotion)
  const pen = scorePenalties(listing, weights.penalty)

  const relevanceScore = rel.score
  const qualityScore = qual.score
  const freshnessScore = fresh.score
  const locationScore = loc.score
  const sellerTrustScore = trust.score
  const penaltyScore = pen.score

  let organicScore =
    relevanceScore + qualityScore + freshnessScore + locationScore + sellerTrustScore - penaltyScore
  organicScore = Math.max(0, organicScore)

  const cap = Math.max(0, organicScore * (weights.promotionCapPercent / 100))
  const promotionBoostCapped = Math.min(promo.boost, cap)
  const finalScore = organicScore + promotionBoostCapped

  const reasons = [
    ...rel.reasons,
    ...qual.reasons,
    ...fresh.reasons,
    ...loc.reasons,
    ...trust.reasons,
    ...promo.reasons,
    ...pen.reasons,
    `organic=${organicScore}`,
    promo.boost > 0
      ? `promotion ${promo.boost}→${promotionBoostCapped} (cap ${weights.promotionCapPercent}% → max ${Math.round(cap)})`
      : "promotion=0",
    `final=${finalScore}`,
  ]

  return {
    relevanceScore,
    qualityScore,
    freshnessScore,
    locationScore,
    sellerTrustScore,
    promotionBoostRaw: promo.boost,
    promotionBoostCapped,
    organicScore,
    penaltyScore,
    finalScore,
    isPromotedListing: isPromotedListing(listing, now),
    reasons,
  }
}
