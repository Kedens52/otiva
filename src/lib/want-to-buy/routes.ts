import { WANT_TO_BUY_PUBLIC_BASE } from "@/config/want-to-buy-brand"

/** Популярные категории для быстрой полосы на главной (подмножество Prisma). */
export const WANT_TO_BUY_FEATURED_CATEGORY_SLUGS = [
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

/** Проверка slug: латиница, цифры, дефис (как в Prisma Category.slug). */
export function isWantToBuyCategorySlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 64
}

/** CUID заявки (Prisma @default(cuid())). */
export function isWantToBuyIdSegment(value: string): boolean {
  return /^c[a-z0-9]{20,}$/i.test(value)
}

export function getWantToBuyHubPath() {
  return WANT_TO_BUY_PUBLIC_BASE
}

export function getWantToBuyCategoriesPath() {
  return `${WANT_TO_BUY_PUBLIC_BASE}/categories`
}

export function getWantToBuyCreatePath(categorySlug?: string) {
  const base = `${WANT_TO_BUY_PUBLIC_BASE}/create`
  if (categorySlug?.trim()) {
    return `${base}?category=${encodeURIComponent(categorySlug.trim())}`
  }
  return base
}

export function getWantToBuyCategoryPath(categorySlug: string) {
  return `${WANT_TO_BUY_PUBLIC_BASE}/${categorySlug}`
}

export function getWantToBuyDetailPath(input: { id: string; categorySlug: string }) {
  return `${WANT_TO_BUY_PUBLIC_BASE}/${input.categorySlug}/${input.id}`
}

export function getWantToBuyOfferPath(input: { id: string; categorySlug: string }) {
  return `${getWantToBuyDetailPath(input)}/offer`
}

export function getWantToBuySearchPath(query?: Record<string, string | undefined>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value?.trim()) params.set(key, value.trim())
  }
  const q = params.toString()
  return q ? `${WANT_TO_BUY_PUBLIC_BASE}/search?${q}` : `${WANT_TO_BUY_PUBLIC_BASE}/search`
}

/** Сегмент URL карточки: пока id заявки (cuid). */
export function parseWantToBuyDetailSlug(slug: string): string {
  return slug.trim()
}

export function wantToBuyItemPath(item: { id: string; category: { slug: string } }) {
  return getWantToBuyDetailPath({ id: item.id, categorySlug: item.category.slug })
}

export function wantToBuyItemOfferPath(item: { id: string; category: { slug: string } }) {
  return getWantToBuyOfferPath({ id: item.id, categorySlug: item.category.slug })
}
