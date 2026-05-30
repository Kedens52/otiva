export type GeocodeAddressInput = {
  city?: string | null
  district?: string | null
  address?: string | null
}

export type GeocodeAddressResult = {
  latitude: number | null
  longitude: number | null
  city: string | null
  district: string | null
  formattedAddress: string | null
}

function getGeocoderApiKey() {
  return (
    process.env.YANDEX_MAPS_API_KEY?.trim() ||
    process.env.YMAPS_GEOCODER_KEY?.trim() ||
    process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY?.trim() ||
    ""
  )
}

function parsePointPosition(value: unknown) {
  if (typeof value !== "string") return null
  const [lngRaw, latRaw] = value.split(" ")
  const latitude = Number.parseFloat(latRaw ?? "")
  const longitude = Number.parseFloat(lngRaw ?? "")
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  return { latitude, longitude }
}

function collectAddressParts(input: GeocodeAddressInput) {
  return [input.city, input.district, input.address]
    .map((part) => part?.trim())
    .filter(Boolean) as string[]
}

function pickAddressComponent(components: unknown, kind: string) {
  if (!Array.isArray(components)) return null
  const match = components.find((component) => {
    if (!component || typeof component !== "object") return false
    const value = component as { kind?: unknown; name?: unknown }
    return value.kind === kind && typeof value.name === "string" && value.name.trim()
  }) as { name?: string } | undefined
  return match?.name?.trim() || null
}

export function isGeocodingConfigured() {
  return Boolean(getGeocoderApiKey())
}

export async function geocodeAddress(
  input: GeocodeAddressInput,
): Promise<GeocodeAddressResult | null> {
  const apiKey = getGeocoderApiKey()
  const query = collectAddressParts(input).join(", ")
  if (!apiKey || !query) return null

  const url =
    `https://geocode-maps.yandex.ru/1.x/?format=json&results=1&lang=ru_RU` +
    `&apikey=${encodeURIComponent(apiKey)}` +
    `&geocode=${encodeURIComponent(query)}`

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  })
  if (!response.ok) {
    throw new Error(`Geocoder request failed with ${response.status}`)
  }

  const data = await response.json()
  const geoObject =
    data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject ?? null
  if (!geoObject) return null

  const coords = parsePointPosition(geoObject?.Point?.pos)
  const components = geoObject?.metaDataProperty?.GeocoderMetaData?.Address?.Components
  const formattedAddress =
    typeof geoObject?.metaDataProperty?.GeocoderMetaData?.text === "string"
      ? geoObject.metaDataProperty.GeocoderMetaData.text
      : null

  return {
    latitude: coords?.latitude ?? null,
    longitude: coords?.longitude ?? null,
    city: pickAddressComponent(components, "locality") ?? input.city?.trim() ?? null,
    district:
      pickAddressComponent(components, "district") ??
      pickAddressComponent(components, "area") ??
      input.district?.trim() ??
      null,
    formattedAddress,
  }
}
