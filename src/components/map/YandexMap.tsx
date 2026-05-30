"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { MapPlaceholder } from "@/components/map/MapPlaceholder"

type YMaps3Global = {
  ready: Promise<void>
  YMap: new (
    container: HTMLElement,
    options: { location: { center: [number, number]; zoom: number } },
  ) => {
    addChild: (child: unknown) => void
    destroy?: () => void
  }
  YMapDefaultSchemeLayer: new (opts: object) => unknown
  YMapDefaultFeaturesLayer: new (opts: object) => unknown
  YMapMarker: new (
    opts: { coordinates: [number, number] },
    element: HTMLElement,
  ) => unknown
}

declare global {
  interface Window {
    ymaps3?: YMaps3Global
    __nashloYandexMapsPromise?: Promise<YMaps3Global>
  }
}

export type YandexMapMarker = {
  id: string
  title: string
  latitude: number
  longitude: number
  isActive?: boolean
}

type YandexMapProps = {
  apiKey: string
  markers: YandexMapMarker[]
  center?: [number, number]
  zoom?: number
  className?: string
  onMarkerClick?: (markerId: string) => void
}

function loadYandexMaps(apiKey: string): Promise<YMaps3Global> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Yandex Maps is only available in the browser"))
  }

  if (window.ymaps3) {
    return window.ymaps3.ready.then(() => window.ymaps3 as YMaps3Global)
  }

  if (window.__nashloYandexMapsPromise) {
    return window.__nashloYandexMapsPromise
  }

  window.__nashloYandexMapsPromise = new Promise<YMaps3Global>((resolve, reject) => {
    const finish = () => {
      if (!window.ymaps3) {
        reject(new Error("Yandex Maps API did not initialize"))
        return
      }
      window.ymaps3.ready
        .then(() => resolve(window.ymaps3 as YMaps3Global))
        .catch(reject)
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-nashlo-yandex-maps="1"]',
    )

    if (existing) {
      if (existing.dataset.loaded === "1") {
        finish()
        return
      }
      existing.addEventListener("load", finish, { once: true })
      existing.addEventListener("error", () => reject(new Error("Failed to load Yandex Maps API")), {
        once: true,
      })
      return
    }

    const script = document.createElement("script")
    script.src = `https://api-maps.yandex.ru/v3/?apikey=${encodeURIComponent(apiKey)}&lang=ru_RU`
    script.async = true
    script.dataset.nashloYandexMaps = "1"
    script.onload = () => {
      script.dataset.loaded = "1"
      finish()
    }
    script.onerror = () => reject(new Error("Failed to load Yandex Maps API"))
    document.head.appendChild(script)
  })

  return window.__nashloYandexMapsPromise
}

function toYandexCenter(
  center: [number, number] | undefined,
  markers: YandexMapMarker[],
): [number, number] {
  if (center) {
    return [center[1], center[0]]
  }

  if (!markers.length) {
    return [37.617635, 55.755814]
  }

  const sums = markers.reduce(
    (acc, marker) => {
      acc.lat += marker.latitude
      acc.lng += marker.longitude
      return acc
    },
    { lat: 0, lng: 0 },
  )

  return [sums.lng / markers.length, sums.lat / markers.length]
}

function createMarkerElement(marker: YandexMapMarker, onMarkerClick?: (markerId: string) => void) {
  const button = document.createElement("button")
  button.type = "button"
  button.setAttribute("aria-label", marker.title)
  button.style.width = "18px"
  button.style.height = "18px"
  button.style.border = "2px solid white"
  button.style.borderRadius = "999px"
  button.style.background = marker.isActive ? "#18181b" : "#f97316"
  button.style.boxShadow = "0 4px 12px rgba(15,23,42,0.22)"
  button.style.transform = "translate(-50%, -50%)"
  button.style.cursor = "pointer"
  button.addEventListener("click", () => onMarkerClick?.(marker.id))
  return button
}

export function YandexMap({
  apiKey,
  markers,
  center,
  zoom = 11,
  className,
  onMarkerClick,
}: YandexMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loadError, setLoadError] = useState(false)

  const resolvedCenter = useMemo(() => toYandexCenter(center, markers), [center, markers])
  const markerSignature = useMemo(
    () =>
      JSON.stringify(
        markers.map((marker) => ({
          id: marker.id,
          latitude: marker.latitude,
          longitude: marker.longitude,
          isActive: marker.isActive ?? false,
        })),
      ),
    [markers],
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container || !apiKey || markers.length === 0) return

    let cancelled = false
    let destroyMap: (() => void) | undefined
    setLoadError(false)
    container.innerHTML = ""

    loadYandexMaps(apiKey)
      .then((ymaps3) => {
        if (cancelled || !container) return

        const map = new ymaps3.YMap(container, {
          location: {
            center: resolvedCenter,
            zoom,
          },
        })
        map.addChild(new ymaps3.YMapDefaultSchemeLayer({}))
        map.addChild(new ymaps3.YMapDefaultFeaturesLayer({}))

        for (const marker of markers) {
          const element = createMarkerElement(marker, onMarkerClick)
          map.addChild(
            new ymaps3.YMapMarker(
              { coordinates: [marker.longitude, marker.latitude] },
              element,
            ),
          )
        }

        destroyMap = map.destroy?.bind(map)
      })
      .catch(() => {
        if (!cancelled) setLoadError(true)
      })

    return () => {
      cancelled = true
      destroyMap?.()
      container.innerHTML = ""
    }
  }, [apiKey, markerSignature, markers, onMarkerClick, resolvedCenter, zoom])

  if (loadError) {
    return (
      <MapPlaceholder
        title="Карта в разработке"
        description="Сейчас можно искать по городу и району. Карта появится, когда у объявлений будут координаты и карта загрузится корректно."
        className={className}
      />
    )
  }

  return (
    <div
      ref={containerRef}
      className={`min-h-[320px] w-full overflow-hidden rounded-[28px] bg-zinc-100 ${className ?? ""}`}
    />
  )
}
