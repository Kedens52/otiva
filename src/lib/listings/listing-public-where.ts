import type { Prisma, PrismaClient } from "@prisma/client"
import {
  filterListingIdsByNumericAttributes,
  hasNumericAttributeFilters,
} from "@/lib/listing-attribute-filters"
import {
  normalizeListingsSearchParams,
  buildListingFilterWhere,
} from "@/lib/listings/filters"
import { fetchListingIdsMatchingSearch } from "@/lib/listings/search"

export type BuildListingWhereOptions = {
  /**
   * Не сужать по текстовому q (для facet-списков: меньше нагрузка, опции по рынку категории,
   * а не только по текущей поисковой выдаче).
   */
  skipTextSearch?: boolean
}

/**
 * Собирает Prisma where для публичной выдачи (как GET /api/listings).
 * `empty: true` — дальнейшие запросы дадут 0 строк (поиск без совпадений и т.п.).
 */
export async function buildListingWhereForPublicSearch(
  prisma: PrismaClient,
  sp: URLSearchParams,
  options?: BuildListingWhereOptions,
): Promise<{
  where: Prisma.ListingWhereInput
  empty: boolean
  categoryRow: { id: string } | null
  categorySlug: string | null
  normalizedSp: URLSearchParams
}> {
  const normalizedSp = normalizeListingsSearchParams(sp)
  const categorySlug = normalizedSp.get("category")
  const categoryRow = categorySlug
    ? await prisma.category.findUnique({
        where: { slug: categorySlug },
        select: { id: true },
      })
    : null

  let where: Prisma.ListingWhereInput = buildListingFilterWhere(
    normalizedSp,
    categoryRow?.id ?? null,
    categorySlug,
  )

  if (categorySlug && !categoryRow) {
    where = { AND: [where, { category: { slug: categorySlug } }] }
  }

  if (!options?.skipTextSearch) {
    const searchText = [normalizedSp.get("q"), normalizedSp.get("address")]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(" ")
    const searchIds = await fetchListingIdsMatchingSearch(prisma, searchText, {
      categoryId: categoryRow?.id ?? null,
      categorySlug: categoryRow ? null : categorySlug,
    })
    if (searchIds !== null && searchIds.length === 0) {
      return {
        where: { id: { in: [] } },
        empty: true,
        categoryRow,
        categorySlug,
        normalizedSp,
      }
    }
    if (searchIds !== null) {
      where = { AND: [where, { id: { in: searchIds } }] }
    }
  }

  if (hasNumericAttributeFilters(normalizedSp, categorySlug)) {
    try {
      const numericIds = await filterListingIdsByNumericAttributes(
        prisma,
        normalizedSp,
        categoryRow?.id,
        categorySlug,
      )
      if (numericIds !== null) {
        if (numericIds.length === 0) {
          return {
            where: { id: { in: [] } },
            empty: true,
            categoryRow,
            categorySlug,
            normalizedSp,
          }
        }
        where = { AND: [where, { id: { in: numericIds } }] }
      }
    } catch {
      // оставляем where без числового сужения
    }
  }

  return { where, empty: false, categoryRow, categorySlug, normalizedSp }
}
