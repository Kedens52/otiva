import type { Metadata } from "next"
import { toSeoSegment } from "@/lib/seo/categories"
import { buildPageMetadata, absoluteUrl } from "@/lib/seo/site"
import { BUSINESS_BRAND, BUSINESS_BASE_PATH } from "@/lib/business/config"

export const BUSINESS_PRIVATE_PREFIXES = [
  "/business/login",
  "/business/register",
  "/business/dashboard",
  "/business/dashboard/",
  "/business/settings",
  "/business/messages",
  "/business/documents",
  "/business/billing",
  "/business/create",
  "/business/requests/create",
] as const

export type BusinessSectionSlug =
  | "wholesale"
  | "sell-business"
  | "franchise"
  | "equipment"
  | "commercial-real-estate"
  | "services"

export type BusinessSectionSeo = {
  slug: BusinessSectionSlug
  path: string
  h1: string
  title: string
  description: string
  ogTitle: string
  ogDescription: string
  listingType: string
  catalogCategory: string
}

export const BUSINESS_SECTIONS: Record<BusinessSectionSlug, BusinessSectionSeo> = {
  wholesale: {
    slug: "wholesale",
    path: "/business/wholesale",
    h1: "Оптовые предложения",
    title: "Оптовые предложения для бизнеса — Нашло Бизнес",
    description:
      "Оптовые товары, поставщики, производители и дистрибьюторы для бизнеса. Найдите предложения по категориям и регионам.",
    ogTitle: "Оптовые предложения — Нашло Бизнес",
    ogDescription: "Опт, поставщики и производители для компаний и предпринимателей.",
    listingType: "WHOLESALE_OFFER",
    catalogCategory: "wholesale",
  },
  "sell-business": {
    slug: "sell-business",
    path: "/business/sell-business",
    h1: "Продажа бизнеса",
    title: "Продажа бизнеса — Нашло Бизнес",
    description:
      "Готовый бизнес, доли, франшизы, интернет-магазины, кафе, производства и услуги для предпринимателей.",
    ogTitle: "Продажа бизнеса — Нашло Бизнес",
    ogDescription: "Готовый бизнес и активы для предпринимателей.",
    listingType: "BUSINESS_FOR_SALE",
    catalogCategory: "sell-business",
  },
  franchise: {
    slug: "franchise",
    path: "/business/franchise",
    h1: "Франшизы",
    title: "Франшизы для бизнеса — Нашло Бизнес",
    description:
      "Каталог франшиз, условия запуска, инвестиции, окупаемость и предложения для предпринимателей.",
    ogTitle: "Франшизы — Нашло Бизнес",
    ogDescription: "Франшизы и условия запуска для предпринимателей.",
    listingType: "FRANCHISE",
    catalogCategory: "franchise",
  },
  equipment: {
    slug: "equipment",
    path: "/business/equipment",
    h1: "Оборудование для бизнеса",
    title: "Оборудование для бизнеса — Нашло Бизнес",
    description:
      "Производственное, торговое, складское и другое оборудование для компаний и предпринимателей.",
    ogTitle: "Оборудование — Нашло Бизнес",
    ogDescription: "Оборудование для компаний и производства.",
    listingType: "EQUIPMENT",
    catalogCategory: "equipment",
  },
  "commercial-real-estate": {
    slug: "commercial-real-estate",
    path: "/business/commercial-real-estate",
    h1: "Коммерческая недвижимость",
    title: "Коммерческая недвижимость — Нашло Бизнес",
    description:
      "Офисы, склады, торговые помещения, производства и земля для бизнеса: аренда и продажа.",
    ogTitle: "Коммерческая недвижимость — Нашло Бизнес",
    ogDescription: "Офисы, склады и торговые помещения для бизнеса.",
    listingType: "COMMERCIAL_REAL_ESTATE",
    catalogCategory: "commercial-real-estate",
  },
  services: {
    slug: "services",
    path: "/business/services",
    h1: "Услуги для бизнеса",
    title: "Услуги для бизнеса — Нашло Бизнес",
    description:
      "Юридические, бухгалтерские, IT, маркетинговые, логистические и другие услуги для компаний.",
    ogTitle: "Услуги для бизнеса — Нашло Бизнес",
    ogDescription: "Услуги для компаний и предпринимателей.",
    listingType: "SERVICE_FOR_BUSINESS",
    catalogCategory: "services",
  },
}

/** Города для SEO-лендингов B2B (ЧПУ) */
export const BUSINESS_SEO_CITIES: { name: string; slug: string; prepositional: string }[] = [
  { name: "Москва", slug: "moskva", prepositional: "Москве" },
  { name: "Санкт-Петербург", slug: "sankt-peterburg", prepositional: "Санкт-Петербурге" },
  { name: "Казань", slug: "kazan", prepositional: "Казани" },
  { name: "Екатеринбург", slug: "ekaterinburg", prepositional: "Екатеринбурге" },
  { name: "Новосибирск", slug: "novosibirsk", prepositional: "Новосибирске" },
]

export function citySlugFromName(city: string): string {
  return toSeoSegment(city)
}

export function cityNameFromSlug(slug: string): string | null {
  const found = BUSINESS_SEO_CITIES.find((c) => c.slug === slug)
  if (found) return found.name
  return null
}

export function buildBusinessHomeMetadata(): Metadata {
  const title = "Нашло Бизнес — B2B-площадка для компаний, опта и закупок"
  const description =
    "Нашло Бизнес — площадка для компаний, поставщиков, закупщиков и предпринимателей. Оптовые предложения, продажа бизнеса, франшизы, оборудование, коммерческая недвижимость и заявки на закупку."

  return {
    ...buildPageMetadata({
      title,
      description,
      path: BUSINESS_BASE_PATH,
      canonicalPath: BUSINESS_BASE_PATH,
      keywords: [
        "b2b",
        "бизнес",
        "опт",
        "поставщики",
        "закупки",
        "франшиза",
        "продажа бизнеса",
        "коммерческая недвижимость",
        "nashlo бизнес",
      ],
    }),
    openGraph: {
      type: "website",
      locale: "ru_RU",
      url: absoluteUrl(BUSINESS_BASE_PATH),
      siteName: BUSINESS_BRAND,
      title: "Нашло Бизнес — площадка для компаний",
      description:
        "Опт, поставщики, закупки, продажа бизнеса, франшизы, оборудование и услуги для бизнеса.",
    },
  }
}

export function buildBusinessSectionMetadata(
  section: BusinessSectionSlug,
  citySlug?: string,
): Metadata {
  const cfg = BUSINESS_SECTIONS[section]
  const city = citySlug ? BUSINESS_SEO_CITIES.find((c) => c.slug === citySlug) : null
  const path = city ? `${cfg.path}/${city.slug}` : cfg.path
  const title = city
    ? `${cfg.h1} в ${city.prepositional} — Нашло Бизнес`
    : cfg.title
  const description = city
    ? `${cfg.description} Предложения в ${city.prepositional}.`
    : cfg.description

  return buildPageMetadata({
    title,
    description,
    path,
    canonicalPath: path,
    keywords: [
      cfg.h1.toLowerCase(),
      "бизнес",
      "b2b",
      "nashlo бизнес",
      ...(city ? [city.name.toLowerCase(), city.prepositional] : []),
    ],
  })
}

export function buildBusinessListingsIndexMetadata(): Metadata {
  return buildPageMetadata({
    title: "B2B-объявления — Нашло Бизнес",
    description:
      "Каталог B2B-объявлений: опт, оборудование, продажа бизнеса, франшизы, коммерческая недвижимость и услуги для компаний.",
    path: "/business/listings",
    canonicalPath: "/business/listings",
    keywords: ["b2b объявления", "опт", "оборудование", "франшиза", "коммерческая недвижимость"],
  })
}

export function buildBusinessCompaniesMetadata(): Metadata {
  return buildPageMetadata({
    title: "Каталог компаний — Нашло Бизнес",
    description: "Проверенные компании, поставщики и закупщики на B2B-площадке Нашло Бизнес.",
    path: "/business/companies",
    canonicalPath: "/business/companies",
    keywords: ["компании", "поставщики", "b2b каталог", "проверенные компании"],
  })
}

export function buildBusinessRequestsMetadata(): Metadata {
  return buildPageMetadata({
    title: "Заявки на закупку — Нашло Бизнес",
    description: "Заявки компаний на закупку товаров, оборудования и услуг. Найдите заказчиков и откликнитесь.",
    path: "/business/requests",
    canonicalPath: "/business/requests",
    keywords: ["заявки на закупку", "тендер", "b2b закупки", "заказчики"],
  })
}

export function buildBusinessPrivateMetadata(title: string): Metadata {
  return buildPageMetadata({
    title: `${title} — Нашло Бизнес`,
    description: "Личный кабинет Нашло Бизнес.",
    path: BUSINESS_BASE_PATH,
    noindex: true,
  })
}

/** Пути для sitemap-business.xml */
export function businessSitemapStaticPaths(): string[] {
  const sections = Object.values(BUSINESS_SECTIONS).map((s) => s.path)
  const cityPaths = Object.values(BUSINESS_SECTIONS).flatMap((s) =>
    BUSINESS_SEO_CITIES.map((c) => `${s.path}/${c.slug}`),
  )
  return [
    BUSINESS_BASE_PATH,
    "/business/listings",
    "/business/companies",
    "/business/requests",
    ...sections,
    ...cityPaths,
  ]
}

export function isBusinessSectionSlug(value: string): value is BusinessSectionSlug {
  return value in BUSINESS_SECTIONS
}
