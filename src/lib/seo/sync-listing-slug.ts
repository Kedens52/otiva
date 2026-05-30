import { prisma } from "@/lib/prisma"
import { createListingSlug, ensureUniqueListingSlug } from "@/lib/seo/slug"

export async function syncListingSlug(listingId: string) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, title: true, city: true, slug: true },
  })
  if (!listing) return null

  const base = createListingSlug(listing.title, listing.city, listing.id)
  const slug = await ensureUniqueListingSlug(base, async (candidate) => {
    const row = await prisma.listing.findUnique({
      where: { slug: candidate },
      select: { id: true },
    })
    return Boolean(row && row.id !== listing.id)
  })

  if (listing.slug !== slug) {
    await prisma.listing.update({
      where: { id: listing.id },
      data: { slug },
    })
  }

  return slug
}

export async function syncSellerPublicSlug(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, publicSlug: true },
  })
  if (!user) return null

  const { createSellerSlug } = await import("@/lib/seo/slug")
  const base = createSellerSlug(user.name || "seller", user.id)
  const publicSlug =
    user.publicSlug && user.publicSlug.endsWith(user.id)
      ? user.publicSlug
      : await ensureUniqueListingSlug(base, async (candidate) => {
          const row = await prisma.user.findUnique({
            where: { publicSlug: candidate },
            select: { id: true },
          })
          return Boolean(row && row.id !== user.id)
        })

  if (user.publicSlug !== publicSlug) {
    await prisma.user.update({
      where: { id: user.id },
      data: { publicSlug },
    })
  }

  return publicSlug
}
