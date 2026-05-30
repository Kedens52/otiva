import { timingSafeEqual } from "crypto"
import type { NextRequest } from "next/server"
import { AdminForbiddenError } from "./errors"

const CSRF_HEADER = "X-CSRF-Token"
const CSRF_COOKIE = "nashlo_admin_csrf"
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"])

const DEFAULT_ALLOWED_HOSTS = [
  "nashlo.ru",
  "www.nashlo.ru",
  ...(process.env.NODE_ENV === "production"
    ? []
    : ["localhost:3000", "localhost:3001", "127.0.0.1:3000", "127.0.0.1:3001"]),
]

function hostsFromEnv(): string[] {
  const urls = [
    process.env.SITE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.APP_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_BASE_URL,
  ].filter(Boolean) as string[]
  const hosts: string[] = []
  for (const u of urls) {
    try {
      const h = new URL(u).host
      if (h) hosts.push(h)
    } catch {
      /* ignore */
    }
  }
  return hosts
}

function allowedHosts(): string[] {
  const extra = process.env.ADMIN_CSRF_ALLOWED_HOSTS?.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean) ?? []
  return Array.from(new Set([...DEFAULT_ALLOWED_HOSTS, ...hostsFromEnv(), ...extra]))
}

function safeEqualToken(left: string, right: string): boolean {
  if (left.length !== right.length) return false
  return timingSafeEqual(Buffer.from(left), Buffer.from(right))
}

function csrfCookieTokens(req: NextRequest): string[] {
  const values = req.cookies
    .getAll(CSRF_COOKIE)
    .map((cookie) => cookie.value)
    .filter(Boolean)

  const rawCookie = req.headers.get("cookie")
  if (rawCookie) {
    for (const part of rawCookie.split(";")) {
      const [rawName, ...rawValue] = part.trim().split("=")
      if (rawName === CSRF_COOKIE && rawValue.length) {
        values.push(decodeURIComponent(rawValue.join("=")))
      }
    }
  }

  return Array.from(new Set(values))
}

export function validateCsrf(req: NextRequest): void {
  if (SAFE_METHODS.has(req.method)) return

  const origin = req.headers.get("origin")
  const referer = req.headers.get("referer")
  const host = req.headers.get("host") ?? ""

  const sourceUrl = origin ?? referer
  if (sourceUrl) {
    try {
      const parsed = new URL(sourceUrl)
      const sourceHost = parsed.host
      const isAllowed = sourceHost === host || allowedHosts().includes(sourceHost)
      if (!isAllowed) {
        throw new AdminForbiddenError("CSRF: недопустимый Origin")
      }
    } catch (err) {
      if (err instanceof AdminForbiddenError) throw err
      throw new AdminForbiddenError("CSRF: не удалось разобрать Origin")
    }
  }

  const headerToken = req.headers.get(CSRF_HEADER)
  if (!headerToken) {
    throw new AdminForbiddenError("CSRF: отсутствует токен")
  }

  const cookieTokens = csrfCookieTokens(req)

  // Legacy admin sessions used path=/admin for the CSRF cookie. The page can
  // read that cookie and send the header, but the browser will not attach it to
  // /api/admin/* requests. Origin/Referer was already verified above, so this
  // keeps current admins working until their next login issues the path=/ cookie.
  if (cookieTokens.length === 0) {
    if (headerToken.length >= 24) return
    throw new AdminForbiddenError("CSRF: отсутствует токен")
  }

  if (!cookieTokens.some((cookieToken) => safeEqualToken(cookieToken, headerToken))) {
    throw new AdminForbiddenError("CSRF: токен не совпадает")
  }
}
