import { MARKETPLACE_CATEGORIES } from "@/lib/category-config"
import { getListingPublicPath } from "@/lib/seo/paths"
import { isListingIndexable } from "@/lib/seo/listing-indexability"

const BUY_CATEGORIES = new Set([
  "electronics",
  "phones",
  "laptops",
  "computers",
  "home",
  "appliances",
  "furniture",
  "clothing",
  "fashion",
  "kids",
  "sport",
  "goods",
  "hobby",
  "parts",
  "animals",
])

const RENT_CATEGORIES = new Set(["real-estate"])

function categoryLabel(slug: string | null | undefined): string {
  if (!slug) return "Объявления"
  const cat = MARKETPLACE_CATEGORIES.find((c) => c.slug === slug)
  return cat?.title ?? slug
}

export function buildListingSeoTitle(input: {
  title: string
  price: number
  city?: string | null
  categorySlug?: string | null
}): string {
  const cat = input.categorySlug ?? ""
  let prefix = ""
  if (BUY_CATEGORIES.has(cat)) prefix = "Купить "
  else if (RENT_CATEGORIES.has(cat)) prefix = "Аренда "

  const pricePart =
    input.price === 0
      ? ""
      : ` — ${input.price.toLocaleString("ru-RU")} ₽`

  const cityPart = input.city ? `, ${input.city}` : ""

  return `${prefix}${input.title}${pricePart}${cityPart} | Нашло`
}

export function buildListingSeoDescription(input: {
  description?: string | null
  categorySlug?: string | null
  city?: string | null
}): string {
  const excerpt = (input.description || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120)

  const catLabel = categoryLabel(input.categorySlug)
  const city = (input.city || "").trim()

  const tail = [
    catLabel ? `Категория: ${catLabel}.` : null,
    city ? `Город: ${city}.` : null,
    "Объявление на Нашло.",
  ]
    .filter(Boolean)
    .join(" ")

  const body = excerpt || "Подробности, фото и контакты продавца на Нашло."
  const combined = `${body} ${tail}`.trim()
  return combined.length > 160 ? `${combined.slice(0, 157)}…` : combined
}

export function getListingSeoFlags(listing: {
  id: string
  slug?: string | null
  title: string
  description?: string | null
  price: number
  city?: string | null
  status: string
  categoryId?: string | null
  categorySlug?: string | null
  attributes?: Record<string, unknown> | null
  noindex?: boolean | null
}) {
  const path = getListingPublicPath(listing)
  const indexable = isListingIndexable(listing)
  return {
    path,
    indexable,
    title: buildListingSeoTitle(listing),
    description: buildListingSeoDescription(listing),
  }
}
