import type { Prisma, PrismaClient } from "@prisma/client"
import { isListingCuid, parseListingIdFromSlug } from "@/lib/seo/slug"

function normalizeRouteParam(param: string): string {
  const raw = decodeURIComponent(param).trim()
  return raw.replace(/^\/listings\//i, "").replace(/^\/+/, "")
}

/**
 * Находит объявление по сегменту URL: cuid, slug из БД или ЧПУ с суффиксом id.
 */
export async function findListingByRouteParam(
  prisma: PrismaClient,
  param: string,
  include?: Prisma.ListingInclude,
) {
  const raw = normalizeRouteParam(param)
  if (!raw) return null

  if (isListingCuid(raw)) {
    return prisma.listing.findUnique({ where: { id: raw }, include })
  }

  const parsedId = parseListingIdFromSlug(raw)
  if (parsedId !== raw && isListingCuid(parsedId)) {
    const byId = await prisma.listing.findUnique({ where: { id: parsedId }, include })
    if (byId) return byId
  }

  try {
    const bySlug = await prisma.listing.findUnique({
      where: { slug: raw },
      include,
    })
    if (bySlug) return bySlug
  } catch (error) {
    console.warn("[listing] slug lookup skipped:", (error as Error).message)
  }

  if (isListingCuid(parsedId)) {
    return prisma.listing.findUnique({ where: { id: parsedId }, include })
  }

  return null
}
