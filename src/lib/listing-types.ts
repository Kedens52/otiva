import { MARKETPLACE_CATEGORIES } from "@/lib/category-config"
import { getListingCategoryBreadcrumbPath } from "@/lib/seo/paths"
import type { PublicUserBadge } from "@/lib/badges/badge-map"
import { getListingPublicPath } from "@/lib/seo/paths"

// ── Unified listing type (matches Prisma API response shape) ─────────────────

export type AppListing = {
  id: string
  title: string
  description?: string | null
  price: number
  status?: string
  images: string[]
  video?: string | null
  city?: string | null
  district?: string | null
  location?: string | null
  lat?: number | null
  lng?: number | null
  showExactAddress?: boolean
  distanceKm?: number | null
  isPromoted?: boolean
  views?: number
  uniqueViews?: number
  createdAt?: string
  /** SEO slug из БД (может отсутствовать в старых ответах API) */
  slug?: string | null
  category: { slug: string; name?: string; nameRu?: string } | string
  seller?: {
    id?: string
    name?: string | null
    avatar?: string | null
    phone?: string | null
    rating?: number
    reviewCount?: number
    isVerified?: boolean
    badges?: PublicUserBadge[]
  }
  _count?: { favorites?: number }
  /** Заполняется GET /api/listings для текущего пользователя */
  favorited?: boolean
  attributes?: Record<string, unknown> | null
  vinStatus?: string | null
}

export type CategoryMeta = {
  slug: string
  title: string
  href: string
}

export const CATEGORY_META: CategoryMeta[] = MARKETPLACE_CATEGORIES.map((category) => ({
  slug: category.slug,
  title: category.title,
  href: getListingCategoryBreadcrumbPath({ categorySlug: category.slug }),
}))

export function categorySlug(listing: AppListing): string {
  if (typeof listing.category === "string") return listing.category
  return listing.category?.slug ?? ""
}

export function listingHref(listing: AppListing): string {
  return getListingPublicPath({
    id: listing.id,
    slug: listing.slug,
    title: listing.title,
    city: listing.city,
  })
}

export function formatPrice(price: number): string {
  if (price === 0) return "Бесплатно"
  return price.toLocaleString("ru-RU") + " ₽"
}

const CATEGORY_TONES: Record<string, string> = {
  free:         "from-orange-400 to-amber-300",
  cars:         "from-emerald-400 to-teal-300",
  "real-estate":"from-blue-400 to-indigo-300",
  electronics:  "from-violet-400 to-purple-300",
  home:         "from-amber-400 to-orange-300",
  fashion:      "from-pink-400 to-rose-300",
  kids:         "from-yellow-400 to-amber-300",
  sport:        "from-lime-400 to-green-300",
  services:     "from-sky-400 to-cyan-300",
}

export function imageToneForCategory(slug: string): string {
  return CATEGORY_TONES[slug] ?? "from-zinc-300 to-zinc-200"
}

/** Реальное фото объявления (не заглушка категории). */
/** Канонический URL фото: только /uploads (старые /api/uploads из БД нормализуем). */
export function normalizeListingImageUrl(url: string): string {
  if (url.startsWith("/api/uploads/")) {
    return url.replace("/api/uploads/", "/uploads/")
  }
  return url
}

export function isListingPhotoUrl(url: string | null | undefined): url is string {
  if (!url?.trim()) return false
  const normalized = normalizeListingImageUrl(url.trim())
  return (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("/uploads/") ||
    normalized.startsWith("data:image/")
  )
}

export function listingThumbnailSrc(
  image: string | null | undefined,
  categorySlugValue: string,
): { src: string; isPhoto: boolean } {
  const isPhoto = isListingPhotoUrl(image)
  const slug = categorySlugValue || "goods"
  return {
    src: isPhoto ? normalizeListingImageUrl(image) : `/categories/${slug}.svg`,
    isPhoto,
  }
}
