import { getSeoCategoryChild, getSeoCategoryConfig, toSeoSegment } from "@/lib/seo/categories"

/**
 * Парсит /category/transport/passenger-cars/moskva
 * segments[0] — SEO-категория, [1] — подкатегория или город, [2] — город
 */
export function resolveCategoryRouteSegments(segments: string[]) {
  const categorySlug = segments[0]
  const config = getSeoCategoryConfig(categorySlug)
  if (!config) return null

  const rest = segments.slice(1)
  if (!rest.length) {
    return { categorySlug, segment: undefined as string | undefined }
  }

  if (rest.length === 1) {
    const one = rest[0]
    if (getSeoCategoryChild(categorySlug, one)) {
      return { categorySlug, segment: one }
    }
    return { categorySlug, segment: one }
  }

  const childSlug = rest[0]
  const citySegment = rest[1]
  if (getSeoCategoryChild(categorySlug, childSlug)) {
    return { categorySlug, segment: childSlug, citySegment }
  }

  return { categorySlug, segment: rest.join("/") }
}

export function formatCategorySegmentsLabel(segments: string[]) {
  return segments.filter(Boolean).join(" / ")
}
