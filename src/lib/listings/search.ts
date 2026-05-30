import { Prisma, type PrismaClient } from "@prisma/client"
import {
  ilikePattern,
  tokenizeSearchQuery,
  tokenizeSearchQueryGroups,
} from "@/lib/search/search-query"
import { expandMarketplaceSearchTokenGroups } from "@/lib/listings/search-aliases"

/**
 * Возвращает id объявлений, для которых каждое слово запроса встречается
 * хотя бы в одном из полей: title, description, city, district, location,
 * category и JSON-атрибуты объявления, включая nested details внутри attributes.
 */
export async function fetchListingIdsMatchingSearch(
  prisma: PrismaClient,
  q: string | null | undefined,
  opts: { categoryId?: string | null; categorySlug?: string | null },
): Promise<string[] | null> {
  const baseTokenGroups = tokenizeSearchQueryGroups(q ?? undefined)
  const tokenGroups = expandMarketplaceSearchTokenGroups(baseTokenGroups)
  if (tokenGroups.length === 0) return null

  const wordClauses = tokenGroups.map((group) => {
    const variantClauses = group.map((word) => {
      const p = ilikePattern(word)
      return Prisma.sql`(
        l.title ILIKE ${p}
        OR l.description ILIKE ${p}
        OR COALESCE(l.city, '') ILIKE ${p}
        OR COALESCE(l.district, '') ILIKE ${p}
        OR COALESCE(l.location, '') ILIKE ${p}
        OR COALESCE(l.attributes::text, '') ILIKE ${p}
        OR EXISTS (
          SELECT 1 FROM "Category" c
          WHERE c.id = l."categoryId"
          AND (
            c."nameRu" ILIKE ${p}
            OR c.name ILIKE ${p}
            OR c.slug ILIKE ${p}
          )
        )
      )`
    })
    return Prisma.sql`(${Prisma.join(variantClauses, " OR ")})`
  })

  const combinedWords = Prisma.join(wordClauses, " AND ")
  const cat =
    opts.categoryId != null && opts.categoryId !== ""
      ? Prisma.sql`AND l."categoryId" = ${opts.categoryId}`
      : opts.categorySlug != null && opts.categorySlug !== ""
        ? Prisma.sql`AND EXISTS (SELECT 1 FROM "Category" c2 WHERE c2.id = l."categoryId" AND c2.slug = ${opts.categorySlug})`
        : Prisma.empty

  const rows = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT l.id
    FROM "Listing" l
    WHERE l.status = 'ACTIVE'
    ${cat}
    AND (${combinedWords})
    LIMIT 8000
  `)

  return rows.map((r) => r.id)
}

type WithListingText = {
  title: string
  description: string
  city?: string | null
  district?: string | null
  location?: string | null
  attributes?: unknown
  category?: { nameRu?: string; name?: string; slug?: string } | string
}

/** Лёгкая релевантность внутри текущей страницы (после SQL-пагинации). */
export function sortListingsByRelevancePage<T extends WithListingText>(items: T[], q: string | null | undefined): T[] {
  const tokenGroups = expandMarketplaceSearchTokenGroups(tokenizeSearchQueryGroups(q ?? undefined))
  const plainTokens = tokenizeSearchQuery(q ?? undefined)
  if (tokenGroups.length === 0) return items
  const exactQuery = plainTokens.join(" ").trim()

  const score = (item: T) => {
    let s = 0
    const t = item.title.toLowerCase()
    const d = (item.description || "").toLowerCase()
    const city = (item.city || "").toLowerCase()
    const district = (item.district || "").toLowerCase()
    const location = (item.location || "").toLowerCase()
    const attrs = JSON.stringify(item.attributes ?? "").toLowerCase()
    let catBlob = ""
    if (item.category && typeof item.category === "object") {
      catBlob = `${item.category.nameRu ?? ""} ${item.category.name ?? ""} ${item.category.slug ?? ""}`.toLowerCase()
    }

    if (exactQuery) {
      if (t.includes(exactQuery)) s += 180
      if (d.includes(exactQuery)) s += 70
    }

    for (const group of tokenGroups) {
      if (group.some((token) => t.includes(token))) s += 120
      else if (group.some((token) => catBlob.includes(token))) s += 78
      else if (group.some((token) => city.includes(token))) s += 72
      else if (group.some((token) => district.includes(token))) s += 64
      else if (group.some((token) => attrs.includes(token))) s += 56
      else if (group.some((token) => location.includes(token))) s += 44
      else if (group.some((token) => d.includes(token))) s += 30
    }
    return s
  }

  const stable = new Map(items.map((it, i) => [it, i]))
  return [...items].sort((a, b) => {
    const diff = score(b) - score(a)
    if (diff !== 0) return diff
    return (stable.get(a) ?? 0) - (stable.get(b) ?? 0)
  })
}
