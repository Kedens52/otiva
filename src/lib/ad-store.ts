"use client"

import type { AdMediaType } from "@prisma/client"
import type { AdDisclosureMark } from "@/lib/ads/disclosure-mark"

export type AdSlotId =
  | "leaderboard"
  | "mobileLeaderboard"
  | "sidebarTop"
  | "sidebarTall"
  | "listingSidebar"
export type AdStatus = "draft" | "pending" | "approved" | "rejected"

export type ManagedAd = {
  id: string
  slot: AdSlotId
  title: string
  subtitle: string
  cta: string
  href: string
  image?: string
  mediaType?: AdMediaType
  mediaMimeType?: string
  mediaWidth?: number
  mediaHeight?: number
  mediaDuration?: number
  advertiser: string
  active: boolean
  startsAt: string
  endsAt: string
  erid: string
  ordName: string
  ownerEmail?: string
  ownerName?: string
  status?: AdStatus
  moderationComment?: string
  impressions?: number
  clicks?: number
  lastImpressionAt?: string
  lastClickAt?: string
  /** Только картинка на сайте, без текстовой карточки */
  imageOnly?: boolean
  /** Пометка в углу: «Реклама» или «Партнёр сервиса» */
  disclosureMark?: AdDisclosureMark
}

const KEY = "nashlo-managed-ads"

export type AdSlotVariant = "leaderboard" | "mobileStrip" | "listingStrip" | "box" | "tall"

export type AdSlotDefinition = {
  id: AdSlotId
  label: string
  shortLabel: string
  size: string
  variant: AdSlotVariant
  placement: string
  page: string
  imageHint: string
  tone: "orange" | "blue"
  zoneLabel: string
  adminHint: string
  /** Рекомендуемый размер файла */
  designWidth: number
  designHeight: number
  /** Ширина блока на сайте (px) */
  displayWidth: number
}

export function getAdSlotAspectRatio(slot: AdSlotId | AdSlotDefinition): string {
  const def = typeof slot === "string" ? getAdSlotDefinition(slot) : slot
  return `${def.designWidth} / ${def.designHeight}`
}

/** 2× от макета — чётче на Retina; WebP с высоким quality. */
const BANNER_RETINA_SCALE = 2

export function getAdSlotCompressOptions(slot: AdSlotId) {
  const def = getAdSlotDefinition(slot)
  return {
    maxWidth: def.designWidth * BANNER_RETINA_SCALE,
    maxHeight: def.designHeight * BANNER_RETINA_SCALE,
    quality: 0.92,
    mimeType: "image/webp" as const,
  }
}

export const adSlots: AdSlotDefinition[] = [
  {
    id: "leaderboard",
    label: "Лидерборд — десктоп",
    shortLabel: "Десктоп",
    size: "728 × 90",
    variant: "leaderboard",
    placement: "Между блоком «Для бизнеса» и рекомендациями (только экраны lg и шире)",
    page: "Главная / лента",
    imageHint: "PNG/WebP от 728×90 px (лучше 1456×180 для Retina)",
    tone: "orange",
    zoneLabel: "Главная · десктоп",
    adminHint: "Вкладка «Баннеры» → этот слот",
    designWidth: 728,
    designHeight: 90,
    displayWidth: 720,
  },
  {
    id: "mobileLeaderboard",
    label: "Баннер — мобильная главная",
    shortLabel: "Мобильный",
    size: "375 × 78",
    variant: "mobileStrip",
    placement: "Между «Для бизнеса» и «Рекомендации» (только телефоны, до lg)",
    page: "Главная / лента",
    imageHint: "От 375×78 px (лучше 750×156), без мелкого текста",
    tone: "orange",
    zoneLabel: "Главная · мобильный",
    adminHint: "Вкладка «Баннеры» → не путать с десктопным лидербордом",
    designWidth: 375,
    designHeight: 78,
    displayWidth: 375,
  },
  {
    id: "sidebarTop",
    label: "Сайдбар — верх",
    shortLabel: "Сайдбар",
    size: "300 × 250 → 260px",
    variant: "box",
    placement: "Правая колонка 260px (десктоп lg+)",
    page: "Главная (только десктоп, lg+)",
    imageHint: "От 300×250 px (лучше 600×500), колонка на сайте 260px",
    tone: "blue",
    zoneLabel: "Главная · сайдбар",
    adminHint: "Вкладка «Баннеры» → только десктоп",
    designWidth: 300,
    designHeight: 250,
    displayWidth: 260,
  },
  {
    id: "sidebarTall",
    label: "Сайдбар — высокий",
    shortLabel: "Высокий",
    size: "300 × 600 → 260px",
    variant: "tall",
    placement: "Правая колонка 260px под верхним баннером",
    page: "Главная (только десктоп, lg+)",
    imageHint: "От 300×600 px (лучше 600×1200), колонка 260px",
    tone: "blue",
    zoneLabel: "Главная · сайдбар",
    adminHint: "Вкладка «Баннеры» → только десктоп",
    designWidth: 300,
    designHeight: 600,
    displayWidth: 260,
  },
  {
    id: "listingSidebar",
    label: "Карточка объявления — под сайдбаром",
    shortLabel: "Объявление",
    size: "280 × 100",
    variant: "listingStrip",
    placement: "Под блоком цены и кнопок в правой колонке (десктоп lg+), фиксируется при скролле",
    page: "Страница объявления /listings/[id]",
    imageHint: "PNG/WebP от 280×100 px (лучше 560×200 для Retina), без мелкого текста",
    tone: "orange",
    zoneLabel: "Объявление · сайдбар",
    adminHint: "Вкладка «Баннеры» → слот «Карточка объявления»",
    designWidth: 280,
    designHeight: 100,
    displayWidth: 280,
  },
]

export function getAdSlotDefinition(id: AdSlotId): AdSlotDefinition {
  return adSlots.find((slot) => slot.id === id) ?? adSlots[0]
}

export function createDefaultAd(slot: AdSlotId): ManagedAd {
  const now = new Date()
  const ends = new Date(now)
  ends.setDate(now.getDate() + 30)
  const isMobile = slot === "mobileLeaderboard"
  const isListing = slot === "listingSidebar"

  return {
    id: crypto.randomUUID(),
    slot,
    title: isMobile || isListing ? "Здесь может быть ваша реклама" : "Первые объявления — бесплатно",
    subtitle: isMobile
      ? "На главной Nashlo"
      : isListing
        ? "Под карточкой объявления"
        : "Разместите объявление и получите первые отклики. Продвижение — по желанию.",
    cta: isMobile || isListing ? "Подробнее" : "Разместить",
    href: isMobile || isListing ? "/advertising" : "/create",
    advertiser: isMobile || isListing ? "Реклама" : "Возможность Нашло",
    active: false,
    startsAt: now.toISOString().slice(0, 10),
    endsAt: ends.toISOString().slice(0, 10),
    erid: "erid: demo",
    ordName: "ОРД",
    status: "draft",
    disclosureMark: "ad",
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

export function trackAdImpression(id: string) {
  if (typeof window === "undefined") return

  void fetch("/api/banner-slots/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, type: "impression" }),
  }).catch(() => {})
}

export function trackAdClick(id: string) {
  if (typeof window === "undefined") return

  void fetch("/api/banner-slots/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, type: "click" }),
  }).catch(() => {})
}

export async function fetchPublicBannerSlots(): Promise<Partial<Record<AdSlotId, ManagedAd>>> {
  const res = await fetch("/api/banner-slots", { cache: "no-store" })
  if (!res.ok) return {}
  const data = await res.json().catch(() => ({}))
  return (data.slots ?? {}) as Partial<Record<AdSlotId, ManagedAd>>
}

export async function fetchAdminBannerSlots(): Promise<ManagedAd[]> {
  const res = await fetch("/api/admin/banner-slots")
  if (!res.ok) return []
  const data = await res.json().catch(() => ({}))
  return Array.isArray(data.ads) ? data.ads : []
}

export async function saveAdminBannerSlots(
  ads: ManagedAd[],
  csrfToken: string,
): Promise<{ ok: boolean; ads?: ManagedAd[]; error?: string }> {
  const res = await fetch("/api/admin/banner-slots", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify({ ads }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { ok: false, error: data.error || "Не удалось сохранить" }
  }
  return { ok: true, ads: data.ads }
}

export function getTrackedAdHref(ad: ManagedAd) {
  return `/api/ads/click?id=${encodeURIComponent(ad.id)}&to=${encodeURIComponent(ad.href)}`
}
