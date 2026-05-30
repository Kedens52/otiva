import type { Prisma } from "@prisma/client"

export type ListingsSortKey =
  | "default"
  | "popular"
  | "price_asc"
  | "price_desc"
  | "newest"
  | "new"
  | "nearby"
  | "promoted_first"
  | "promoted"
  | "relevance"
  | "views_desc"
  | "createdAt"
  | "price"
  | "uniqueViews"

/**
 * Сортировка на стороне БД. Для relevance при наличии q дополнительно применяется лёгкий пересчёт на странице в route.
 */
export function buildListingOrderBy(
  sortBy: string,
  sortOrder: "asc" | "desc",
): Prisma.ListingOrderByWithRelationInput[] {
  if (sortBy === "popular" || sortBy === "views_desc") {
    return [{ uniqueViews: "desc" }, { favorites: { _count: "desc" } }, { createdAt: "desc" }]
  }
  if (sortBy === "price_asc") {
    return [{ price: "asc" }, { createdAt: "desc" }]
  }
  if (sortBy === "price_desc") {
    return [{ price: "desc" }, { createdAt: "desc" }]
  }
  if (sortBy === "newest" || sortBy === "new") {
    return [{ createdAt: "desc" }]
  }
  if (sortBy === "nearby") {
    return [{ createdAt: "desc" }]
  }
  if (sortBy === "promoted_first" || sortBy === "promoted") {
    return [{ isPromoted: "desc" }, { uniqueViews: "desc" }, { createdAt: "desc" }]
  }
  if (sortBy === "relevance") {
    return [{ isPromoted: "desc" }, { createdAt: "desc" }]
  }
  const valid = ["createdAt", "price", "views", "uniqueViews"] as const
  if (valid.includes(sortBy as (typeof valid)[number])) {
    return [{ [sortBy]: sortOrder }]
  }
  // default — промо + активность; trust-твик остаётся в route после выборки
  return [{ isPromoted: "desc" }, { uniqueViews: "desc" }, { createdAt: "desc" }]
}
