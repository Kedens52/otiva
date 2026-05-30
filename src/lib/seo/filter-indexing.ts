/**
 * Whitelist параметров, для которых допустима отдельная индексируемая страница.
 * Остальные комбинации фильтров → noindex + canonical на категорию.
 */

const INDEXABLE_QUERY_KEYS = new Set([
  "city",
  "district",
  "q",
  "brand",
  "model",
  "price_min",
  "price_max",
  "priceMin",
  "priceMax",
  "subcategory",
])

/** Популярные бренды/модели (пример расширения whitelist). */
const INDEXABLE_BRAND_VALUES = new Set([
  "apple",
  "samsung",
  "xiaomi",
  "toyota",
  "bmw",
  "mercedes",
  "audi",
  "lada",
])

export type FilterIndexingDecision = {
  indexable: boolean
  canonicalPath: string
  noindex: boolean
}

export function getFilterIndexingDecision(input: {
  categoryCanonicalPath: string
  searchParams: Record<string, string | string[] | undefined>
}): FilterIndexingDecision {
  const IGNORED_KEYS = new Set(["sort", "page", "view", "layout"])
  const entries = Object.entries(input.searchParams).filter(
    ([k, v]) => v != null && v !== "" && !IGNORED_KEYS.has(k),
  )
  if (!entries.length) {
    return {
      indexable: true,
      canonicalPath: input.categoryCanonicalPath,
      noindex: false,
    }
  }

  const keys = entries.map(([k]) => k)
  const onlyWhitelistedKeys = keys.every((k) => INDEXABLE_QUERY_KEYS.has(k))
  const hasOnlyCity = keys.length === 1 && keys[0] === "city"
  const brand = String(input.searchParams.brand ?? "").toLowerCase()
  const hasIndexableBrand = brand ? INDEXABLE_BRAND_VALUES.has(brand) : false

  const indexable =
    hasOnlyCity ||
    (onlyWhitelistedKeys && keys.length <= 2 && (hasIndexableBrand || keys.includes("subcategory")))

  return {
    indexable,
    canonicalPath: indexable ? `${input.categoryCanonicalPath}${buildQuerySuffix(input.searchParams)}` : input.categoryCanonicalPath,
    noindex: !indexable,
  }
}

function buildQuerySuffix(params: Record<string, string | string[] | undefined>) {
  const sp = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === "") continue
    if (Array.isArray(value)) value.forEach((v) => sp.append(key, v))
    else sp.set(key, value)
  }
  const qs = sp.toString()
  return qs ? `?${qs}` : ""
}
