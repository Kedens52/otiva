"use client"

import dynamic from "next/dynamic"
import { MapPlaceholder } from "@/components/map/MapPlaceholder"
import type { ListingMapItem } from "@/components/map/ListingMap"

type ClientMapProps = {
  listings: ListingMapItem[]
  center?: [number, number]
  zoom?: number
  className?: string
}

const DynamicListingMap = dynamic(
  () => import("@/components/map/ListingMap").then((mod) => mod.ListingMap),
  {
    ssr: false,
    loading: () => (
      <MapPlaceholder
        title="Загрузка карты"
        description="Подготавливаем карту объявлений."
      />
    ),
  },
)

export function ClientMap(props: ClientMapProps) {
  return <DynamicListingMap {...props} />
}
