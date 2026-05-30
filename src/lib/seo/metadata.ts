import type { Metadata } from "next"
import { buildPageMetadata, buildNoindexMetadata, absoluteUrl, type BuildPageMetadataInput } from "@/lib/seo/site"
import { buildSeoCategoryMetadata } from "@/lib/seo/collections"
import { getCategorySeoPath, getSellerPublicPath } from "@/lib/seo/paths"
import { toSeoSegment } from "@/lib/seo/categories"
import { prisma } from "@/lib/prisma"
import { normalizeListingImageUrl } from "@/lib/listing-types"
import { getListingSeoFlags } from "@/lib/seo/listing-metadata"

export function generateCanonicalUrl(path: string) {
  return absoluteUrl(path)
}

export async function generateCategoryMetadata(categorySlug: string, segment?: string) {
  return buildSeoCategoryMetadata(categorySlug, segment)
}

export async function generateListingMetadata(listing: {
  id: string
  slug?: string | null
  title: string
  description?: string | null
  price: number
  city?: string | null
  status: string
  images?: string[] | null
  categorySlug?: string | null
  categoryId?: string | null
  attributes?: Record<string, unknown> | null
}): Promise<Metadata> {
  const seo = getListingSeoFlags({
    ...listing,
    categorySlug: listing.categorySlug ?? null,
    categoryId: listing.categoryId ?? null,
  })

  const metadata = buildPageMetadata({
    title: seo.title,
    description: seo.description,
    path: seo.path,
    canonicalPath: seo.path,
    noindex: !seo.indexable,
    type: "article",
  })

  if (listing.images?.[0]) {
    const first = normalizeListingImageUrl(listing.images[0])
    const imageUrl = first.startsWith("http") ? first : absoluteUrl(first)
    metadata.openGraph = {
      ...metadata.openGraph,
      type: "article",
      images: [{ url: imageUrl, alt: listing.title }],
    }
    metadata.twitter = { ...metadata.twitter, images: [imageUrl] }
  }

  return metadata
}

export async function generateSellerMetadata(userId: string): Promise<Metadata> {
  let user: {
    id: string
    name: string | null
    city: string | null
    description: string | null
    publicSlug?: string | null
    isBanned: boolean
    listings: { id: string }[]
  } | null = null

  try {
    user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        city: true,
        description: true,
        publicSlug: true,
        isBanned: true,
        listings: { where: { status: "ACTIVE" }, select: { id: true }, take: 1 },
      },
    })
  } catch {
    user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        city: true,
        description: true,
        isBanned: true,
        listings: { where: { status: "ACTIVE" }, select: { id: true }, take: 1 },
      },
    })
  }

  if (!user || user.isBanned || !user.listings.length) {
    return buildNoindexMetadata({
      title: "Продавец | Нашло",
      description: "Профиль продавца на Нашло.",
      path: `/profile/${userId}`,
    })
  }

  const name = user.name?.trim() || "Продавец"
  const path = getSellerPublicPath({ id: user.id, slug: user.publicSlug, name })

  return buildPageMetadata({
    title: `${name}${user.city ? `, ${user.city}` : ""} — объявления продавца | Нашло`,
    description:
      (user.description || "").replace(/\s+/g, " ").trim().slice(0, 160) ||
      `Активные объявления продавца ${name} на Нашло.`,
    path,
    canonicalPath: path,
  })
}

export function generateCityMetadata(input: {
  categoryLabel: string
  city: string
  categorySlug: string
  segment?: string
}): Metadata {
  const path = getCategorySeoPath(input.categorySlug, input.segment ?? toSeoSegment(input.city))
  return buildPageMetadata({
    title: `${input.categoryLabel} в ${input.city} — объявления | Нашло`,
    description: `Свежие объявления: ${input.categoryLabel} в ${input.city}. Фильтры, фото и контакты продавцов на Нашло.`,
    path,
    canonicalPath: path,
  })
}

export function generateHomeMetadata(): Metadata {
  return buildPageMetadata({
    title: "Нашло — объявления рядом и заявки «Куплю»",
    description:
      "Ищите товары, услуги и предложения от пользователей. Или разместите заявку «Куплю» — продавцы сами предложат варианты. Бесплатно по всей России.",
    path: "/",
    keywords: [
      "объявления",
      "куплю",
      "заявка куплю",
      "продам",
      "бесплатные объявления",
      "маркетплейс",
      "nashlo",
      "kyplu",
    ],
  })
}

export function buildMetadataFromInput(input: BuildPageMetadataInput): Metadata {
  return buildPageMetadata(input)
}
