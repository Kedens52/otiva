"use client"

import { useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  getStoredCity,
  isCityFilterActive,
  NASHLO_CITY_CHANGE_EVENT,
} from "@/lib/city-selection"
import { WANT_TO_BUY_PUBLIC_BASE } from "@/config/want-to-buy-brand"

/** Подставляет город из шапки/хранилища в query ленты «Куплю», если в URL его ещё нет. */
export function WantToBuyCityParamSync() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (pathname !== WANT_TO_BUY_PUBLIC_BASE) return

    function sync() {
      const stored = getStoredCity()
      if (!isCityFilterActive(stored)) return
      if (searchParams.get("city") === stored) return
      const params = new URLSearchParams(searchParams.toString())
      params.set("city", stored)
      const q = params.toString()
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false })
    }

    sync()
    window.addEventListener(NASHLO_CITY_CHANGE_EVENT, sync)
    return () => window.removeEventListener(NASHLO_CITY_CHANGE_EVENT, sync)
  }, [pathname, router, searchParams])

  return null
}
