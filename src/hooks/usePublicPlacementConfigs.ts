"use client"

import { useEffect, useState } from "react"
import type { PublicPlacementRow } from "@/lib/ads/placement-requirements"

export function usePublicPlacementConfigs() {
  const [placements, setPlacements] = useState<PublicPlacementRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch("/api/ad-placements", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { placements: [] }))
      .then((d) => {
        if (!cancelled) setPlacements(d.placements ?? [])
      })
      .catch(() => {
        if (!cancelled) setPlacements([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { placements, loading }
}
