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
  location?: string | null
  lat?: number | null
  lng?: number | null
  isPromoted?: boolean
  createdAt?: string
  category: { slug: string; name?: string; nameRu?: string } | string
  seller?: {
    id?: string
    name?: string | null
    avatar?: string | null
    phone?: string | null
    rating?: number
    reviewCount?: number
    isVerified?: boolean
  }
  _count?: { favorites?: number }
}

export type CategoryMeta = {
  slug: string
  title: string
  href: string
}

export const CATEGORY_META: CategoryMeta[] = [
  { slug: "free",        title: "Бесплатно / Отдам даром", href: "/search?cat=free" },
  { slug: "cars",        title: "Транспорт",       href: "/search?cat=cars" },
  { slug: "real-estate", title: "Недвижимость",    href: "/search?cat=real-estate" },
  { slug: "electronics", title: "Электроника",     href: "/search?cat=electronics" },
  { slug: "home",        title: "Дом и интерьер",  href: "/search?cat=home" },
  { slug: "fashion",     title: "Одежда и обувь",  href: "/search?cat=fashion" },
  { slug: "kids",        title: "Детские товары",  href: "/search?cat=kids" },
  { slug: "sport",       title: "Спорт и отдых",   href: "/search?cat=sport" },
  { slug: "services",    title: "Услуги",          href: "/search?cat=services" },
  { slug: "jobs",        title: "Работа",          href: "/search?cat=jobs" },
  { slug: "animals",     title: "Животные",        href: "/search?cat=animals" },
  { slug: "hobby",       title: "Хобби",           href: "/search?cat=hobby" },
  { slug: "other",       title: "Другое",          href: "/search?cat=other" },
]

export function categorySlug(listing: AppListing): string {
  if (typeof listing.category === "string") return listing.category
  return listing.category?.slug ?? ""
}

export function listingHref(listing: AppListing): string {
  const slug = categorySlug(listing)
  return `/listings/${listing.id}`
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
