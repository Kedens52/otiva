import type { MetadataRoute } from "next"
import { prisma } from "@/lib/prisma"
import { SITE_URL } from "@/lib/seo/site"
import { SEO_CATEGORY_CONFIGS, toSeoSegment } from "@/lib/seo/categories"
import { getCategorySeoPath, getListingPublicPath, getSellerPublicPath, getWantToBuyPublicPath } from "@/lib/seo/paths"
import { getWantToBuyCategoriesPath, getWantToBuyCategoryPath, getWantToBuyHubPath, getWantToBuySearchPath } from "@/lib/want-to-buy/routes"
import { STATIC_WANT_TO_BUY_CATEGORIES } from "@/lib/want-to-buy/categories"
import { isWantToBuyIndexable } from "@/lib/seo/want-to-buy-indexability"
import { businessSitemapStaticPaths } from "@/lib/business/seo"
import { CITY_INDEX_THRESHOLD, getIndexedCityPagesForSitemap, getSeoCategoryListingCount } from "@/lib/seo/collections"
import { getIndexableSeoLandings } from "@/lib/seo/landings"
import { isListingIndexable } from "@/lib/seo/listing-indexability"
import { getAllProgrammaticSlugs } from "@/lib/seo/programmatic"
export function staticSitemapEntries(now = new Date()): MetadataRoute.Sitemap {
  const base = SITE_URL
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/categories`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}${getWantToBuyHubPath()}`, lastModified: now, changeFrequency: "daily", priority: 0.75 },
    { url: `${base}${getWantToBuyCategoriesPath()}`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}${getWantToBuySearchPath()}`, lastModified: now, changeFrequency: "daily", priority: 0.65 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/help`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/safety`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/advertising`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/legal`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/legal/user-agreement`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/legal/privacy-policy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/legal/personal-data-consent`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/legal/cookie-policy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    {
      url: `${base}/legal/recommendation-technologies`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    { url: `${base}/legal/listing-rules`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/legal/moderation`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/legal/reviews`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/legal/bonus-rules`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/legal/promotion-rules`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/legal/promotion-offer`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/legal/advertising-rules`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/legal/advertising-offer`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/legal/offer`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/legal/disclaimer`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/legal/safety`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/legal/requisites`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/legal/contacts`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/legal/dkp`, lastModified: now, changeFrequency: "monthly", priority: 0.2 },
    { url: `${base}/legal/business-terms`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    {
      url: `${base}/legal/business-listing-rules`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${base}/legal/business-advertising`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    { url: `${base}/sitemap`, lastModified: now, changeFrequency: "monthly", priority: 0.2 },
  ]
}

/** Корневые страницы категорий (/category/transport и т.д.) */
export async function categoryRootSitemapEntries(now = new Date()): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL
  return SEO_CATEGORY_CONFIGS.map((config) => ({
    url: `${base}${getCategorySeoPath(config.slug)}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: config.sitemapPriority ?? 0.85,
  }))
}

/** Подкатегории (/category/transport/passenger-cars и т.д.) */
export async function subcategorySitemapEntries(now = new Date()): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL
  const entries: MetadataRoute.Sitemap = []

  for (const config of SEO_CATEGORY_CONFIGS) {
    for (const child of config.children) {
      entries.push({
        url: `${base}${getCategorySeoPath(config.slug, child.slug)}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.7,
      })
    }
  }

  return entries
}

/** /category/{cat}/{city} — города внутри категории (≥5 объявлений) */
export async function citiesSitemapEntries(now = new Date()): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL
  const entries: MetadataRoute.Sitemap = []

  for (const config of SEO_CATEGORY_CONFIGS) {
    const cities = await getIndexedCityPagesForSitemap(config.slug)
    for (const city of cities) {
      entries.push({
        url: `${base}${getCategorySeoPath(config.slug, toSeoSegment(city.city))}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.65,
      })
    }
  }

  return entries
}

/** /category/{cat}/{child}/{city} — подкатегория + город */
export async function subcategoryCitySitemapEntries(now = new Date()): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL
  const entries: MetadataRoute.Sitemap = []

  for (const config of SEO_CATEGORY_CONFIGS) {
    for (const child of config.children) {
      const childCities = await getIndexedCityPagesForSitemap(config.slug)
      for (const city of childCities) {
        const count = await getSeoCategoryListingCount(
          child.internalCategorySlug ?? config.internalCategorySlug,
          child.filter ? { [child.filter.key]: child.filter.value } : undefined,
          city.city,
        )
        if (count >= CITY_INDEX_THRESHOLD) {
          entries.push({
            url: `${base}${getCategorySeoPath(config.slug, child.slug, toSeoSegment(city.city))}`,
            lastModified: now,
            changeFrequency: "weekly",
            priority: 0.6,
          })
        }
      }
    }
  }

  return entries
}

/** @deprecated Используйте citiesSitemapEntries и subcategoryCitySitemapEntries */
export async function categoryCitySitemapEntries(now = new Date()): Promise<MetadataRoute.Sitemap> {
  const [cities, subcategoryCities] = await Promise.all([
    citiesSitemapEntries(now),
    subcategoryCitySitemapEntries(now),
  ])
  return [...cities, ...subcategoryCities]
}

/** @deprecated Используйте отдельные sitemap-* файлы */
export async function categorySitemapEntries(now = new Date()): Promise<MetadataRoute.Sitemap> {
  const [root, sub, city] = await Promise.all([
    categoryRootSitemapEntries(now),
    subcategorySitemapEntries(now),
    categoryCitySitemapEntries(now),
  ])
  return [...root, ...sub, ...city]
}

export async function wantToBuyCategoryHubSitemapEntries(now = new Date()): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL
  let slugs: string[] = []

  try {
    const rows = await prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true },
      orderBy: [{ sortOrder: "asc" }, { nameRu: "asc" }],
    })
    slugs = rows.map((row) => row.slug)
  } catch {
    slugs = STATIC_WANT_TO_BUY_CATEGORIES.map((row) => row.slug)
  }

  return slugs.map((slug) => ({
    url: `${base}${getWantToBuyCategoryPath(slug)}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.68,
  }))
}

export async function wantToBuySitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const [hubs, items] = await Promise.all([
    wantToBuyCategoryHubSitemapEntries(now),
    wantToBuyDetailSitemapEntries(),
  ])
  return [...hubs, ...items]
}

async function wantToBuyDetailSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL
  try {
    const rows = await prisma.wantToBuy.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        status: true,
        updatedAt: true,
        category: { select: { slug: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 10_000,
    })
    return rows
      .filter((row) => isWantToBuyIndexable(row.status))
      .map((row) => ({
        url: `${base}${getWantToBuyPublicPath({
          id: row.id,
          categorySlug: row.category.slug,
        })}`,
        lastModified: row.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.65,
      }))
  } catch {
    return []
  }
}

export async function listingSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL
  try {
    const listings = await prisma.listing.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        slug: true,
        title: true,
        city: true,
        description: true,
        attributes: true,
        categoryId: true,
        updatedAt: true,
        category: { select: { slug: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 10000,
    })
    return listings
      .filter((listing) =>
        isListingIndexable({
          status: "ACTIVE",
          title: listing.title,
          city: listing.city,
          description: listing.description,
          categoryId: listing.categoryId,
          categorySlug: listing.category?.slug ?? null,
          attributes: (listing.attributes ?? null) as Record<string, unknown> | null,
        }),
      )
      .map((listing) => ({
        url: `${base}${getListingPublicPath(listing)}`,
        lastModified: listing.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }))
  } catch {
    return []
  }
}

export function landingsSitemapEntries(now = new Date()): MetadataRoute.Sitemap {
  const base = SITE_URL
  const entries: MetadataRoute.Sitemap = []

  for (const landing of getIndexableSeoLandings()) {
    entries.push({
      url: `${base}/s/${landing.slug}`,
      lastModified: now,
      changeFrequency: landing.changefreq,
      priority: landing.priority,
    })
  }

  for (const slug of getAllProgrammaticSlugs()) {
    entries.push({
      url: `${base}/s/${slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.65,
    })
  }

  return entries
}

export async function businessSitemapEntries(now = new Date()): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL
  try {
    const { prisma } = await import("@/lib/prisma")
    const [listings, companies] = await Promise.all([
      prisma.businessListing.findMany({
        where: {
          status: "ACTIVE",
          company: { verificationStatus: "VERIFIED", isBlocked: false },
        },
        select: { slug: true, id: true, updatedAt: true },
        take: 5000,
      }),
      prisma.company.findMany({
        where: {
          isPublic: true,
          verificationStatus: "VERIFIED",
          isBlocked: false,
          listings: { some: { status: "ACTIVE" } },
        },
        select: { publicSlug: true, id: true, updatedAt: true },
        take: 2000,
      }),
    ])

    const staticPaths = businessSitemapStaticPaths()

    return [
      ...staticPaths.map((path) => ({
        url: `${base}${path}`,
        lastModified: now,
        changeFrequency: (path === "/business" ? "daily" : "weekly") as const,
        priority: path === "/business" ? 0.9 : 0.75,
      })),
      ...listings.map((l) => ({
        url: `${base}/business/listings/${l.slug ?? l.id}`,
        lastModified: l.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.6,
      })),
      ...companies.map((c) => ({
        url: `${base}/business/companies/${c.publicSlug ?? c.id}`,
        lastModified: c.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ]
  } catch {
    return businessSitemapStaticPaths().map((path) => ({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency: (path === "/business" ? "daily" : "weekly") as const,
      priority: path === "/business" ? 0.9 : 0.75,
    }))
  }
}

export async function sellerSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL
  try {
    const sellers = await prisma.user.findMany({
      where: {
        isBanned: false,
        listings: { some: { status: "ACTIVE" } },
      },
      select: {
        id: true,
        name: true,
        publicSlug: true,
        updatedAt: true,
      },
      take: 5000,
    })
    return sellers.map((seller) => ({
      url: `${base}${getSellerPublicPath(seller)}`,
      lastModified: seller.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.55,
    }))
  } catch {
    return []
  }
}

const SITEMAP_ENTRY_PROBES: Record<
  string,
  () => Promise<MetadataRoute.Sitemap> | MetadataRoute.Sitemap
> = {
  "/sitemap-static.xml": () => staticSitemapEntries(),
  "/sitemap-categories.xml": () => categoryRootSitemapEntries(),
  "/sitemap-subcategories.xml": () => subcategorySitemapEntries(),
  "/sitemap-cities.xml": () => citiesSitemapEntries(),
  "/sitemap-category-city.xml": () => subcategoryCitySitemapEntries(),
  "/sitemap-listings.xml": () => listingSitemapEntries(),
  "/sitemap-want-to-buy.xml": () => wantToBuySitemapEntries(),
  "/sitemap-sellers.xml": () => sellerSitemapEntries(),
  "/sitemap-landings.xml": () => landingsSitemapEntries(),
  "/sitemap-business.xml": () => businessSitemapEntries(),
}

/** Есть ли хотя бы один URL для дочернего sitemap (для индекса). */
export async function sitemapPathHasEntries(path: string): Promise<boolean> {
  const probe = SITEMAP_ENTRY_PROBES[path]
  if (!probe) return true
  try {
    const entries = await probe()
    return dedupeSitemap(entries).length > 0
  } catch {
    return false
  }
}

export function dedupeSitemap(entries: MetadataRoute.Sitemap) {
  const unique = new Map<string, MetadataRoute.Sitemap[number]>()
  for (const entry of entries) {
    if (!unique.has(entry.url)) unique.set(entry.url, entry)
  }
  return Array.from(unique.values())
}
