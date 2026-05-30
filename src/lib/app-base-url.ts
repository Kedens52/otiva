import { PRODUCTION_SITE_URL } from "@/lib/seo/site"

function stripTrailingSlash(url: string) {
  return url.replace(/\/+$/, "")
}

const LOCAL_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
])

/** Серверные URL важнее NEXT_PUBLIC_* (часто зашиты localhost при локальном build). */
const OAUTH_ENV_ORIGIN_KEYS = [
  "SITE_URL",
  "APP_URL",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_BASE_URL",
] as const

export type OAuthRequest = {
  headers: Headers
  nextUrl?: URL
  url?: string
}

function isLocalhostOrigin(origin: string) {
  try {
    return LOCAL_HOSTS.has(new URL(origin).hostname)
  } catch {
    return true
  }
}

function normalizeOrigin(value?: string | null): string | null {
  const candidate = value?.trim()
  if (!candidate) return null
  try {
    const parsed = new URL(candidate)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null
    return stripTrailingSlash(parsed.origin)
  } catch {
    return null
  }
}

/** Канонический origin для OAuth: https://nashlo.ru без www. */
export function canonicalOAuthOrigin(origin: string): string {
  try {
    const host = new URL(origin).hostname
    if (host === "nashlo.ru" || host === "www.nashlo.ru") {
      return PRODUCTION_SITE_URL
    }
  } catch {
    /* ignore */
  }
  return stripTrailingSlash(origin)
}

function originFromForwardedHeaders(request?: OAuthRequest): string | null {
  const forwardedProto = request?.headers.get("x-forwarded-proto")?.split(",")[0]?.trim()
  const forwardedHost =
    request?.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request?.headers.get("host")?.split(",")[0]?.trim()
  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`
  }
  return null
}

function originFromEnv(): string | null {
  for (const key of OAUTH_ENV_ORIGIN_KEYS) {
    const normalized = normalizeOrigin(process.env[key])
    if (!normalized) continue
    if (process.env.NODE_ENV === "production" && isLocalhostOrigin(normalized)) {
      continue
    }
    return normalized
  }
  return null
}

/**
 * Базовый публичный URL для OAuth redirect_uri и post-login redirect.
 * Production: всегда https://nashlo.ru (без localhost/www), даже если в env остался dev URL.
 */
export function getOAuthBaseUrl(request?: OAuthRequest): string {
  if (process.env.NODE_ENV === "production") {
    const fromEnv = originFromEnv()
    if (fromEnv && !isLocalhostOrigin(fromEnv)) {
      return canonicalOAuthOrigin(fromEnv)
    }
    const fromRequest = originFromForwardedHeaders(request)
    if (fromRequest && !isLocalhostOrigin(fromRequest)) {
      return canonicalOAuthOrigin(fromRequest)
    }
    return PRODUCTION_SITE_URL
  }

  const fromEnv = originFromEnv()
  if (fromEnv) return fromEnv

  const fromRequest = originFromForwardedHeaders(request)
  if (fromRequest) return stripTrailingSlash(fromRequest)

  if (request?.nextUrl?.origin) return stripTrailingSlash(request.nextUrl.origin)

  if (request?.url) {
    try {
      return stripTrailingSlash(new URL(request.url).origin)
    } catch {
      /* ignore */
    }
  }

  const vercel = process.env.VERCEL_URL?.trim()
  if (vercel) return stripTrailingSlash(vercel.startsWith("http") ? vercel : `https://${vercel}`)

  return "http://localhost:3000"
}

function normalizeOAuthRedirectUri(configured: string, path: string, request?: OAuthRequest): string {
  if (process.env.NODE_ENV !== "production") return configured
  try {
    const u = new URL(configured)
    const badHost =
      LOCAL_HOSTS.has(u.hostname) ||
      u.hostname === "www.nashlo.ru" ||
      u.protocol !== "https:"
    if (badHost) return `${getOAuthBaseUrl(request)}${path}`
  } catch {
    return `${getOAuthBaseUrl(request)}${path}`
  }
  return configured
}

export function getYandexRedirectUri(request?: OAuthRequest): string {
  const configured = process.env.YANDEX_REDIRECT_URI?.trim()
  if (configured) {
    return normalizeOAuthRedirectUri(configured, "/api/auth/yandex/callback", request)
  }
  return `${getOAuthBaseUrl(request)}/api/auth/yandex/callback`
}

export function getVkRedirectUri(request?: OAuthRequest): string {
  const configured = process.env.VK_REDIRECT_URI?.trim()
  if (configured) {
    return normalizeOAuthRedirectUri(configured, "/api/auth/vk/callback", request)
  }
  return `${getOAuthBaseUrl(request)}/api/auth/vk/callback`
}

/** Secure cookies за HTTPS-прокси (nginx X-Forwarded-Proto). */
export function isProductionHttps(request?: OAuthRequest): boolean {
  if (process.env.NODE_ENV !== "production") return false
  const proto = request?.headers.get("x-forwarded-proto")?.split(",")[0]?.trim()
  if (proto) return proto === "https"
  return true
}
