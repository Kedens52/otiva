import type { AdPlacementConfig, AdPlacementDeviceScope, AdPlacementKind } from "@prisma/client"
import { adSlots } from "@/lib/ad-store"
import { BANNER_SLOT_GUIDE, CAMPAIGN_PLACEMENT_GUIDE } from "@/lib/ads/placement-guide"

export type PlacementConfigInput = Omit<
  AdPlacementConfig,
  "id" | "createdAt" | "updatedAt"
>

const BANNER_FORMATS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
]
const CAMPAIGN_FORMATS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
]

function deviceFromBanner(slotId: string): AdPlacementDeviceScope {
  if (slotId === "mobileLeaderboard") return "MOBILE"
  if (slotId === "leaderboard" || slotId.startsWith("sidebar") || slotId === "listingSidebar") {
    return "DESKTOP"
  }
  return "ALL"
}

function fallbackForBanner(slotId: string) {
  if (slotId === "mobileLeaderboard" || slotId === "listingSidebar") {
    return {
      fallbackTitle: "Здесь может быть ваша реклама",
      fallbackSubtitle: "Разместите рекламу на Нашло",
      fallbackCta: "Разместить",
      fallbackHref: "/advertising",
    }
  }
  if (slotId.startsWith("sidebar")) {
    return {
      fallbackTitle: "Помогите проекту расти",
      fallbackSubtitle: "Партнёрские размещения поддерживают развитие сервиса",
      fallbackCta: "Разместиться",
      fallbackHref: "/advertising",
    }
  }
  return {
    fallbackTitle: "Ваша реклама помогает Нашло развиваться",
    fallbackSubtitle: "Мы вкладываем поддержку партнёров в новые функции и модерацию",
    fallbackCta: "Поддержать рекламой",
    fallbackHref: "/advertising",
  }
}

/** Справочник по умолчанию — синхронизируется в БД при первом открытии /admin/ads */
export function buildDefaultPlacementConfigs(): PlacementConfigInput[] {
  const banner: PlacementConfigInput[] = adSlots.map((slot) => {
    const guide = BANNER_SLOT_GUIDE[slot.id]
    const fb = fallbackForBanner(slot.id)
    return {
      code: slot.id,
      kind: "BANNER_SLOT" as AdPlacementKind,
      name: slot.label,
      description: guide?.where ?? slot.placement,
      pages: guide?.pages ?? slot.page,
      whereOnPage: slot.placement,
      deviceScope: deviceFromBanner(slot.id),
      designWidth: slot.designWidth,
      designHeight: slot.designHeight,
      displayWidth: slot.displayWidth,
      allowedFormats: BANNER_FORMATS,
      maxFileBytes: 5 * 1024 * 1024,
      active: true,
      maxActiveCreatives: 3,
      sortPriority: slot.id === "leaderboard" ? 10 : 20,
      pricePerMinute: null,
      pricePerHour: null,
      pricePerDay: 500,
      pricePerWeek: 3000,
      ...fb,
    }
  })

  const stripGuide = BANNER_SLOT_GUIDE.siteBanner
  const siteStrip: PlacementConfigInput = {
    code: "siteBanner",
    kind: "SITE_STRIP",
    name: stripGuide.title,
    description: stripGuide.where,
    pages: stripGuide.pages,
    whereOnPage: stripGuide.where,
    deviceScope: "ALL",
    designWidth: 1200,
    designHeight: 48,
    displayWidth: 1200,
    allowedFormats: BANNER_FORMATS,
    maxFileBytes: 2 * 1024 * 1024,
    active: true,
    maxActiveCreatives: 1,
    sortPriority: 5,
    pricePerMinute: null,
    pricePerHour: null,
    pricePerDay: 300,
    pricePerWeek: 1800,
    fallbackTitle: "Нашло — объявления рядом с вами",
    fallbackSubtitle: null,
    fallbackCta: "Подробнее",
    fallbackHref: "/advertising",
  }

  const campaign: PlacementConfigInput[] = CAMPAIGN_PLACEMENT_GUIDE.map((row, index) => ({
    code: row.value,
    kind: "CAMPAIGN" as AdPlacementKind,
    name: row.label,
    description: row.format,
    pages: row.pages,
    whereOnPage: row.where,
    deviceScope:
      row.value === "MOBILE_FEED_INLINE"
        ? ("MOBILE" as AdPlacementDeviceScope)
        : row.value === "DESKTOP_FEED_INLINE" || row.value === "SIDEBAR_DESKTOP"
          ? ("DESKTOP" as AdPlacementDeviceScope)
          : ("ALL" as AdPlacementDeviceScope),
    designWidth: null,
    designHeight: null,
    displayWidth: null,
    allowedFormats: CAMPAIGN_FORMATS,
    maxFileBytes: 30 * 1024 * 1024,
    active: true,
    maxActiveCreatives: 5,
    sortPriority: 100 + index,
    pricePerMinute: null,
    pricePerHour: null,
    pricePerDay: 1000,
    pricePerWeek: 6000,
    fallbackTitle: "Здесь может быть ваша реклама",
    fallbackSubtitle: "Нативная карточка в ленте Нашло",
    fallbackCta: "Разместить",
    fallbackHref: "/advertising",
  }))

  return [siteStrip, ...banner, ...campaign]
}
