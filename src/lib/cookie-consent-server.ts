import type { NextRequest, NextResponse } from "next/server"
import { ANALYTICS_CONSENT_COOKIE } from "@/lib/cookie-consent"
import { VISITOR_COOKIE } from "@/lib/analytics/record-visit"

const CONSENT_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 365,
  path: "/",
} as const

export function hasAnalyticsConsentInRequest(req: NextRequest): boolean {
  return req.cookies.get(ANALYTICS_CONSENT_COOKIE)?.value === "1"
}

export function applyAnalyticsConsentCookie(res: NextResponse, enabled: boolean): void {
  if (enabled) {
    res.cookies.set(ANALYTICS_CONSENT_COOKIE, "1", CONSENT_COOKIE_OPTIONS)
    return
  }
  res.cookies.set(ANALYTICS_CONSENT_COOKIE, "", { ...CONSENT_COOKIE_OPTIONS, maxAge: 0 })
  res.cookies.set(VISITOR_COOKIE, "", { ...CONSENT_COOKIE_OPTIONS, maxAge: 0 })
}
