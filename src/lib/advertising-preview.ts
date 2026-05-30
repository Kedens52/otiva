import { createDefaultAd, loadManagedAds, saveManagedAds } from "@/lib/ad-store"

export const ADVERTISING_PREVIEW_EMAIL = "preview@nashlo.local"
export const ADVERTISING_PREVIEW_NAME = "Ознакомление с кабинетом"
export const ADVERTISER_EMAIL_KEY = "nashlo-advertiser-email"
export const ADVERTISER_NAME_KEY = "nashlo-advertiser-name"

/** Открыть рекламный кабинет для ознакомления (локальный предпросмотр). */
export function prepareAdvertisingPreview() {
  if (typeof window === "undefined") return

  const normalized = ADVERTISING_PREVIEW_EMAIL
  const hasPreview = loadManagedAds().some(
    (ad) => ad.ownerEmail?.toLowerCase() === normalized,
  )

  if (!hasPreview) {
    const sample = {
      ...createDefaultAd("leaderboard"),
      title: "Пример баннера",
      subtitle: "Так будет выглядеть реклама в ленте. Раздел пока в разработке.",
      cta: "Подробнее",
      href: "/advertising",
      advertiser: "Нашло",
      ownerEmail: normalized,
      ownerName: ADVERTISING_PREVIEW_NAME,
      status: "pending" as const,
      active: false,
      erid: "erid: пример",
      ordName: "ОРД (пример)",
    }
    saveManagedAds([sample, ...loadManagedAds()])
  }

  localStorage.setItem(ADVERTISER_EMAIL_KEY, normalized)
  localStorage.setItem(ADVERTISER_NAME_KEY, ADVERTISING_PREVIEW_NAME)
}
