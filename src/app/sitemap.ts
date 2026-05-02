import { MetadataRoute } from "next"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"
export const revalidate = 3600 // обновлять раз в час

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://nashlo.ru"

  // Статические страницы
  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/create`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ]

  // Категории
  const categories = await prisma.category.findMany({
    select: { slug: true },
  }).catch(() => [])

  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${base}/?category=${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }))

  // Объявления
  const listings = await prisma.listing.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 10000,
  }).catch(() => [])

  const listingPages: MetadataRoute.Sitemap = listings.map((listing) => ({
    url: `${base}/listings/${listing.id}`,
    lastModified: listing.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }))

  return [...staticPages, ...categoryPages, ...listingPages]
}
