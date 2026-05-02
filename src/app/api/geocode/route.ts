import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address')
  if (!address) return NextResponse.json({ error: 'Address required' }, { status: 400 })

  const apiKey = process.env.YMAPS_GEOCODER_KEY
  if (!apiKey) return NextResponse.json({ error: 'Geocoder not configured' }, { status: 503 })

  try {
    const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&geocode=${encodeURIComponent(address)}&format=json&results=1&lang=ru_RU`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    const data = await res.json()

    const pos = data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject?.Point?.pos
    if (!pos) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const [lngStr, latStr] = pos.split(' ')
    return NextResponse.json({ lat: parseFloat(latStr), lng: parseFloat(lngStr) })
  } catch (err) {
    console.error('geocode error', err)
    return NextResponse.json({ error: 'Geocoder error' }, { status: 500 })
  }
}
