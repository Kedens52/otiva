import { absoluteUrl, SITE_NAME } from "@/lib/seo/site"
import { BUSINESS_BRAND, BUSINESS_BASE_PATH } from "@/lib/business/config"
import type { BusinessSectionSeo } from "@/lib/business/seo"

export type BreadcrumbItem = { name: string; href: string }

export function breadcrumbListJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.href),
    })),
  }
}

export function businessHomeJsonLd() {
  const url = absoluteUrl(BUSINESS_BASE_PATH)
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: BUSINESS_BRAND,
      description:
        "B2B-площадка для компаний, поставщиков, закупщиков и предпринимателей на nashlo.ru",
      url,
      isPartOf: {
        "@type": "WebSite",
        name: SITE_NAME,
        url: absoluteUrl("/"),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: BUSINESS_BRAND,
      url,
      parentOrganization: {
        "@type": "Organization",
        name: SITE_NAME,
        url: absoluteUrl("/"),
      },
    },
    breadcrumbListJsonLd([
      { name: "Главная", href: "/" },
      { name: BUSINESS_BRAND, href: BUSINESS_BASE_PATH },
    ]),
  ]
}

export function businessSectionJsonLd(section: BusinessSectionSeo, citySlug?: string, cityName?: string) {
  const path = citySlug ? `${section.path}/${citySlug}` : section.path
  const crumbs: BreadcrumbItem[] = [
    { name: "Главная", href: "/" },
    { name: BUSINESS_BRAND, href: BUSINESS_BASE_PATH },
    { name: section.h1, href: section.path },
  ]
  if (citySlug && cityName) {
    crumbs.push({
      name: cityName,
      href: path,
    })
  }
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: cityName ? `${section.h1} — ${cityName}` : section.h1,
      description: section.description,
      url: absoluteUrl(path),
    },
    breadcrumbListJsonLd(crumbs),
  ]
}

export function businessCollectionPageJsonLd(input: {
  title: string
  description: string
  path: string
  breadcrumbs: BreadcrumbItem[]
}) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: input.title,
      description: input.description,
      url: absoluteUrl(input.path),
      isPartOf: {
        "@type": "WebSite",
        name: SITE_NAME,
        url: absoluteUrl("/"),
      },
    },
    breadcrumbListJsonLd(input.breadcrumbs),
  ]
}

export function businessListingJsonLd(input: {
  title: string
  description: string
  price: number
  currency: string
  url: string
  companyName: string
  companyUrl: string
  isService?: boolean
  city?: string | null
}) {
  const crumbs = breadcrumbListJsonLd([
    { name: "Главная", href: "/" },
    { name: BUSINESS_BRAND, href: BUSINESS_BASE_PATH },
    { name: "Объявления", href: "/business/listings" },
    { name: input.title, href: input.url.replace(absoluteUrl(""), "") || input.url },
  ])

  const offer = {
    "@type": "Offer",
    price: input.price,
    priceCurrency: input.currency,
    availability: "https://schema.org/InStock",
    url: input.url,
  }

  const main = input.isService
    ? {
        "@context": "https://schema.org",
        "@type": "Service",
        name: input.title,
        description: input.description.slice(0, 500),
        provider: {
          "@type": "Organization",
          name: input.companyName,
          url: input.companyUrl,
        },
        offers: offer,
        areaServed: input.city ?? undefined,
      }
    : {
        "@context": "https://schema.org",
        "@type": "Product",
        name: input.title,
        description: input.description.slice(0, 500),
        offers: offer,
        brand: { "@type": "Organization", name: input.companyName },
      }

  return [main, crumbs]
}

export function businessCompanyJsonLd(input: {
  name: string
  description?: string | null
  city?: string | null
  url: string
  websiteUrl?: string | null
}) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: input.name,
      description: input.description ?? undefined,
      url: input.url,
      sameAs: input.websiteUrl ? [input.websiteUrl] : undefined,
    },
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: input.name,
      url: input.url,
      address: input.city
        ? { "@type": "PostalAddress", addressLocality: input.city, addressCountry: "RU" }
        : undefined,
    },
    breadcrumbListJsonLd([
      { name: "Главная", href: "/" },
      { name: BUSINESS_BRAND, href: BUSINESS_BASE_PATH },
      { name: "Компании", href: "/business/companies" },
      { name: input.name, href: input.url.replace(absoluteUrl(""), "") },
    ]),
  ]
}
