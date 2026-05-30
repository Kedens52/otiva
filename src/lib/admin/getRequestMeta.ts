import type { NextRequest } from "next/server"

/**
 * Извлекает реальный IP клиента.
 * X-Forwarded-For: может содержать цепочку прокси — берём первый (клиентский).
 * Fallback: заголовки Vercel/Cloudflare, затем remoteAddress.
 */
export function extractIp(req: NextRequest): string | null {
  const xff = req.headers.get("x-forwarded-for")
  if (xff) {
    const first = xff.split(",")[0].trim()
    if (first) return first
  }

  const cfIp = req.headers.get("cf-connecting-ip")
  if (cfIp) return cfIp.trim()

  const realIp = req.headers.get("x-real-ip")
  if (realIp) return realIp.trim()

  return null
}

/**
 * Извлекает User-Agent, обрезает до 512 символов.
 */
export function extractUA(req: NextRequest): string | null {
  const ua = req.headers.get("user-agent")
  if (!ua) return null
  return ua.slice(0, 512)
}
