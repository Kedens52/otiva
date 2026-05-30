import {
  DEFAULT_DESCRIPTION,
  SITE_NAME,
  SITE_NAME_LATIN,
  SITE_URL,
} from "@/lib/seo/site"
import { getWantToBuyHubPath, getWantToBuySearchPath } from "@/lib/want-to-buy/routes"

const ORGANIZATION_ID = `${SITE_URL}#organization`
const WEBSITE_ID = `${SITE_URL}#website`

export type BreadcrumbLdItem = {
  label: string
  href: string | null
}

/**
 * Build a BreadcrumbList JSON-LD object.
 * Pass the same array used for the visual breadcrumb component.
 */
export function buildBreadcrumbJsonLd(
  items: BreadcrumbLdItem[],
  listingId?: string,
): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => {
      const url = item.href
        ? `${SITE_URL}${item.href}`
        : listingId
        ? `${SITE_URL}/listings/${listingId}`
        : undefined

      return {
        "@type": "ListItem",
        position: index + 1,
        name: item.label,
        ...(url ? { item: url } : {}),
      }
    }),
  }
}

export function buildOrganizationJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    url: SITE_URL,
    alternateName: SITE_NAME_LATIN,
    description: DEFAULT_DESCRIPTION,
  }
}

export function buildWebSiteJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: SITE_NAME,
    alternateName: SITE_NAME_LATIN,
    description: DEFAULT_DESCRIPTION,
    publisher: {
      "@id": ORGANIZATION_ID,
    },
    potentialAction: [
      {
        "@type": "SearchAction",
        target: `${SITE_URL}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
      {
        "@type": "SearchAction",
        target: `${SITE_URL}${getWantToBuySearchPath()}?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    ],
  }
}

export function buildCollectionPageJsonLd(input: {
  title: string
  description: string
  path: string
  breadcrumbs: BreadcrumbLdItem[]
}): object[] {
  const url = `${SITE_URL}${input.path}`

  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${url}#collection`,
      url,
      name: input.title,
      description: input.description,
      isPartOf: {
        "@id": WEBSITE_ID,
      },
      about: {
        "@id": ORGANIZATION_ID,
      },
    },
    buildBreadcrumbJsonLd(input.breadcrumbs),
  ]
}

export function buildWantToBuyJsonLd(input: {
  id: string
  title: string
  description: string
  path: string
  priceMax?: number | null
  city?: string | null
  createdAt?: Date | string | null
  categoryName?: string | null
}): object[] {
  const url = `${SITE_URL}${input.path}`
  const cleanDescription = input.description.replace(/\s+/g, " ").trim()
  const description =
    cleanDescription.slice(0, 500) || `Покупатель ищет: ${input.title} на ${SITE_NAME}.`

  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: input.title,
      description,
      datePublished: input.createdAt ? new Date(input.createdAt).toISOString() : undefined,
      isPartOf: {
        "@id": WEBSITE_ID,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WantAction",
      "@id": `${url}#want`,
      name: input.title,
      description,
      agent: {
        "@type": "Person",
        name: "Покупатель",
      },
      object: {
        "@type": "Thing",
        name: input.title,
        description,
        ...(input.categoryName ? { category: input.categoryName } : {}),
      },
      ...(typeof input.priceMax === "number"
        ? {
            priceSpecification: {
              "@type": "PriceSpecification",
              maxPrice: input.priceMax,
              priceCurrency: "RUB",
            },
          }
        : {}),
      areaServed: input.city || undefined,
    },
    buildBreadcrumbJsonLd(
      [
        { label: "Главная", href: "/" },
        { label: "Куплю", href: getWantToBuyHubPath() },
        { label: input.title, href: null },
      ],
      input.id,
    ),
  ]
}

export function buildListingJsonLd(input: {
  id: string
  title: string
  description: string
  path: string
  price?: number | null
  city?: string | null
  images?: string[] | null
  createdAt?: Date | string | null
  breadcrumbs: BreadcrumbLdItem[]
}): object[] {
  const url = `${SITE_URL}${input.path}`
  const images = (input.images ?? []).map((image) =>
    image.startsWith("http") ? image : `${SITE_URL}${image}`,
  )

  return [
    {
      "@context": "https://schema.org",
      "@type": "ClassifiedAd",
      "@id": `${url}#classified-ad`,
      url,
      name: input.title,
      description: input.description,
      image: images.length ? images : undefined,
      datePublished: input.createdAt ? new Date(input.createdAt).toISOString() : undefined,
      areaServed: input.city || undefined,
      isPartOf: {
        "@id": WEBSITE_ID,
      },
      offers:
        typeof input.price === "number"
          ? {
              "@type": "Offer",
              price: input.price,
              priceCurrency: "RUB",
              availability: "https://schema.org/InStock",
              url,
            }
          : undefined,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: input.title,
      description: input.description,
      primaryImageOfPage: images[0] || undefined,
      isPartOf: {
        "@id": WEBSITE_ID,
      },
    },
    buildBreadcrumbJsonLd(input.breadcrumbs, input.id),
  ]
}

function offerBlock(url: string, price?: number | null) {
  if (typeof price !== "number") return undefined
  return {
    "@type": "Offer",
    price,
    priceCurrency: "RUB",
    availability: "https://schema.org/InStock",
    url,
  }
}

export function buildProductJsonLd(input: {
  title: string
  description: string
  path: string
  price?: number | null
  images?: string[] | null
  city?: string | null
}): object {
  const url = `${SITE_URL}${input.path}`
  const images = (input.images ?? []).map((image) =>
    image.startsWith("http") ? image : `${SITE_URL}${image}`,
  )
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.title,
    description: input.description,
    image: images.length ? images : undefined,
    offers: offerBlock(url, input.price),
    areaServed: input.city || undefined,
  }
}

export function buildServiceJsonLd(input: {
  title: string
  description: string
  path: string
  price?: number | null
  city?: string | null
}): object {
  const url = `${SITE_URL}${input.path}`
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.title,
    description: input.description,
    areaServed: input.city || undefined,
    offers: offerBlock(url, input.price),
  }
}

export function buildJobPostingJsonLd(input: {
  title: string
  description: string
  path: string
  city?: string | null
  createdAt?: Date | string | null
}): object {
  const url = `${SITE_URL}${input.path}`
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: input.title,
    description: input.description,
    datePosted: input.createdAt ? new Date(input.createdAt).toISOString() : undefined,
    jobLocation: input.city
      ? {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressLocality: input.city,
            addressCountry: "RU",
          },
        }
      : undefined,
    hiringOrganization: {
      "@type": "Organization",
      name: SITE_NAME,
      sameAs: SITE_URL,
    },
    url,
  }
}

export function buildRealEstateListingJsonLd(input: {
  title: string
  description: string
  path: string
  price?: number | null
  city?: string | null
  images?: string[] | null
}): object {
  const url = `${SITE_URL}${input.path}`
  const images = (input.images ?? []).map((image) =>
    image.startsWith("http") ? image : `${SITE_URL}${image}`,
  )
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: input.title,
    description: input.description,
    url,
    image: images.length ? images : undefined,
    offers: offerBlock(url, input.price),
    address: input.city
      ? {
          "@type": "PostalAddress",
          addressLocality: input.city,
          addressCountry: "RU",
        }
      : undefined,
  }
}

export function buildLocalBusinessJsonLd(input: {
  name: string
  description?: string | null
  path: string
  city?: string | null
}): object {
  const url = `${SITE_URL}${input.path}`
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: input.name,
    description: input.description || undefined,
    url,
    address: input.city
      ? {
          "@type": "PostalAddress",
          addressLocality: input.city,
          addressCountry: "RU",
        }
      : undefined,
  }
}

export function buildProfilePageJsonLd(input: {
  name: string
  description?: string | null
  path: string
  city?: string | null
}): object {
  const url = `${SITE_URL}${input.path}`
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url,
    mainEntity: {
      "@type": "Person",
      name: input.name,
      description: input.description || undefined,
      homeLocation: input.city || undefined,
    },
  }
}

export type ListingJsonLdKind = "product" | "service" | "job" | "classified"

export function buildVehicleJsonLd(input: {
  title: string
  description: string
  path: string
  price?: number | null
  images?: string[] | null
  brand?: string | null
  model?: string | null
  year?: number | string | null
  mileage?: number | string | null
}): object {
  const url = `${SITE_URL}${input.path}`
  const images = (input.images ?? []).map((image) =>
    image.startsWith("http") ? image : `${SITE_URL}${image}`,
  )
  return {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: input.title,
    description: input.description,
    image: images.length ? images : undefined,
    brand: input.brand ? { "@type": "Brand", name: input.brand } : undefined,
    model: input.model || undefined,
    vehicleModelDate: input.year ? String(input.year) : undefined,
    mileageFromOdometer:
      input.mileage != null && input.mileage !== ""
        ? {
            "@type": "QuantitativeValue",
            value: Number(input.mileage) || input.mileage,
            unitCode: "KMT",
          }
        : undefined,
    offers: offerBlock(url, input.price),
  }
}

export function resolveListingJsonLdKind(categorySlug?: string | null): ListingJsonLdKind {
  if (categorySlug === "jobs") return "job"
  if (categorySlug === "services") return "service"
  if (categorySlug === "cars") return "classified"
  if (
    categorySlug === "electronics" ||
    categorySlug === "fashion" ||
    categorySlug === "home" ||
    categorySlug === "hobby" ||
    categorySlug === "parts" ||
    categorySlug === "kids" ||
    categorySlug === "goods" ||
    categorySlug === "free"
  ) {
    return "product"
  }
  return "classified"
}

/** Единая точка генерации JSON-LD для страниц. */
export function generateJsonLd(
  kind: "home" | "category" | "listing" | "seller",
  payload: Record<string, unknown>,
): object[] {
  if (kind === "home") {
    return [buildOrganizationJsonLd(), buildWebSiteJsonLd()]
  }
  if (kind === "category") {
    return buildCollectionPageJsonLd(payload as Parameters<typeof buildCollectionPageJsonLd>[0])
  }
  if (kind === "seller") {
    return [buildProfilePageJsonLd(payload as Parameters<typeof buildProfilePageJsonLd>[0])]
  }
  if (kind === "listing") {
    const input = payload as Parameters<typeof buildListingJsonLd>[0] & {
      categorySlug?: string | null
      attributes?: Record<string, unknown> | null
    }
    const ldKind = resolveListingJsonLdKind(input.categorySlug)
    const base = buildListingJsonLd(input)
    const attrs = input.attributes ?? {}
    const vehicleExtra =
      input.categorySlug === "cars"
        ? buildVehicleJsonLd({
            ...input,
            brand: typeof attrs.brand === "string" ? attrs.brand : null,
            model: typeof attrs.model === "string" ? attrs.model : null,
            year:
              typeof attrs.year === "number" || typeof attrs.year === "string"
                ? attrs.year
                : null,
            mileage:
              typeof attrs.mileage === "number" || typeof attrs.mileage === "string"
                ? attrs.mileage
                : null,
          })
        : null
    const extra =
      input.categorySlug === "real-estate"
        ? buildRealEstateListingJsonLd(input)
        : vehicleExtra
          ? vehicleExtra
          : ldKind === "product"
            ? buildProductJsonLd(input)
            : ldKind === "service"
              ? buildServiceJsonLd(input)
              : ldKind === "job"
                ? buildJobPostingJsonLd(input)
                : null
    return extra ? [extra, ...base] : base
  }
  return []
}
