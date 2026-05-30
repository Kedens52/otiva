import { notFound } from "next/navigation"
import type { Metadata } from "next"
import type { BreadcrumbItem } from "@/lib/categories/listing-breadcrumbs"
import { prisma } from "@/lib/prisma"
import {
  type SeoCategoryConfig,
  type SeoCategoryChild,
  getSeoCategoryChild,
  getSeoCategoryConfig,
  getSeoCategoryPath,
  toSeoSegment,
} from "@/lib/seo/categories"
import { buildPageMetadata } from "@/lib/seo/site"
import { getCategorySeoPath } from "@/lib/seo/paths"
import { getListingPublicPath } from "@/lib/seo/paths"
import { getCategorySeoKeywords } from "@/lib/seo/category-keywords"

export const CITY_INDEX_THRESHOLD = 5

export type SeoCategoryPageState = {
  config: SeoCategoryConfig
  internalCategorySlug: string
  title: string
  description: string
  intro: string
  path: string
  canonicalPath: string
  breadcrumbs: BreadcrumbItem[]
  links: Array<{ label: string; href: string }>
  fixedParams?: Record<string, string>
  initialCity?: string
  hideCityFilter?: boolean
  scopeLabel?: string
}

async function resolveIndexedCity(
  config: SeoCategoryConfig,
  segment: string,
): Promise<{ city: string; count: number } | null> {
  const categorySlugs = config.cityCategorySlugs ?? [config.internalCategorySlug]
  const rows = await prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      category: {
        slug: { in: categorySlugs },
      },
      city: {
        not: null,
      },
    },
    select: {
      city: true,
    },
    distinct: ["city"],
  })

  const match = rows.find((row) => row.city && toSeoSegment(row.city) === segment)?.city
  if (!match) return null

  const count = await prisma.listing.count({
    where: {
      status: "ACTIVE",
      category: {
        slug: { in: categorySlugs },
      },
      city: match,
    },
  })

  if (count < CITY_INDEX_THRESHOLD) return null
  return { city: match, count }
}

function buildBaseBreadcrumbs(config: SeoCategoryConfig, currentLabel?: string): BreadcrumbItem[] {
  return [
    { label: "Главная", href: "/" },
    {
      label: config.label,
      href: currentLabel ? getSeoCategoryPath(config.slug) : null,
      current: !currentLabel,
    },
    ...(currentLabel ? [{ label: currentLabel, href: null, current: true }] : []),
  ]
}

function childLinks(config: SeoCategoryConfig) {
  return config.children.map((child) => ({
    label: child.label,
    href: getSeoCategoryPath(config.slug, child.slug),
  }))
}

function childToPageState(config: SeoCategoryConfig, child: SeoCategoryChild): SeoCategoryPageState {
  const path = getSeoCategoryPath(config.slug, child.slug)
  const canonicalPath = getCategorySeoPath(config.slug, child.slug)
  return {
    config,
    internalCategorySlug: child.internalCategorySlug ?? config.internalCategorySlug,
    title: child.title,
    description: child.description,
    intro: `${child.description} Смотрите объявления с фото, ценой и подробным описанием на Нашло.`,
    path,
    canonicalPath,
    breadcrumbs: buildBaseBreadcrumbs(config, child.label),
    links: [
      { label: `Все в разделе «${config.label}»`, href: getSeoCategoryPath(config.slug) },
      ...childLinks(config).filter((link) => link.href !== path),
    ],
    fixedParams: child.filter ? { [child.filter.key]: child.filter.value } : undefined,
    scopeLabel: child.label,
  }
}

function childCityToPageState(
  config: SeoCategoryConfig,
  child: SeoCategoryChild,
  city: string,
): SeoCategoryPageState {
  const citySeg = toSeoSegment(city)
  const path = getSeoCategoryPath(config.slug, `${child.slug}/${citySeg}`)
  const canonicalPath = getCategorySeoPath(config.slug, child.slug, citySeg)

  return {
    config,
    internalCategorySlug: child.internalCategorySlug ?? config.internalCategorySlug,
    title: `${child.title} в ${city}`,
    description: `Объявления: ${child.label} в городе ${city}. Актуальные предложения с фото и ценами на Нашло.`,
    intro: `Подборка «${child.label}» в ${city}. Используйте фильтры, чтобы уточнить поиск.`,
    path,
    canonicalPath,
    breadcrumbs: [
      { label: "Главная", href: "/" },
      { label: config.label, href: getSeoCategoryPath(config.slug) },
      { label: child.label, href: getSeoCategoryPath(config.slug, child.slug) },
      { label: city, href: null, current: true },
    ],
    links: [
      { label: `Все в «${config.label}»`, href: getSeoCategoryPath(config.slug) },
      { label: `${child.label} — все города`, href: getSeoCategoryPath(config.slug, child.slug) },
      ...childLinks(config).filter((l) => l.href !== path),
    ],
    fixedParams: child.filter ? { [child.filter.key]: child.filter.value } : undefined,
    initialCity: city,
    hideCityFilter: true,
    scopeLabel: `${child.label}, ${city}`,
  }
}

function cityToPageState(
  config: SeoCategoryConfig,
  city: string,
): SeoCategoryPageState {
  const segment = toSeoSegment(city)
  const path = getSeoCategoryPath(config.slug, segment)
  const canonicalPath = getCategorySeoPath(config.slug, segment)

  return {
    config,
    internalCategorySlug: config.internalCategorySlug,
    title: `${config.title} в ${city}`,
    description: `Свежие объявления в разделе «${config.label}» по городу ${city}.`,
    intro: `Каталог объявлений по разделу «${config.label}» для города ${city}. Здесь собраны только активные предложения.`,
    path,
    canonicalPath,
    breadcrumbs: buildBaseBreadcrumbs(config, city),
    links: childLinks(config),
    initialCity: city,
    hideCityFilter: true,
    scopeLabel: city,
  }
}

export async function resolveSeoCategoryPageState(
  categorySlug: string,
  segment?: string,
  citySegment?: string,
): Promise<SeoCategoryPageState> {
  const config = getSeoCategoryConfig(categorySlug)
  if (!config) notFound()

  if (segment && citySegment) {
    const child = getSeoCategoryChild(categorySlug, segment)
    if (child) {
      const city = await resolveIndexedCity(config, citySegment)
      if (city) return childCityToPageState(config, child, city.city)
    }
    notFound()
  }

  if (!segment) {
    const path = getSeoCategoryPath(config.slug)
    const canonicalPath = getCategorySeoPath(config.slug)
    return {
      config,
      internalCategorySlug: config.internalCategorySlug,
      title: config.h1,
      description: config.description,
      intro: `${config.description} Актуальные объявления публикуются каждый день и доступны без лишних промежуточных страниц.`,
      path,
      canonicalPath,
      breadcrumbs: buildBaseBreadcrumbs(config),
      links: childLinks(config),
    }
  }

  const child = getSeoCategoryChild(categorySlug, segment)
  if (child) {
    return childToPageState(config, child)
  }

  const city = await resolveIndexedCity(config, segment)
  if (city) {
    return cityToPageState(config, city.city)
  }

  notFound()
}

export async function buildSeoCategoryMetadata(
  categorySlug: string,
  segment?: string,
  citySegment?: string,
): Promise<Metadata> {
  const state = await resolveSeoCategoryPageState(categorySlug, segment, citySegment)
  const rootConfig = getSeoCategoryConfig(categorySlug)
  const title = segment || citySegment
    ? `${state.title} — объявления | Нашло`
    : rootConfig?.title ?? `${state.title} — объявления | Нашло`

  const segmentLabel =
    segment && rootConfig
      ? getSeoCategoryChild(categorySlug, segment)?.label ?? segment
      : citySegment

  return buildPageMetadata({
    title,
    description: state.description,
    path: state.canonicalPath,
    canonicalPath: state.canonicalPath,
    keywords: getCategorySeoKeywords(
      categorySlug,
      rootConfig?.label ?? state.title,
      segmentLabel,
    ),
  })
}

export async function getSeoCategoryListingCount(
  internalCategorySlug: string,
  fixedParams?: Record<string, string>,
  city?: string,
) {
  const where = {
    status: "ACTIVE",
    category: { slug: internalCategorySlug },
    ...(city ? { city } : {}),
  }

  if (fixedParams && Object.keys(fixedParams).length) {
    const listings = await prisma.listing.findMany({
      where,
      select: { attributes: true },
      take: 500,
    })
    return listings.filter((row) => {
      const attrs = (row.attributes ?? {}) as Record<string, unknown>
      return Object.entries(fixedParams).every(([key, value]) => String(attrs[key] ?? "") === value)
    }).length
  }

  return prisma.listing.count({ where })
}

export async function getSeoCategoryRecentListings(
  internalCategorySlug: string,
  limit = 6,
  city?: string,
) {
  const rows = await prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      category: { slug: internalCategorySlug },
      ...(city ? { city } : {}),
    },
    select: { id: true, slug: true, title: true, city: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  })

  return rows.map((row) => ({
    title: row.title,
    href: getListingPublicPath(row),
  }))
}

export async function getIndexedCityPagesForSitemap(categorySlug: string) {
  const config = getSeoCategoryConfig(categorySlug)
  if (!config) return []

  const categorySlugs = config.cityCategorySlugs ?? [config.internalCategorySlug]
  const rows = await prisma.listing.groupBy({
    by: ["city"],
    where: {
      status: "ACTIVE",
      category: {
        slug: { in: categorySlugs },
      },
      city: {
        not: null,
      },
    },
    _count: {
      city: true,
    },
  })

  return rows
    .filter((row) => row.city && row._count.city >= CITY_INDEX_THRESHOLD)
    .map((row) => ({
      city: row.city as string,
      href: getSeoCategoryPath(categorySlug, toSeoSegment(row.city as string)),
      count: row._count.city,
    }))
}
