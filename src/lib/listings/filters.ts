import type { Prisma } from "@prisma/client"
import { prismaAttributeConditions } from "@/lib/listing-attribute-filters"
import { getAllowedListingSearchParamKeys } from "@/lib/filters"

export { normalizeListingsSearchParams } from "@/lib/filters"

const META_KEYS_SKIP_ATTRIBUTES = new Set([
  "q",
  "page",
  "pageSize",
  "limit",
  "category",
  "cat",
  "sort",
  "sortBy",
  "sortOrder",
  "lat",
  "lng",
  "nearLat",
  "nearLng",
  "query",
])

/** Клон URLSearchParams без указанных ключей (для facet-опций фильтров). */
export function omitListingSearchParams(sp: URLSearchParams, keys: string[]): URLSearchParams {
  const n = new URLSearchParams(sp.toString())
  for (const k of keys) n.delete(k)
  return n
}

export function parseSafeInt(raw: string | null | undefined): number | undefined {
  if (raw == null || raw === "") return undefined
  const n = Number.parseInt(String(raw), 10)
  return Number.isFinite(n) ? n : undefined
}

function dateRangeToCreatedAtGte(dateRange: string | null): Date | undefined {
  if (!dateRange) return undefined
  const now = Date.now()
  const day = 86400000
  const map: Record<string, number> = {
    "1d": day,
    "3d": 3 * day,
    "7d": 7 * day,
    "30d": 30 * day,
    today: day,
    week: 7 * day,
    month: 30 * day,
  }
  const ms = map[dateRange]
  if (!ms) return undefined
  return new Date(now - ms)
}

/**
 * Собирает Prisma where для списка объявлений (без сужения по id текстового поиска — его добавляет route).
 */
export function buildListingFilterWhere(
  sp: URLSearchParams,
  categoryId: string | null,
  categorySlug: string | null,
): Prisma.ListingWhereInput {
  const parts: Prisma.ListingWhereInput[] = [{ status: "ACTIVE" }]

  if (categoryId) {
    parts.push({ categoryId })
  }

  const city = sp.get("city")?.trim()
  if (city && city !== "Везде") {
    parts.push({ city: { equals: city, mode: "insensitive" } })
  }

  const district = sp.get("district")?.trim()
  if (district) {
    parts.push({ district: { contains: district, mode: "insensitive" } })
  }

  const address = sp.get("address")?.trim()
  if (address) {
    parts.push({
      OR: [
        { location: { contains: address, mode: "insensitive" } },
        { district: { contains: address, mode: "insensitive" } },
        { description: { contains: address, mode: "insensitive" } },
        { title: { contains: address, mode: "insensitive" } },
      ],
    })
  }

  const pMin = parseSafeInt(sp.get("priceMin"))
  const pMax = parseSafeInt(sp.get("priceMax"))
  if (pMin !== undefined || pMax !== undefined) {
    const price: Prisma.IntFilter = {}
    if (pMin !== undefined) price.gte = pMin
    if (pMax !== undefined) price.lte = pMax
    parts.push({ price })
  }

  const dr = sp.get("dateRange")
  const from = dateRangeToCreatedAtGte(dr)
  if (from) parts.push({ createdAt: { gte: from } })

  const allowedKeys = getAllowedListingSearchParamKeys(categorySlug)
  const st = sp.get("seller_type")
  if (allowedKeys.has("seller_type") && st) {
    if (st === "private" || st === "person") {
      parts.push({
        OR: [
          { seller: { profileType: "PERSON" } },
          { attributes: { path: ["seller_type"], equals: st } },
        ],
      })
    } else if (st === "business" || st === "shop" || st === "company" || st === "agency") {
      parts.push({
        OR: [
          { seller: { profileType: "COMPANY" } },
          { attributes: { path: ["seller_type"], equals: st } },
        ],
      })
    } else {
      parts.push({ attributes: { path: ["seller_type"], equals: st } })
    }
  }

  const attrParts = prismaAttributeConditions(sp, categorySlug)
  if (attrParts.length) parts.push(...attrParts)

  if (parts.length === 1) return parts[0]!
  return { AND: parts }
}

export function collectAppliedFilters(sp: URLSearchParams): Record<string, string> {
  const resolvedSlug = sp.get("category")?.trim() || null
  const allowed = getAllowedListingSearchParamKeys(resolvedSlug)
  const applied: Record<string, string> = {}
  for (const [k, v] of Array.from(sp.entries())) {
    if (!v || META_KEYS_SKIP_ATTRIBUTES.has(k)) continue
    if (["page", "pageSize"].includes(k)) continue
    if (!allowed.has(k)) continue
    applied[k] = v
  }
  if (sp.get("q")) applied.q = sp.get("q")!
  if (sp.get("category")) applied.category = sp.get("category")!
  if (sp.get("dateRange")) applied.dateRange = sp.get("dateRange")!
  return applied
}
