"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import {
  COOKIE_CONSENT_CHANGED_EVENT,
  hasAnalyticsConsent,
} from "@/lib/cookie-consent"

const SKIP_PREFIXES = ["/admin", "/api", "/_next"]

function shouldTrack(pathname: string) {
  if (!pathname) return false
  return !SKIP_PREFIXES.some((p) => pathname.startsWith(p))
}

export function SiteVisitTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const lastSent = useRef<string | null>(null)
  const [consentTick, setConsentTick] = useState(0)

  useEffect(() => {
    const onConsent = () => {
      lastSent.current = null
      setConsentTick((n) => n + 1)
    }
    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, onConsent)
    return () => window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, onConsent)
  }, [])

  useEffect(() => {
    if (!pathname || !shouldTrack(pathname) || !hasAnalyticsConsent()) return

    const qs = searchParams?.toString()
    const path = qs ? `${pathname}?${qs}` : pathname
    if (lastSent.current === path) return

    const timer = window.setTimeout(() => {
      lastSent.current = path
      const referrer =
        typeof document !== "undefined" && document.referrer
          ? document.referrer
          : undefined

      fetch("/api/analytics/pageview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, referrer }),
        keepalive: true,
        credentials: "same-origin",
      }).catch(() => {})
    }, 120)

    return () => window.clearTimeout(timer)
  }, [pathname, searchParams, consentTick])

  return null
}
