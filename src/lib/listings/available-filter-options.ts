import type { PrismaClient } from "@prisma/client"
import { omitListingSearchParams } from "@/lib/listings/filters"
import { buildListingWhereForPublicSearch } from "@/lib/listings/listing-public-where"

const MAX_OPTIONS = 60
const SAMPLE = 4000

function uniqSorted(values: string[], cap = MAX_OPTIONS): string[] {
  const s = [...new Set(values.map((v) => v.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "ru"),
  )
  return s.slice(0, cap)
}

function readAttr(attributes: unknown, key: string): string {
  if (!attributes || typeof attributes !== "object") return ""
  const v = (attributes as Record<string, unknown>)[key]
  return v == null ? "" : String(v).trim()
}

/**
 * Доступные значения фильтров с учётом текущих параметров, кроме соответствующего facet.
 * Ограничение: для JSON-полей — выборка до SAMPLE объявлений (достаточно для типичной витрины).
 */
export async function fetchAvailableFilterOptions(
  prisma: PrismaClient,
  baseSp: URLSearchParams,
  categoryId: string | null,
  categorySlug: string | null,
): Promise<Record<string, string[]>> {
  const out: Record<string, string[]> = {}

  const citiesCtx = await buildListingWhereForPublicSearch(
    prisma,
    omitListingSearchParams(baseSp, ["city"]),
    { skipTextSearch: true },
  )
  if (!citiesCtx.empty) {
    const rows = await prisma.listing.groupBy({
      by: ["city"],
      where: { ...citiesCtx.where, city: { not: null } },
      orderBy: { city: "asc" },
      take: MAX_OPTIONS,
    })
    out.cities = rows.map((r) => r.city!).filter(Boolean)
  }

  const subCtx = await buildListingWhereForPublicSearch(
    prisma,
    omitListingSearchParams(baseSp, ["subcategory"]),
    { skipTextSearch: true },
  )
  if (!subCtx.empty && categoryId) {
    const rows = await prisma.listing.findMany({
      where: subCtx.where,
      select: { attributes: true },
      take: SAMPLE,
    })
    out.subcategories = uniqSorted(rows.map((r) => readAttr(r.attributes, "subcategory")))
  }

  if (categorySlug === "cars" && categoryId) {
    const makeCtx = await buildListingWhereForPublicSearch(
      prisma,
      omitListingSearchParams(baseSp, ["make", "carBrand"]),
      { skipTextSearch: true },
    )
    if (!makeCtx.empty) {
      const rows = await prisma.listing.findMany({
        where: makeCtx.where,
        select: { attributes: true },
        take: SAMPLE,
      })
      out.makes = uniqSorted(rows.map((r) => readAttr(r.attributes, "make")))
    }

    const modelCtx = await buildListingWhereForPublicSearch(
      prisma,
      omitListingSearchParams(baseSp, ["model", "carModel"]),
      { skipTextSearch: true },
    )
    if (!modelCtx.empty) {
      const rows = await prisma.listing.findMany({
        where: modelCtx.where,
        select: { attributes: true },
        take: SAMPLE,
      })
      out.models = uniqSorted(rows.map((r) => readAttr(r.attributes, "model")))
    }
  }

  return out
}
