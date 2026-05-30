const path = require("path")
const { loadEnvConfig } = require("@next/env")

const PROJECT_DIR = path.join(__dirname, "..")
const EXPECTED_SITE_URL = "https://nashlo.ru"
const CANONICAL_PUBLIC_URL_KEYS = [
  "APP_URL",
  "SITE_URL",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SITE_URL",
]
const OPTIONAL_PUBLIC_URL_KEYS = ["NEXT_PUBLIC_BASE_URL"]
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"])
const NEXT_PUBLIC_URL_KEYS = new Set([
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_BASE_URL",
])
const SERVER_URL_KEYS = new Set(["APP_URL", "SITE_URL"])

process.env.NODE_ENV = "production"
loadEnvConfig(PROJECT_DIR, false)

function normalizeUrl(value) {
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

function hostnameOf(normalized) {
  try {
    return new URL(normalized).hostname
  } catch {
    return ""
  }
}

function isLocalhostHost(hostname) {
  return LOCAL_HOSTS.has(hostname)
}

/** Acceptable public Nashlo origins (non-localhost). */
function isNashloProductionOrigin(normalized) {
  if (!normalized) return false
  const host = hostnameOf(normalized)
  if (!host || isLocalhostHost(host)) return false
  return host === "nashlo.ru" || host === "www.nashlo.ru"
}

/**
 * @param {string} key
 * @param {string} rawValue
 * @param {{ allowNextPublicLocalhost?: boolean }} opts
 */
function validatePublicUrlValue(key, rawValue, opts = {}) {
  const { allowNextPublicLocalhost = false } = opts
  const normalized = normalizeUrl(rawValue)
  if (!normalized) {
    throw new Error(`${key} must be a valid absolute http(s) URL, got: ${rawValue}`)
  }

  const hostname = hostnameOf(normalized)
  if (isLocalhostHost(hostname)) {
    if (allowNextPublicLocalhost && NEXT_PUBLIC_URL_KEYS.has(key)) {
      console.warn(
        `WARN ${key}=${normalized} (localhost). Remove or set to ${EXPECTED_SITE_URL} so client bundles are not built with dev origin.`,
      )
      return "localhost-warn"
    }
    throw new Error(
      `${key} resolves to localhost in production (${normalized}). Check server .env.local/.env.production precedence before building.`,
    )
  }

  if (!isNashloProductionOrigin(normalized)) {
    throw new Error(`${key} must point to nashlo.ru (e.g. ${EXPECTED_SITE_URL}), got: ${normalized}`)
  }

  if (normalized !== EXPECTED_SITE_URL) {
    console.warn(
      `WARN ${key}=${normalized}: prefer canonical ${EXPECTED_SITE_URL} for SEO and redirects (www/http are accepted here).`,
    )
  }
  return "ok"
}

function main() {
  const canonicalEntries = CANONICAL_PUBLIC_URL_KEYS.map((key) => ({
    key,
    raw: process.env[key]?.trim(),
  })).filter((e) => e.raw)

  if (canonicalEntries.length === 0) {
    throw new Error(
      `Set at least one of ${CANONICAL_PUBLIC_URL_KEYS.join(", ")} on the server (e.g. SITE_URL=${EXPECTED_SITE_URL} in .env.production).`,
    )
  }

  for (const { key, raw } of canonicalEntries) {
    if (!normalizeUrl(raw)) {
      throw new Error(`${key} must be a valid absolute http(s) URL, got: ${raw}`)
    }
  }

  const foreignNonNashlo = canonicalEntries.some((e) => {
    const n = normalizeUrl(e.raw)
    return Boolean(n && !isLocalhostHost(hostnameOf(n)) && !isNashloProductionOrigin(n))
  })
  if (foreignNonNashlo) {
    throw new Error(
      `Public URL env must use nashlo.ru in production. Remove stray staging URLs or set SITE_URL=${EXPECTED_SITE_URL}.`,
    )
  }

  const serverHasLocalhost = canonicalEntries.some((e) => {
    if (!SERVER_URL_KEYS.has(e.key)) return false
    const n = normalizeUrl(e.raw)
    return Boolean(n && isLocalhostHost(hostnameOf(n)))
  })
  if (serverHasLocalhost) {
    throw new Error(
      `SITE_URL/APP_URL must not use localhost in production. Set SITE_URL=${EXPECTED_SITE_URL} (and APP_URL if used).`,
    )
  }

  const hasAcceptableNashlo = canonicalEntries.some((e) => {
    const n = normalizeUrl(e.raw)
    return isNashloProductionOrigin(n)
  })

  const onlyNextPublicLocalhost =
    !hasAcceptableNashlo &&
    canonicalEntries.length > 0 &&
    canonicalEntries.every((e) => {
      if (!NEXT_PUBLIC_URL_KEYS.has(e.key)) return false
      const n = normalizeUrl(e.raw)
      return Boolean(n && isLocalhostHost(hostnameOf(n)))
    })

  if (!hasAcceptableNashlo && !onlyNextPublicLocalhost) {
    throw new Error(
      `At least one of ${CANONICAL_PUBLIC_URL_KEYS.join(", ")} must point to nashlo.ru (not localhost), e.g. SITE_URL=${EXPECTED_SITE_URL}. ` +
        `If only NEXT_PUBLIC_* are set to localhost, either set SITE_URL/APP_URL to ${EXPECTED_SITE_URL} or remove dev NEXT_PUBLIC_* from the server .env.`,
    )
  }

  if (onlyNextPublicLocalhost) {
    console.warn(
      `WARN: No SITE_URL/APP_URL/nashlo NEXT_PUBLIC_* found; only localhost NEXT_PUBLIC_* values. ` +
        `Check passes so deploy can continue; set SITE_URL=${EXPECTED_SITE_URL} and matching NEXT_PUBLIC_* before npm run build so URLs are correct.`,
    )
  }

  const allowNextPublicLocalhost = hasAcceptableNashlo || onlyNextPublicLocalhost

  for (const { key, raw } of canonicalEntries) {
    validatePublicUrlValue(key, raw, { allowNextPublicLocalhost })
  }

  for (const key of OPTIONAL_PUBLIC_URL_KEYS) {
    const raw = process.env[key]?.trim()
    if (!raw) continue
    validatePublicUrlValue(key, raw, { allowNextPublicLocalhost })
  }

  console.log(`OK public production URL env is acceptable for nashlo.ru (canonical ${EXPECTED_SITE_URL})`)
}

main()
