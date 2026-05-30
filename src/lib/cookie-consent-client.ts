import {
  type CookieConsentValue,
  setStoredCookieConsent,
} from "@/lib/cookie-consent"
import { recordLegalConsents } from "@/lib/legal-consent-client"

export async function persistCookieConsent(
  choice: CookieConsentValue,
  source: string,
): Promise<{ ok: boolean }> {
  setStoredCookieConsent(choice)

  try {
    const res = await fetch("/api/cookies/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ choice, source }),
    })
    if (!res.ok) return { ok: false }
    if (choice === "analytics") {
      void recordLegalConsents(["COOKIE"], source)
    }
    return { ok: true }
  } catch {
    return { ok: false }
  }
}
