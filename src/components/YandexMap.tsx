"use client"

import { useEffect, useRef, useState } from "react"

declare global {
  interface Window {
    ymaps3: {
      ready: Promise<void>
      YMap: new (container: HTMLElement, options: object) => {
        addChild: (child: unknown) => void
      }
      YMapDefaultSchemeLayer: new (opts: object) => unknown
      YMapDefaultFeaturesLayer: new (opts: object) => unknown
      YMapMarker: new (opts: object, element: HTMLElement) => unknown
    }
  }
}

type Props = {
  lat: number
  lng: number
  zoom?: number
  className?: string
}

export function YandexMap({ lat, lng, zoom = 14, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<unknown>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(false)

  const apiKey = process.env.NEXT_PUBLIC_YMAPS_KEY

  useEffect(() => {
    if (!apiKey || !containerRef.current) { setError(!apiKey); return }

    // If already loaded
    if (window.ymaps3) {
      setReady(true)
      return
    }

    // Check if script already injected
    const existing = document.querySelector('script[data-ymaps3]')
    if (existing) {
      const check = setInterval(() => {
        if (window.ymaps3) { clearInterval(check); setReady(true) }
      }, 100)
      return
    }

    const script = document.createElement("script")
    script.src = `https://api-maps.yandex.ru/v3/?apikey=${apiKey}&lang=ru_RU`
    script.setAttribute("data-ymaps3", "1")
    script.onload = () => setReady(true)
    script.onerror = () => setError(true)
    document.head.appendChild(script)
  }, [apiKey])

  useEffect(() => {
    if (!ready || !containerRef.current || mapRef.current) return

    window.ymaps3.ready.then(() => {
      const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapMarker } = window.ymaps3

      const map = new YMap(containerRef.current!, {
        location: { center: [lng, lat], zoom },
      })
      map.addChild(new YMapDefaultSchemeLayer({}))
      map.addChild(new YMapDefaultFeaturesLayer({}))

      const pin = document.createElement("div")
      pin.innerHTML = `<div style="font-size:36px;transform:translateX(-50%) translateY(-100%);filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">📍</div>`
      map.addChild(new YMapMarker({ coordinates: [lng, lat] }, pin))

      mapRef.current = map
    })
  }, [ready, lat, lng, zoom])

  if (!apiKey) return null
  if (error) return (
    <div className={`flex items-center justify-center rounded-3xl bg-zinc-100 text-sm text-zinc-400 ${className ?? "h-52"}`}>
      Карта недоступна
    </div>
  )

  return <div ref={containerRef} className={`overflow-hidden rounded-3xl ${className ?? "h-52 w-full"}`} />
}

// Address geocoder hook
export function useGeocode() {
  async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const res = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`)
      if (!res.ok) return null
      return await res.json()
    } catch {
      return null
    }
  }
  return { geocode }
}
