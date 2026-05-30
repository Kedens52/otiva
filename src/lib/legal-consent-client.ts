import { LEGAL_DOCUMENT_VERSION } from "@/lib/legal-meta"

export type LegalConsentTypeKey =
  | "USER_AGREEMENT"
  | "PRIVACY_POLICY"
  | "PERSONAL_DATA_PROCESSING"
  | "COOKIE"
  | "OFFER"
  | "LISTING_RULES"

/** Запись согласий на клиенте (без блокировки UI при ошибке). */
export async function recordLegalConsents(
  types: LegalConsentTypeKey[],
  source: string,
): Promise<void> {
  if (!types.length) return
  try {
    await fetch("/api/legal/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: types.map((type) => ({
          type,
          documentVersion: LEGAL_DOCUMENT_VERSION,
        })),
        source,
      }),
    })
  } catch {
    /* сеть */
  }
}
