import {
  DATE_RANGE_FILTER_FIELD as MARKETPLACE_DATE_RANGE_FILTER_FIELD,
  GENERAL_FILTERS as MARKETPLACE_GENERAL_FILTERS,
  MARKETPLACE_CATEGORIES,
  MARKETPLACE_FILTER_CONFIGS,
  MARKETPLACE_GEO_FILTER_FIELDS,
  getCategoryConfig,
  type CategoryFilterConfig,
  type FilterField,
  type FilterOption,
} from "@/config/marketplace-categories"

export type { CategoryFilterConfig, FilterField, FilterOption }

export const CATEGORY_FILTERS: Record<string, CategoryFilterConfig> = MARKETPLACE_FILTER_CONFIGS
export const DATE_RANGE_FILTER_FIELD = MARKETPLACE_DATE_RANGE_FILTER_FIELD
export const GENERAL_FILTERS = MARKETPLACE_GENERAL_FILTERS

export const LISTING_CATEGORY_SLUGS = new Set(MARKETPLACE_CATEGORIES.map((category) => category.slug))
export const LISTING_SLUGS = MARKETPLACE_CATEGORIES.map((category) => category.slug)

export function filterFieldsForCategory(slug: string | null): FilterField[] {
  const categoryFields = slug && CATEGORY_FILTERS[slug] ? CATEGORY_FILTERS[slug].fields : []
  const withGeo = [...MARKETPLACE_GEO_FILTER_FIELDS]
  for (const field of categoryFields) {
    if (!withGeo.some((geoField) => geoField.key === field.key)) {
      withGeo.push(field)
    }
  }
  const base = slug && CATEGORY_FILTERS[slug] ? withGeo : GENERAL_FILTERS
  if (base.some((field) => field.key === "dateRange")) return base
  return [DATE_RANGE_FILTER_FIELD, ...base]
}

export function labelForFilterField(slug: string | null, key: string): string {
  const hit = filterFieldsForCategory(slug).find((f) => f.key === key)
  if (hit) return hit.label
  const map: Record<string, string> = {
    q: "Поиск",
    priceMin: "Цена от",
    priceMax: "Цена до",
    city: "Город",
    district: "Район",
    address: "Адрес",
    radius: "Радиус поиска",
    with_photos: "С фото",
    category: "Категория",
    animal_type: "Вид животного",
    animal_gender: "Пол",
    listing_type: "Тип объявления",
    seller_type: "Тип продавца",
    business_type: "Тип бизнеса",
  }
  return map[key] ?? key
}

/** Разворачивает ключи полей в query-ключи (range → `key_from` / `key_to`). */
export function expandFilterFieldsToUrlKeys(fields: FilterField[]): string[] {
  const keys: string[] = []
  for (const f of fields) {
    if (f.type === "range") {
      keys.push(`${f.key}_from`, `${f.key}_to`)
    } else {
      keys.push(f.key)
    }
  }
  return keys
}

export function getAllowedListingSearchParamKeys(categorySlug: string | null): Set<string> {
  const allowed = new Set<string>([
    "q",
    "query",
    "category",
    "cat",
    "priceMin",
    "priceMax",
    "sort",
    "sortBy",
    "sortOrder",
    "page",
    "pageSize",
    "limit",
    "lat",
    "lng",
    "nearLat",
    "nearLng",
    "dateRange",
  ])
  for (const k of expandFilterFieldsToUrlKeys(filterFieldsForCategory(categorySlug))) {
    allowed.add(k)
  }
  return allowed
}

const QUERY_ALIASES: Record<string, string> = {
  carBrand: "make",
  carModel: "model",
  hasPhoto: "with_photos",
  productBrand: "brand",
  nearLat: "lat",
  nearLng: "lng",
}

const ALLOWED_SORT_BY = new Set([
  "default",
  "popular",
  "price_asc",
  "price_desc",
  "newest",
  "new",
  "nearby",
  "promoted_first",
  "promoted",
  "relevance",
  "views_desc",
  "createdAt",
  "price",
  "views",
  "uniqueViews",
])

function collectAllowedSubcategoryValues(slug: string | null): Set<string> {
  const out = new Set<string>()
  if (!slug) return out
  for (const f of filterFieldsForCategory(slug)) {
    if (f.key !== "subcategory") continue
    if (f.type === "select" || f.type === "multi") {
      for (const o of f.options) out.add(o.value)
    }
  }
  const cfg = getCategoryConfig(slug)
  for (const sub of cfg?.subcategories ?? []) {
    const p = sub.presetAttributes?.subcategory
    if (typeof p === "string" && p) out.add(p)
  }
  return out
}

function categoryHasSubcategoryField(slug: string | null): boolean {
  if (!slug) return false
  return filterFieldsForCategory(slug).some((f) => f.key === "subcategory")
}

/** Удаляет query-ключи вне политики категории (после применения QUERY_ALIASES в normalize). */
export function sanitizeListingSearchParams(sp: URLSearchParams): URLSearchParams {
  const n = new URLSearchParams(sp.toString())

  const categoryVal = n.get("category")?.trim() || null
  const catVal = n.get("cat")?.trim() || null
  let slug: string | null = null
  if (categoryVal && LISTING_CATEGORY_SLUGS.has(categoryVal)) {
    slug = categoryVal
  } else if (catVal && LISTING_CATEGORY_SLUGS.has(catVal)) {
    slug = catVal
    n.set("category", catVal)
  } else {
    if (categoryVal) n.delete("category")
    if (catVal) n.delete("cat")
    slug = null
  }

  if (slug) {
    n.set("category", slug)
  }

  // Старые ссылки (?subcategory=dogs и т.п.) — в объявлениях хранится animal_type
  if (slug === "animals") {
    const rawSub = n.get("subcategory")?.trim()
    if (rawSub) {
      const legacyToAnimalType: Record<string, string> = {
        dogs: "dogs",
        cats: "cats",
        birds: "birds",
        fish: "fish",
        rodents: "rodents",
        reptiles: "reptiles",
        farm: "farm",
        other: "other",
        supplies: "supplies",
        food: "supplies",
        vet: "services",
        services: "services",
        pets: "other",
      }
      const mapped = legacyToAnimalType[rawSub]
      if (mapped && !n.get("animal_type")?.trim()) n.set("animal_type", mapped)
    }
    n.delete("subcategory")
  }

  const subAllowed = collectAllowedSubcategoryValues(slug)
  const hasSubField = categoryHasSubcategoryField(slug)
  if (!hasSubField && subAllowed.size === 0) {
    n.delete("subcategory")
  } else if (subAllowed.size > 0) {
    const sv = n.get("subcategory")?.trim()
    if (sv) {
      const parts = sv.split(",").map((part) => part.trim()).filter(Boolean)
      const valid = parts.filter((part) => subAllowed.has(part))
      if (valid.length === 0) {
        n.delete("subcategory")
      } else if (valid.length === 1) {
        n.set("subcategory", valid[0])
      } else {
        n.set("subcategory", valid.join(","))
      }
    }
  } else if (hasSubField && subAllowed.size === 0) {
    n.delete("subcategory")
  }

  const allowed = getAllowedListingSearchParamKeys(slug)
  const allKeys = new Set<string>()
  for (const k of Array.from(n.keys())) allKeys.add(k)
  for (const key of Array.from(allKeys)) {
    if (!allowed.has(key)) n.delete(key)
  }

  const sortByRaw = n.get("sortBy")?.trim()
  if (sortByRaw && !ALLOWED_SORT_BY.has(sortByRaw)) {
    n.delete("sortBy")
    n.delete("sort")
    n.delete("sortOrder")
  }

  const c = n.get("category")?.trim()
  if (c) n.set("cat", c)
  else n.delete("cat")

  if (n.get("q")?.trim() && n.has("query")) n.delete("query")
  if (n.get("pageSize") && n.has("limit")) n.delete("limit")
  if (n.get("sortBy") && n.has("sort")) n.delete("sort")
  if (n.get("lat") && n.has("nearLat")) n.delete("nearLat")
  if (n.get("lng") && n.has("nearLng")) n.delete("nearLng")
  if (n.get("make") && n.has("carBrand")) n.delete("carBrand")
  if (n.get("model") && n.has("carModel")) n.delete("carModel")
  if (n.get("with_photos") && n.has("hasPhoto")) n.delete("hasPhoto")
  if (n.get("brand") && n.has("productBrand")) n.delete("productBrand")

  return n
}

export function normalizeListingsSearchParams(sp: URLSearchParams): URLSearchParams {
  const n = new URLSearchParams(sp.toString())
  for (const [alias, target] of Object.entries(QUERY_ALIASES)) {
    const v = n.get(alias)
    if (v != null && v !== "" && !n.has(target)) n.set(target, v)
  }
  if (n.get("hasPhoto") === "1" && !n.get("with_photos")) n.set("with_photos", "1")
  const lim = n.get("limit")
  if (lim && !n.get("pageSize")) n.set("pageSize", lim)
  const sort = n.get("sort")
  if (sort && !n.get("sortBy")) n.set("sortBy", sort)
  const legacyQ = n.get("query")?.trim()
  if (legacyQ && !n.get("q")?.trim()) n.set("q", legacyQ)
  return sanitizeListingSearchParams(n)
}

// ── Filter state type ─────────────────────────────────────────────────────────
export type FilterState = Record<string, string | string[]>

export function emptyFilters(): FilterState {
  return {}
}

export function hasActiveFilters(state: FilterState): boolean {
  return Object.values(state).some((v) => (Array.isArray(v) ? v.length > 0 : Boolean(v)))
}

/** Параметры маршрута / поиска, не относящиеся к фильтрам категории. */
const META_QUERY_KEYS = new Set([
  "q",
  "query",
  "cat",
  "priceMin",
  "priceMax",
  "sortBy",
  "sortOrder",
  "sort",
  "page",
  "pageSize",
  "limit",
  "lat",
  "lng",
  "category",
  "nearLat",
  "nearLng",
])

/** Разбор query-параметров страницы поиска в состояние фильтров (для гидрации из URL). */
export function parseFiltersFromSearchParams(params: URLSearchParams): FilterState {
  const normalized = normalizeListingsSearchParams(new URLSearchParams(params.toString()))
  const out: FilterState = {}
  for (const [key, value] of Array.from(normalized.entries())) {
    if (!value || META_QUERY_KEYS.has(key)) continue
    if (key === "rooms") {
      out[key] = value.split(",").filter(Boolean)
    } else {
      out[key] = value
    }
  }
  return out
}
