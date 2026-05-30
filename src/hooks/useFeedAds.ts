"use client"

import { useEffect, useMemo, useState } from "react"
import type { AdDevice, AdPlacement } from "@prisma/client"
import type { AppListing } from "@/lib/listing-types"
import { getFeedAdInterval } from "@/lib/ads/feed-config"
import { insertAdsIntoFeed } from "@/lib/ads/insert-into-feed"
import { getClientAdSessionId } from "@/lib/ads/session-client"
import type { FeedItem } from "@/lib/ads/types"

function detectDevice(): AdDevice {
  if (typeof window === "undefined") return "ALL"
  const w = window.innerWidth
  if (w < 768) return "MOBILE"
  if (w < 1024) return "TABLET"
  return "DESKTOP"
}

type UseFeedAdsOptions = {
  listings: AppListing[]
  placement: AdPlacement
  enabled?: boolean
  categoryId?: string
  subcategoryId?: string
  cityId?: string
  query?: string
}

export function useFeedAds({
  listings,
  placement,
  enabled = true,
  categoryId,
  subcategoryId,
  cityId,
  query,
}: UseFeedAdsOptions) {
  const [items, setItems] = useState<FeedItem[]>(() =>
    listings.map((listing) => ({ type: "listing" as const, listing })),
  )
  const [device, setDevice] = useState<AdDevice>("MOBILE")

  useEffect(() => {
    setDevice(detectDevice())
    const onResize = () => setDevice(detectDevice())
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const interval = useMemo(
    () => getFeedAdInterval(placement, device === "DESKTOP" ? "DESKTOP" : "MOBILE"),
    [placement, device],
  )

  const adCount = useMemo(
    () => (listings.length > 0 ? Math.min(8, Math.floor(listings.length / interval)) : 0),
    [interval, listings.length],
  )

  useEffect(() => {
    if (!enabled || listings.length === 0) {
      setItems(listings.map((listing) => ({ type: "listing" as const, listing })))
      return
    }

    let cancelled = false

    ;(async () => {
      try {
        const res = await fetch("/api/ads/select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            placement,
            categoryId,
            subcategoryId,
            cityId,
            query,
            device,
            sessionId: getClientAdSessionId(),
            count: Math.max(adCount, 1),
          }),
        })
        if (!res.ok) throw new Error("ads select failed")
        const data = await res.json()
        const ads = data.ads ?? []
        if (cancelled) return
        setItems(
          insertAdsIntoFeed(listings, ads, {
            interval,
            placementKey: placement,
          }),
        )
      } catch {
        if (!cancelled) {
          setItems(listings.map((listing) => ({ type: "listing" as const, listing })))
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    adCount,
    categoryId,
    cityId,
    device,
    enabled,
    interval,
    listings,
    placement,
    query,
    subcategoryId,
  ])

  return { items, device, sessionId: getClientAdSessionId() }
}
