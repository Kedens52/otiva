"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { MapPlaceholder } from "@/components/map/MapPlaceholder"
import { YandexMap } from "@/components/map/YandexMap"

export type ListingMapItem = {
  id: string
  title: string
  price?: number | null
  city?: string | null
  district?: string | null
  address?: string | null
  latitude?: number | null
  longitude?: number | null
  imageUrl?: string | null
  href: string
  showExactAddress?: boolean
}

type ListingMapProps = {
  listings: ListingMapItem[]
  center?: [number, number]
  zoom?: number
  className?: string
}

function formatPrice(price?: number | null) {
  if (price == null) return "Цена по запросу"
  if (price === 0) return "Бесплатно"
  return `${price.toLocaleString("ru-RU")} ₽`
}

export function ListingMap({
  listings,
  center,
  zoom = 11,
  className,
}: ListingMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY?.trim()

  const itemsWithCoordinates = useMemo(
    () =>
      listings.filter(
        (listing): listing is ListingMapItem & { latitude: number; longitude: number } =>
          typeof listing.latitude === "number" &&
          Number.isFinite(listing.latitude) &&
          typeof listing.longitude === "number" &&
          Number.isFinite(listing.longitude),
      ),
    [listings],
  )

  const [selectedId, setSelectedId] = useState<string | null>(
    itemsWithCoordinates[0]?.id ?? null,
  )

  const selectedListing =
    itemsWithCoordinates.find((listing) => listing.id === selectedId) ??
    itemsWithCoordinates[0] ??
    null

  if (!apiKey) {
    return (
      <MapPlaceholder
        title="Карта в разработке"
        description="Пока можно искать по городу и району. Карта появится, когда у объявлений будут координаты."
        className={className}
      />
    )
  }

  if (itemsWithCoordinates.length === 0) {
    return (
      <MapPlaceholder
        title="Карта в разработке"
        description="Пока можно искать по городу и району. Карта появится, когда у объявлений будут координаты."
        className={className}
      />
    )
  }

  return (
    <div className={`relative ${className ?? ""}`}>
      <YandexMap
        apiKey={apiKey}
        zoom={zoom}
        center={center}
        markers={itemsWithCoordinates.map((listing) => ({
          id: listing.id,
          title: listing.title,
          latitude: listing.latitude,
          longitude: listing.longitude,
          isActive: listing.id === selectedListing?.id,
        }))}
        onMarkerClick={setSelectedId}
      />

      {selectedListing ? (
        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 sm:left-4 sm:right-auto sm:max-w-sm">
          <div className="pointer-events-auto rounded-[24px] border border-zinc-200 bg-white p-4 shadow-xl shadow-zinc-950/10">
            <div className="flex gap-3">
              {selectedListing.imageUrl ? (
                <img
                  src={selectedListing.imageUrl}
                  alt={selectedListing.title}
                  className="h-16 w-16 shrink-0 rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-2xl">
                  📍
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-semibold text-zinc-950">
                  {selectedListing.title}
                </p>
                <p className="mt-1 text-sm font-bold text-zinc-950">
                  {formatPrice(selectedListing.price)}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {[selectedListing.city, selectedListing.district].filter(Boolean).join(", ") || "Без уточнения города"}
                </p>
                {selectedListing.showExactAddress && selectedListing.address ? (
                  <p className="mt-1 line-clamp-1 text-xs text-zinc-400">
                    {selectedListing.address}
                  </p>
                ) : selectedListing.address || selectedListing.district ? (
                  <p className="mt-1 line-clamp-1 text-xs text-zinc-400">
                    Местоположение указано приблизительно
                  </p>
                ) : null}
              </div>
            </div>
            <Link
              href={selectedListing.href}
              className="mt-3 inline-flex rounded-xl bg-[hsl(var(--nashlo-orange))] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[hsl(var(--nashlo-orange)/0.92)]"
            >
              Открыть
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  )
}
