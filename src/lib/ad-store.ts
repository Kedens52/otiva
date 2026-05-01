"use client"

export type AdSlotId = "leaderboard" | "sidebarTop" | "sidebarTall"

export type ManagedAd = {
  id: string
  slot: AdSlotId
  title: string
  subtitle: string
  cta: string
  href: string
  image?: string
  advertiser: string
  active: boolean
  startsAt: string
  endsAt: string
  erid: string
  ordName: string
}

const KEY = "nashlo-managed-ads"

export const adSlots: Array<{ id: AdSlotId; label: string; size: string }> = [
  { id: "leaderboard", label: "Лидерборд в ленте", size: "728x90" },
  { id: "sidebarTop", label: "Правая колонка", size: "300x250" },
  { id: "sidebarTall", label: "Большая правая колонка", size: "300x600" },
]

export function createDefaultAd(slot: AdSlotId): ManagedAd {
  const now = new Date()
  const ends = new Date(now)
  ends.setDate(now.getDate() + 30)

  return {
    id: crypto.randomUUID(),
    slot,
    title: "Ваша реклама помогает Нашло развиваться",
    subtitle: "Мы вкладываем поддержку партнёров в новые функции, модерацию и удобный поиск.",
    cta: "Поддержать рекламой",
    href: "/advertising",
    advertiser: "Партнёр Нашло",
    active: false,
    startsAt: now.toISOString().slice(0, 10),
    endsAt: ends.toISOString().slice(0, 10),
    erid: "erid: demo",
    ordName: "ОРД",
  }
}

export function loadManagedAds(): ManagedAd[] {
  if (typeof window === "undefined") return []

  try {
    const data = JSON.parse(localStorage.getItem(KEY) || "[]") as ManagedAd[]
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export function saveManagedAds(ads: ManagedAd[]) {
  localStorage.setItem(KEY, JSON.stringify(ads))
  window.dispatchEvent(new Event("nashlo-ads-change"))
}

export function getActiveAd(slot: AdSlotId): ManagedAd | null {
  const now = new Date().toISOString().slice(0, 10)

  return (
    loadManagedAds().find((ad) =>
      ad.slot === slot &&
      ad.active &&
      ad.startsAt <= now &&
      ad.endsAt >= now
    ) ?? null
  )
}
