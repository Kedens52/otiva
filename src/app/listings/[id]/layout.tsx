import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getListingBreadcrumbs } from "@/lib/categories/listing-breadcrumbs"
import { generateJsonLd } from "@/lib/seo/jsonld"
import { generateListingMetadata } from "@/lib/seo/metadata"
import { getListingPublicPath } from "@/lib/seo/paths"
import { parseListingIdFromSlug } from "@/lib/seo/slug"
import { findListingByRouteParam } from "@/lib/listings/resolve-listing-route"
import { JsonLdScripts } from "@/components/business/JsonLdScripts"

type Props = {
  children: React.ReactNode
  params: { id: string }
}

async function getSeoListing(slugOrId: string) {
  const listing = await findListingByRouteParam(prisma, slugOrId).catch(() => null)
  if (!listing) return null
  // Fetch category separately because findListingByRouteParam return type is not generic.
  const cat = await prisma.category.findUnique({
    where: { id: listing.categoryId ?? "" },
    select: { slug: true, name: true, nameRu: true },
  }).catch(() => null)
  return { ...listing, category: cat }
}

function textDescription(value?: string | null) {
  const clean = (value || "").replace(/\s+/g, " ").trim()
  return clean ? clean.slice(0, 160) : "Объявление на Нашло: подробности, фото и контакты продавца."
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const listing = await getSeoListing(params.id)
  if (!listing) {
    const { buildNoindexMetadata } = await import("@/lib/seo/site")
    return buildNoindexMetadata({
      title: "Объявление не найдено | Нашло",
      description: "Страница объявления недоступна или была удалена.",
      path: `/listings/${params.id}`,
    })
  }

  const attrs = (listing.attributes ?? null) as Record<string, unknown> | null

  return generateListingMetadata({
    ...listing,
    categorySlug: listing.category?.slug ?? null,
    categoryId: listing.categoryId,
    attributes: attrs,
  })
}

export default async function ListingLayout({ children, params }: Props) {
  const listing = await getSeoListing(params.id)

  if (!listing) {
    return children
  }

  const canonicalPath = getListingPublicPath(listing)
  const canonicalSegment = canonicalPath.replace(/^\/listings\//, "")
  const rawParam = decodeURIComponent(params.id)
  if (
    rawParam !== canonicalSegment &&
    parseListingIdFromSlug(rawParam) === listing.id
  ) {
    redirect(canonicalPath)
  }

  const attrs = (listing.attributes ?? null) as Record<string, unknown> | null
  const categorySlug = listing.category?.slug ?? null
  const breadcrumbs = getListingBreadcrumbs({
    title: listing.title,
    categorySlug,
    categoryNameRu: listing.category?.nameRu ?? listing.category?.name ?? null,
    subcategoryValue: typeof attrs?.subcategory === "string" ? attrs.subcategory : null,
    attributes: attrs,
  })
  const description = textDescription(listing.description)
  const path = getListingPublicPath(listing)
  const jsonLd = generateJsonLd("listing", {
    id: listing.id,
    title: listing.title,
    description,
    path,
    price: listing.price,
    city: listing.city,
    images: listing.images,
    createdAt: listing.createdAt,
    breadcrumbs,
    categorySlug,
    attributes: attrs,
  })

  return (
    <>
      <JsonLdScripts data={jsonLd} />
      {children}
    </>
  )
}
