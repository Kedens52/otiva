import { WANT_TO_BUY_PUBLIC_BASE } from "@/config/want-to-buy-brand"
import { resolveListingSeoPath } from "@/lib/seo/categories"
import { getWantToBuyDetailPath } from "@/lib/want-to-buy/routes"
import { createListingSlug, createSellerSlug, isListingCuid, parseListingIdFromSlug } from "@/lib/seo/slug"

/** Канонический путь категории с префиксом /category (для sitemap и alternates). */
/** Канонический путь категории для крошек объявления (с префиксом /category). */
export function getListingCategoryBreadcrumbPath(input: {
  categorySlug: string | null | undefined
  attributes?: Record<string, unknown> | null
}) {
  const short = resolveListingSeoPath(input)
  if (short === "/search" || short.startsWith("/search?")) return short
  return `/category${short}`
}

export function getCategorySeoPath(
  categorySlug: string,
  segment?: string | null,
  cityOrExtraSegment?: string | null,
) {
  const parts = [segment, cityOrExtraSegment].filter(Boolean) as string[]
  const inner =
    parts.length > 0
      ? `/${categorySlug}/${parts.join("/")}`
      : `/${categorySlug}`
  return `/category${inner}`
}

/** Публичный URL заявки «Куплю». */
export function getWantToBuyPublicPath(input: string | { id: string; categorySlug: string }) {
  if (typeof input === "string") {
    return `${WANT_TO_BUY_PUBLIC_BASE}/${input}`
  }
  return getWantToBuyDetailPath(input)
}

/** Публичный URL объявления: ЧПУ с id в конце или fallback на cuid. */
export function getListingPublicPath(input: {
  id: string
  slug?: string | null
  title?: string
  city?: string | null
}) {
  const stored = input.slug?.trim()
  if (stored) {
    const segment = stored.replace(/^\/listings\//, "")
    const parsedId = parseListingIdFromSlug(segment)
    if (isListingCuid(parsedId) && (segment === input.id || segment.endsWith(input.id))) {
      return `/listings/${segment}`
    }
  }
  if (input.title) {
    return `/listings/${createListingSlug(input.title, input.city, input.id)}`
  }
  return `/listings/${input.id}`
}

/** Legacy path без slug (всегда работает). */
export function getListingLegacyPath(id: string) {
  return `/listings/${id}`
}

export function getSellerPublicPath(input: { id: string; slug?: string | null; name?: string | null }) {
  if (input.slug?.trim()) return `/seller/${input.slug.trim()}`
  if (input.name) return `/seller/${createSellerSlug(input.name, input.id)}`
  return `/profile/${input.id}`
}

export function getSellerLegacyPath(id: string) {
  return `/profile/${id}`
}

export function resolveListingRouteParam(param: string) {
  if (isListingCuid(param)) return { id: param, slugParam: param }
  return { id: parseListingIdFromSlug(param), slugParam: param }
}
