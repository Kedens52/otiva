const ALLOWED_EXTERNAL_HOSTS = new Set([
  "nashlo.ru",
  "www.nashlo.ru",
])

export function isInternalUrl(url: string): boolean {
  if (url.startsWith("/")) return true
  try {
    const parsed = new URL(url, "https://nashlo.ru")
    return ALLOWED_EXTERNAL_HOSTS.has(parsed.hostname)
  } catch {
    return false
  }
}

export function sanitizeAdTargetUrl(raw: string): { ok: true; url: string; isExternal: boolean } | { ok: false } {
  const trimmed = raw.trim()
  if (!trimmed) return { ok: false }

  if (trimmed.startsWith("/")) {
    if (trimmed.startsWith("//")) return { ok: false }
    return { ok: true, url: trimmed, isExternal: false }
  }

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return { ok: false }
    if (parsed.username || parsed.password) return { ok: false }
    const host = parsed.hostname.toLowerCase()
    if (
      host === "localhost" ||
      host.endsWith(".local") ||
      /^127\./.test(host) ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host)
    ) {
      return { ok: false }
    }
    const isExternal = !ALLOWED_EXTERNAL_HOSTS.has(host)
    return { ok: true, url: parsed.toString(), isExternal }
  } catch {
    return { ok: false }
  }
}

export function buildAdClickHref(adId: string, targetUrl: string, isExternal: boolean): string {
  if (!isExternal) return targetUrl
  return `/api/ads/go?adId=${encodeURIComponent(adId)}&to=${encodeURIComponent(targetUrl)}`
}
