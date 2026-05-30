import { NextRequest, NextResponse } from "next/server"
import { geocodeAddress, isGeocodingConfigured } from "@/lib/geo/geocode"

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address")
  const city = request.nextUrl.searchParams.get("city")
  const district = request.nextUrl.searchParams.get("district")
  if (!address && !district) {
    return NextResponse.json({ error: "Address required" }, { status: 400 })
  }

  if (!isGeocodingConfigured()) {
    return NextResponse.json({
      available: false,
      inDevelopment: true,
      message: "В разработке",
    })
  }

  try {
    const result = await geocodeAddress({ city, district, address })
    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json({
      available: true,
      latitude: result.latitude,
      longitude: result.longitude,
      city: result.city,
      district: result.district,
      formattedAddress: result.formattedAddress,
      lat: result.latitude,
      lng: result.longitude,
    })
  } catch (err) {
    console.error("geocode error", err)
    return NextResponse.json({ error: "Geocoder error" }, { status: 500 })
  }
}
