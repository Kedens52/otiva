import { MARKETPLACE_CATEGORIES } from "@/lib/category-config"
import { CATEGORY_META } from "@/lib/listing-types"
import type { WantToBuyCategoryOption } from "@/lib/want-to-buy/client-types"
import { WANT_TO_BUY_FEATURED_CATEGORY_SLUGS } from "@/lib/want-to-buy/routes"

const featuredSet = new Set<string>(WANT_TO_BUY_FEATURED_CATEGORY_SLUGS)

export function getWantToBuyCategoryTitle(slug: string, nameRu: string): string {
  return CATEGORY_META.find((m) => m.slug === slug)?.title ?? nameRu
}

export function getWantToBuyCategoryIcon(slug: string): string {
  return MARKETPLACE_CATEGORIES.find((c) => c.slug === slug)?.icon ?? "📦"
}

/** Подпись на плашке: «Куплю электронику», «Куплю авто» и т.д. */
const WANT_TO_BUY_BUY_LABELS: Record<string, string> = {
  cars: "Куплю авто",
  parts: "Куплю запчасти",
  "real-estate": "Куплю недвижимость",
  electronics: "Куплю электронику",
  home: "Куплю для дома",
  fashion: "Куплю одежду",
  kids: "Куплю для детей",
  sport: "Куплю спорттовары",
  animals: "Куплю животных",
  hobby: "Куплю для хобби",
  services: "Куплю услуги",
  jobs: "Куплю работу",
  free: "Куплю бесплатно",
  goods: "Куплю товары",
  business: "Куплю для бизнеса",
  other: "Куплю другое",
}

export function getWantToBuyBuyLabel(slug: string, nameRu: string): string {
  if (WANT_TO_BUY_BUY_LABELS[slug]) return WANT_TO_BUY_BUY_LABELS[slug]
  const title = getWantToBuyCategoryTitle(slug, nameRu)
  const lower = title.charAt(0).toLowerCase() + title.slice(1)
  return `Куплю ${lower}`
}

export const WANT_TO_BUY_CATEGORY_BG: Record<string, string> = {
  free: "#FFF3EC",
  goods: "#F3F4F6",
  cars: "#EAF2FF",
  parts: "#F5F5F5",
  "real-estate": "#EAF8FF",
  electronics: "#EEECFF",
  home: "#FFF8E6",
  fashion: "#FFF0F5",
  kids: "#FFF0FB",
  sport: "#F0FFF4",
  services: "#F5F0FF",
  jobs: "#F0F4F8",
  animals: "#FFF3EA",
  hobby: "#EAFAF2",
  business: "#F0F4FF",
  other: "#F5F5F5",
}

/** Популярные категории выше, остальные по алфавиту (ru). */
export function sortWantToBuyCategories(
  categories: WantToBuyCategoryOption[],
): WantToBuyCategoryOption[] {
  return [...categories].sort((a, b) => {
    const aFeatured = featuredSet.has(a.slug)
    const bFeatured = featuredSet.has(b.slug)
    if (aFeatured !== bFeatured) return aFeatured ? -1 : 1
    return getWantToBuyCategoryTitle(a.slug, a.nameRu).localeCompare(
      getWantToBuyCategoryTitle(b.slug, b.nameRu),
      "ru",
    )
  })
}
