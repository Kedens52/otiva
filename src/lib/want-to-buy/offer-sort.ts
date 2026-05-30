import type { Prisma } from "@prisma/client"

export type WantToBuyOfferSortKey = "price_desc" | "price_asc" | "newest" | "oldest"

export const WANT_TO_BUY_OFFER_SORT_OPTIONS: Array<{
  value: WantToBuyOfferSortKey
  label: string
  hint?: string
}> = [
  {
    value: "price_desc",
    label: "Дороже",
    hint: "Кто предлагает больше — сверху",
  },
  {
    value: "price_asc",
    label: "Дешевле",
    hint: "Минимальная цена — сверху",
  },
  { value: "newest", label: "Сначала новые" },
  { value: "oldest", label: "Сначала старые" },
]

const VALID = new Set<string>(WANT_TO_BUY_OFFER_SORT_OPTIONS.map((o) => o.value))

export function parseWantToBuyOfferSort(raw: string | null | undefined): WantToBuyOfferSortKey {
  if (raw && VALID.has(raw)) return raw as WantToBuyOfferSortKey
  return "price_desc"
}

export function wantToBuyOfferOrderBy(
  sort: WantToBuyOfferSortKey,
): Prisma.WantToBuyOfferOrderByWithRelationInput[] {
  switch (sort) {
    case "price_desc":
      return [{ price: "desc" }, { createdAt: "desc" }, { id: "desc" }]
    case "price_asc":
      return [{ price: "asc" }, { createdAt: "desc" }, { id: "desc" }]
    case "oldest":
      return [{ createdAt: "asc" }, { id: "asc" }]
    case "newest":
    default:
      return [{ createdAt: "desc" }, { id: "desc" }]
  }
}

export function getTopOfferPrice<T extends { price: number }>(items: T[]): number | null {
  if (!items.length) return null
  return Math.max(...items.map((o) => o.price))
}
