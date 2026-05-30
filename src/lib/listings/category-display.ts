import { MARKETPLACE_CATEGORIES } from "@/lib/category-config"

export const HOME_LISTING_CATEGORY_SLUGS = [
  "cars",
  "real-estate",
  "jobs",
  "fashion",
  "hobby",
  "animals",
  "services",
  "electronics",
  "home",
  "parts",
  "kids",
  "sport",
] as const

export const LISTING_CATEGORY_BG: Record<string, string> = {
  cars: "#EAF2FF",
  "real-estate": "#EAF8FF",
  jobs: "#F0F4F8",
  fashion: "#FFF0F5",
  hobby: "#EAFAF2",
  animals: "#FFF3EA",
  services: "#F5F0FF",
  electronics: "#EEECFF",
  home: "#FFF8E6",
  parts: "#F5F5F5",
  kids: "#FFF0FB",
  sport: "#F0FFF4",
  goods: "#F3F4F6",
  business: "#F0F4FF",
  free: "#FFF3EC",
  other: "#F5F5F5",
}

export function getListingCategoryIcon(slug: string): string {
  return MARKETPLACE_CATEGORIES.find((c) => c.slug === slug)?.icon ?? "📦"
}
