import type { Metadata } from "next"

export const SITE_NAME = "Нашло"
export const SITE_NAME_LATIN = "Nashlo"
export const PRODUCTION_SITE_URL = "https://nashlo.ru"

const DEVELOPMENT_SITE_URL = "http://localhost:3000"
/** Server-side URL vars first so they beat NEXT_PUBLIC_* inlined at build time from a dev machine. */
const SITE_URL_ENV_KEYS = [
  "SITE_URL",
  "APP_URL",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_BASE_URL",
] as const

const LOCAL_SITE_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
])

function normalizeConfiguredSiteUrl(value?: string) {
  const candidate = value?.trim()
  if (!candidate) return null

  try {
    const parsed = new URL(candidate)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null
    }
    return parsed.origin
  } catch {
    return null
  }
}

function isLocalhostOrigin(origin: string) {
  try {
    return LOCAL_SITE_HOSTNAMES.has(new URL(origin).hostname)
  } catch {
    return true
  }
}

function isProductionLikeRuntime() {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production" ||
    process.env.NASHLO_PUBLIC_SITE === "production"
  )
}

/**
 * Canonical public origin for sitemap, robots, metadata, JSON-LD.
 * Skips localhost values in env (common when NEXT_PUBLIC_* was baked during a local `next build`).
 */
export function getPublicSiteOrigin(): string {
  for (const key of SITE_URL_ENV_KEYS) {
    const normalized = normalizeConfiguredSiteUrl(process.env[key])
    if (normalized && !isLocalhostOrigin(normalized)) {
      return normalized
    }
  }

  if (isProductionLikeRuntime()) {
    return PRODUCTION_SITE_URL
  }

  return DEVELOPMENT_SITE_URL
}

export const SITE_URL = getPublicSiteOrigin()

/** Домен без схемы — для директивы Host в robots.txt (Яндекс). */
export function getPublicSiteHostname(): string {
  try {
    return new URL(getPublicSiteOrigin()).hostname
  } catch {
    return "nashlo.ru"
  }
}
export const DEFAULT_OG_IMAGE_PATH = "/opengraph-image"
export const DEFAULT_TITLE = "Нашло — бесплатные объявления рядом"
export const DEFAULT_DESCRIPTION =
  "Нашло — бесплатная площадка объявлений для покупки и продажи товаров, авто, недвижимости и услуг. Размещайте первые объявления бесплатно."

export function absoluteUrl(path = "/") {
  return new URL(path.startsWith("/") ? path : `/${path}`, SITE_URL).toString()
}

function normalizeDescription(value?: string) {
  return (value ?? DEFAULT_DESCRIPTION).replace(/\s+/g, " ").trim()
}

function buildRobots(noindex?: boolean): Metadata["robots"] | undefined {
  if (!noindex) {
    return {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    }
  }

  return {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  }
}

export type BuildPageMetadataInput = {
  title: string
  description: string
  path: string
  canonicalPath?: string
  noindex?: boolean
  type?: "website" | "article"
  keywords?: string[]
}

export function buildPageMetadata({
  title,
  description,
  path,
  canonicalPath,
  noindex,
  type = "website",
  keywords,
}: BuildPageMetadataInput): Metadata {
  const cleanDescription = normalizeDescription(description)
  const canonicalHref = canonicalPath ?? (noindex ? undefined : path)
  const canonical = canonicalHref ? absoluteUrl(canonicalHref) : undefined
  const ogUrl = canonical ?? absoluteUrl(path)
  const ogImage = absoluteUrl(DEFAULT_OG_IMAGE_PATH)

  return {
    title: {
      absolute: title,
    },
    description: cleanDescription,
    ...(keywords?.length ? { keywords } : {}),
    alternates: canonical
      ? {
          canonical,
        }
      : undefined,
    openGraph: {
      type,
      locale: "ru_RU",
      url: ogUrl,
      siteName: SITE_NAME,
      title,
      description: cleanDescription,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} - площадка объявлений`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: cleanDescription,
      images: [ogImage],
      site: SITE_NAME_LATIN,
    },
    robots: buildRobots(noindex),
  }
}

export function buildNoindexMetadata(input: {
  title: string
  description: string
  path: string
}): Metadata {
  return buildPageMetadata({
    ...input,
    noindex: true,
  })
}
