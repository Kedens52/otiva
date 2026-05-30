import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import {
  MARKET_PRICE_CONFIG,
  resolveMarketPriceGroup,
  type MarketPriceGroupConfig,
} from "@/lib/market-price/marketPriceConfig"
import type { MarketPriceEstimateInput } from "@/lib/market-price/types"

type ComparableRow = {
  id: string
  price: number
  attributes: unknown
  city: string | null
}

function readAttr(attributes: unknown, key: string): string {
  if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) return ""
  const v = (attributes as Record<string, unknown>)[key]
  if (v == null) return ""
  return String(v).trim().toLowerCase()
}

function attrsMatch(
  candidate: unknown,
  input: Record<string, unknown>,
  keys: string[],
): boolean {
  for (const key of keys) {
    const expected = readAttr(input, key)
    if (!expected) continue
    const actual = readAttr(candidate, key)
    if (!actual || actual !== expected) return false
  }
  return true
}

async function fetchCandidates(
  categoryId: string,
  city: string | undefined,
  excludeListingId: string | undefined,
  take = 250,
): Promise<ComparableRow[]> {
  const where: Prisma.ListingWhereInput = {
    status: "ACTIVE",
    price: { gt: 0 },
    categoryId,
    ...(excludeListingId ? { id: { not: excludeListingId } } : {}),
    ...(city
      ? { city: { equals: city, mode: "insensitive" } }
      : {}),
  }

  return prisma.listing.findMany({
    where,
    select: { id: true, price: true, attributes: true, city: true },
    orderBy: { createdAt: "desc" },
    take,
  })
}

function filterByAttributes(
  rows: ComparableRow[],
  inputAttrs: Record<string, unknown>,
  config: MarketPriceGroupConfig,
  subcategory?: string,
): ComparableRow[] {
  let filtered = rows
  if (subcategory) {
    const sub = subcategory.toLowerCase()
    filtered = filtered.filter((r) => readAttr(r.attributes, "subcategory") === sub)
  }
  const strict = filtered.filter((r) => attrsMatch(r.attributes, inputAttrs, config.matchKeys))
  return strict.length >= 3 ? strict : filtered
}

type SearchLevel = {
  label: string
  city?: string
  useSubcategory: boolean
  useMatchKeys: boolean
}

export async function findComparableListings(
  input: MarketPriceEstimateInput,
  categoryId: string,
): Promise<ComparableRow[]> {
  const group = resolveMarketPriceGroup(input.categorySlug)
  const config = MARKET_PRICE_CONFIG[group]
  const inputAttrs = { ...(input.attributes ?? {}) }
  if (input.subcategory) inputAttrs.subcategory = input.subcategory

  const levels: SearchLevel[] = [
    { label: "subcategory+city", city: input.city, useSubcategory: true, useMatchKeys: true },
    { label: "subcategory", useSubcategory: true, useMatchKeys: true },
    { label: "category+city", city: input.city, useSubcategory: false, useMatchKeys: false },
    { label: "category", useSubcategory: false, useMatchKeys: false },
  ]

  for (const level of levels) {
    const raw = await fetchCandidates(categoryId, level.city, input.excludeListingId)
    let rows = raw
    if (level.useSubcategory) {
      rows = filterByAttributes(rows, inputAttrs, config, input.subcategory)
    } else if (level.useMatchKeys) {
      rows = rows.filter((r) => attrsMatch(r.attributes, inputAttrs, config.matchKeys))
    }
    if (rows.length >= config.minSampleSize) return rows
  }

  const fallback = await fetchCandidates(categoryId, undefined, input.excludeListingId, 120)
  return fallback
}
