"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { fetchPublicBannerSlots, type AdSlotId, type ManagedAd } from "@/lib/ad-store"

type BannerSlotsState = {
  slots: Partial<Record<AdSlotId, ManagedAd>>
  ready: boolean
  refresh: () => Promise<void>
}

const BannerSlotsContext = createContext<BannerSlotsState | null>(null)

const REFRESH_MS = 60_000

export function BannerSlotsProvider({ children }: { children: ReactNode }) {
  const [slots, setSlots] = useState<Partial<Record<AdSlotId, ManagedAd>>>({})
  const [ready, setReady] = useState(false)
  const loadingRef = useRef(false)

  const load = useCallback(async () => {
    if (loadingRef.current) return
    loadingRef.current = true
    try {
      const next = await fetchPublicBannerSlots()
      setSlots(next)
    } catch {
      setSlots({})
    } finally {
      setReady(true)
      loadingRef.current = false
    }
  }, [])

  useEffect(() => {
    void load()
    const interval = window.setInterval(() => void load(), REFRESH_MS)
    return () => window.clearInterval(interval)
  }, [load])

  const value = useMemo(
    () => ({
      slots,
      ready,
      refresh: load,
    }),
    [slots, ready, load],
  )

  return <BannerSlotsContext.Provider value={value}>{children}</BannerSlotsContext.Provider>
}

export function useBannerSlots() {
  const ctx = useContext(BannerSlotsContext)
  if (!ctx) {
    throw new Error("useBannerSlots must be used within BannerSlotsProvider")
  }
  return ctx
}

export function useBannerSlot(slot: AdSlotId): { ad: ManagedAd | null; ready: boolean } {
  const { slots, ready } = useBannerSlots()
  return { ad: slots[slot] ?? null, ready }
}
