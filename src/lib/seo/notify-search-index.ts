import { prisma } from "@/lib/prisma"
import { isListingIndexable } from "@/lib/seo/listing-indexability"
import { submitIndexNowUrls } from "@/lib/seo/indexnow"
import { getListingPublicPath } from "@/lib/seo/paths"
import { getPublicSiteOrigin } from "@/lib/seo/site"
import { syncListingSlug } from "@/lib/seo/sync-listing-slug"

/** Фоновая отправка IndexNow после публикации объявления. */
export async function notifyListingSearchIndex(listingId: string): Promise<void> {
  try {
    await syncListingSlug(listingId).catch(() => {})

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        slug: true,
        status: true,
        title: true,
        city: true,
        description: true,
        attributes: true,
        noindex: true,
        categoryId: true,
        category: { select: { slug: true } },
      },
    })
    if (!listing) return

    const indexable = isListingIndexable({
      status: listing.status,
      title: listing.title,
      categoryId: listing.categoryId,
      categorySlug: listing.category.slug,
      city: listing.city,
      description: listing.description,
      attributes: listing.attributes as Record<string, unknown> | null,
      noindex: listing.noindex,
    })
    if (!indexable) return

    const path = getListingPublicPath({
      id: listing.id,
      slug: listing.slug,
      title: listing.title,
      city: listing.city,
    })
    await submitIndexNowUrls([`${getPublicSiteOrigin()}${path}`])
  } catch (error) {
    console.warn("[indexnow] listing notify failed:", error)
  }
}
