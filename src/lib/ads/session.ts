import { cookies } from "next/headers"
import { randomUUID } from "crypto"
import { AD_SESSION_COOKIE } from "@/lib/ads/session-client"

export { AD_SESSION_COOKIE } from "@/lib/ads/session-client"

export function readAdSessionIdFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null
  const match = cookieHeader.match(new RegExp(`${AD_SESSION_COOKIE}=([^;]+)`))
  return match?.[1]?.trim() || null
}

export async function getOrCreateServerAdSessionId(): Promise<string> {
  const jar = await cookies()
  const existing = jar.get(AD_SESSION_COOKIE)?.value
  if (existing) return existing
  return randomUUID()
}
