"use client"

import { useEffect } from "react"
import { getStoredCookieConsent } from "@/lib/cookie-consent"
import { persistCookieConsent } from "@/lib/cookie-consent-client"

/** Синхронизирует localStorage с httpOnly cookie (например после старого «Понятно»). */
export function CookieConsentSync() {
  useEffect(() => {
    const stored = getStoredCookieConsent()
    if (stored !== "analytics") return

    fetch("/api/cookies/consent", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data: { analytics?: boolean }) => {
        if (!data.analytics) {
          void persistCookieConsent("analytics", "legacy_sync")
        }
      })
      .catch(() => {})
  }, [])

  return null
}
