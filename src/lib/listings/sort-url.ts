export type UiSortKey = "default" | "popular" | "newest" | "price_asc" | "price_desc"

const UI_SORT_VALUES = new Set<UiSortKey>([
  "default",
  "popular",
  "newest",
  "price_asc",
  "price_desc",
])

const SORT_TO_API: Record<UiSortKey, { by: string; order: "asc" | "desc" }> = {
  /** Серверный fair-ranking (промо, качество, доверие) — не путать с «Сначала новые». */
  default: { by: "default", order: "desc" },
  popular: { by: "popular", order: "desc" },
  newest: { by: "createdAt", order: "desc" },
  price_asc: { by: "price", order: "asc" },
  price_desc: { by: "price", order: "desc" },
}

export function parseUiSortFromSearchParams(
  params: URLSearchParams,
  fallback: UiSortKey = "newest",
): UiSortKey {
  const rawSort = params.get("sort")?.trim()
  if (rawSort && UI_SORT_VALUES.has(rawSort as UiSortKey)) {
    return rawSort as UiSortKey
  }

  const sortBy = params.get("sortBy")?.trim()
  const sortOrder = params.get("sortOrder") ?? "desc"

  if (sortBy === "price" && sortOrder === "asc") return "price_asc"
  if (sortBy === "price" && sortOrder === "desc") return "price_desc"
  if (sortBy === "popular") return "popular"
  if (sortBy === "createdAt") return "newest"
  if (sortBy === "default") return "default"

  return fallback
}

export function uiSortToApiParams(sort: UiSortKey): { sortBy: string; sortOrder: "asc" | "desc" } {
  const mapped = SORT_TO_API[sort]
  return { sortBy: mapped.by, sortOrder: mapped.order }
}
