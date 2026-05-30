import { toSeoSegment } from "@/lib/seo/categories"

const CUID_PATTERN = /^c[a-z0-9]{20,}$/i
const SLUG_ID_SUFFIX = /-([a-z0-9]{20,})$/i

/** Транслитерация и нормализация для ЧПУ (алиас toSeoSegment). */
export function createSeoSlug(value: string, maxLength = 72) {
  const base = toSeoSegment(value)
  if (!base) return "item"
  return base.length > maxLength ? base.slice(0, maxLength).replace(/-+$/g, "") : base
}

export function isListingCuid(value: string) {
  return CUID_PATTERN.test(value)
}

/** Извлекает id объявления из ЧПУ или возвращает сам параметр, если это cuid. */
export function parseListingIdFromSlug(slugOrId: string): string {
  const raw = decodeURIComponent(slugOrId).trim()
  if (isListingCuid(raw)) return raw
  const match = raw.match(SLUG_ID_SUFFIX)
  if (match?.[1] && isListingCuid(match[1])) return match[1]
  return raw
}

export function createListingSlug(title: string, city: string | null | undefined, id: string) {
  const titlePart = createSeoSlug(title, 56)
  const cityPart = city ? createSeoSlug(city, 24) : ""
  const middle = cityPart ? `${titlePart}-${cityPart}` : titlePart
  return `${middle}-${id}`
}

export function createSellerSlug(name: string, id: string) {
  const namePart = createSeoSlug(name || "seller", 40)
  return `${namePart}-${id}`
}

export function parseSellerIdFromSlug(slugOrId: string): string {
  return parseListingIdFromSlug(slugOrId)
}

export async function ensureUniqueListingSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
) {
  let candidate = base
  let n = 0
  while (await exists(candidate)) {
    n += 1
    candidate = `${base}-${n}`
  }
  return candidate
}
