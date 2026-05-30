import { type AppListing, categorySlug } from "@/lib/listing-types"

const STORAGE_KEY = "nashlo-user-preferences"
const MAX_RECENT_LISTINGS = 80
const MAX_RECENT_SEARCHES = 30

type PreferenceProfile = {
  categories: Record<string, number>
  listings: Record<string, number>
  searches: string[]
  updatedAt: string
}

type InterestOptions = {
  category?: string
  listingId?: string
  query?: string
  weight?: number
}

const emptyProfile = (): PreferenceProfile => ({
  categories: {},
  listings: {},
  searches: [],
  updatedAt: new Date().toISOString(),
})

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage)
}

export function readPreferenceProfile(): PreferenceProfile {
  if (!canUseStorage()) return emptyProfile()

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyProfile()

    const parsed = JSON.parse(raw) as Partial<PreferenceProfile>
    return {
      categories: parsed.categories ?? {},
      listings: parsed.listings ?? {},
      searches: Array.isArray(parsed.searches) ? parsed.searches : [],
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    }
  } catch {
    return emptyProfile()
  }
}

function savePreferenceProfile(profile: PreferenceProfile) {
  if (!canUseStorage()) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
}

export function trackUserInterest(options: InterestOptions) {
  const weight = Math.max(1, options.weight ?? 1)
  const profile = readPreferenceProfile()

  if (options.category) {
    profile.categories[options.category] = (profile.categories[options.category] || 0) + weight
  }

  if (options.listingId) {
    profile.listings[options.listingId] = (profile.listings[options.listingId] || 0) + weight
    const entries = Object.entries(profile.listings)
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_RECENT_LISTINGS)
    profile.listings = Object.fromEntries(entries)
  }

  const query = options.query?.trim().toLowerCase()
  if (query) {
    profile.searches = [query, ...profile.searches.filter((item) => item !== query)].slice(0, MAX_RECENT_SEARCHES)
  }

  profile.updatedAt = new Date().toISOString()
  savePreferenceProfile(profile)
}

export function trackListingInterest(listing: AppListing, weight = 2) {
  trackUserInterest({
    category: categorySlug(listing),
    listingId: listing.id,
    query: listing.title,
    weight,
  })
}

export function getTopInterestCategories(limit = 3): string[] {
  const profile = readPreferenceProfile()
  return Object.entries(profile.categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([slug]) => slug)
}

type RankOptions = {
  /** Город из шапки — бонус объявлениям в этом городе */
  preferredCity?: string
}

export function rankListingsForUser(listings: AppListing[], options?: RankOptions) {
  const profile = readPreferenceProfile()
  const searchTerms = profile.searches.flatMap((query) => query.split(/\s+/)).filter((term) => term.length > 2)

  return [...listings].sort(
    (a, b) =>
      scoreListing(b, profile, searchTerms, options?.preferredCity) -
      scoreListing(a, profile, searchTerms, options?.preferredCity),
  )
}

function scoreListing(
  listing: AppListing,
  profile: PreferenceProfile,
  searchTerms: string[],
  preferredCity?: string,
) {
  const slug = categorySlug(listing)
  const title = listing.title.toLowerCase()
  const description = listing.description?.toLowerCase() ?? ""
  const createdAt = listing.createdAt ? new Date(listing.createdAt).getTime() : 0
  const ageDays = createdAt ? Math.max(0, (Date.now() - createdAt) / 86_400_000) : 30

  let score = 0
  score += (profile.categories[slug] || 0) * 12
  score += (profile.listings[listing.id] || 0) * 24
  score += listing.isPromoted ? 8 : 0
  score += Math.max(0, 8 - ageDays)

  for (const term of searchTerms) {
    if (title.includes(term)) score += 5
    if (description.includes(term)) score += 2
  }

  if (preferredCity?.trim() && listing.city?.trim()) {
    if (listing.city.trim().toLowerCase() === preferredCity.trim().toLowerCase()) {
      score += 15
    }
  }

  return score
}
