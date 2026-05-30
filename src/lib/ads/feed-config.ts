import type { AdPlacement } from "@prisma/client"

export type FeedAdIntervalConfig = {
  mobile: number
  desktop: number
  search: number
  category: number
}

/** Интервал вставки рекламы (после каждых N карточек). */
export const DEFAULT_FEED_AD_INTERVALS: FeedAdIntervalConfig = {
  mobile: 6,
  desktop: 8,
  search: 5,
  category: 7,
}

export function getFeedAdInterval(
  placement: AdPlacement,
  device: "MOBILE" | "DESKTOP" | "TABLET",
): number {
  const cfg = DEFAULT_FEED_AD_INTERVALS
  if (placement === "SEARCH_FEED_INLINE") return cfg.search
  if (placement === "CATEGORY_FEED_INLINE") return cfg.category
  if (device === "DESKTOP") return cfg.desktop
  return cfg.mobile
}

export function placementForDevice(device: "MOBILE" | "DESKTOP" | "TABLET"): AdPlacement {
  return device === "DESKTOP" ? "DESKTOP_FEED_INLINE" : "MOBILE_FEED_INLINE"
}
