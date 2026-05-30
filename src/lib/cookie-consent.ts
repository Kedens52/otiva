import { COOKIE_CONSENT_STORAGE_KEY } from "@/lib/legal-meta"

/** Значение в localStorage: аналитика разрешена или только необходимые cookie. */
export type CookieConsentValue = "analytics" | "essential"

export const COOKIE_CONSENT_CHANGED_EVENT = "nashlo:cookie-consent"

/** HttpOnly-флаг на сервере: разрешена аналитика (nashlo_vid, pageview). */
export const ANALYTICS_CONSENT_COOKIE = "nashlo_analytics"

export function parseStoredConsent(raw: string | null): CookieConsentValue | null {
  if (!raw) return null
  if (raw === "analytics" || raw === "essential") return raw
  if (raw === "1") return "analytics"
  return null
}

export function getStoredCookieConsent(): CookieConsentValue | null {
  if (typeof window === "undefined") return null
  try {
    return parseStoredConsent(localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY))
  } catch {
    return null
  }
}

export function hasAnalyticsConsent(): boolean {
  return getStoredCookieConsent() === "analytics"
}

export function setStoredCookieConsent(value: CookieConsentValue): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, value)
  } catch {
    /* quota */
  }
  window.dispatchEvent(
    new CustomEvent(COOKIE_CONSENT_CHANGED_EVENT, { detail: { value } }),
  )
}

export function cookieConsentChoiceLabel(choice: string): string {
  if (choice === "ANALYTICS_ACCEPTED") return "Принял аналитику"
  if (choice === "ESSENTIAL_ONLY") return "Только необходимые"
  return choice
}
