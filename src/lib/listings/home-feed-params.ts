import { isCityFilterActive } from "@/lib/city-selection"

/** Параметры API для блока «Рекомендации» на главной (fair-ranking + город). */
export function buildHomeRecommendationsParams(city: string): URLSearchParams {
  const sp = new URLSearchParams({
    pageSize: "48",
    sortBy: "default",
    sortOrder: "desc",
  })
  if (isCityFilterActive(city)) sp.set("city", city)
  return sp
}

/** Параметры API для блока «Свежие объявления». */
export function buildHomeLatestParams(city: string): URLSearchParams {
  const sp = new URLSearchParams({
    pageSize: "20",
    sortBy: "createdAt",
    sortOrder: "desc",
  })
  if (isCityFilterActive(city)) sp.set("city", city)
  return sp
}

export function buildHomeSectionSearchHref(
  sort: "default" | "newest",
  city: string,
  categorySlug?: string,
): string {
  const sp = new URLSearchParams({ sort })
  if (isCityFilterActive(city)) sp.set("city", city)
  if (categorySlug) sp.set("cat", categorySlug)
  return `/search?${sp.toString()}`
}
