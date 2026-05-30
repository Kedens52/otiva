import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getMarketPriceEstimate } from "@/lib/market-price/service"

export const dynamic = "force-dynamic"

const schema = z.object({
  category: z.string().min(1),
  subcategory: z.string().optional(),
  price: z.number().min(0).max(1_000_000_000),
  city: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
  attributes: z.record(z.unknown()).optional(),
  excludeListingId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = schema.parse(body)

    const result = await getMarketPriceEstimate({
      categorySlug: data.category,
      subcategory: data.subcategory,
      price: data.price,
      city: data.city,
      region: data.region,
      attributes: data.attributes,
      excludeListingId: data.excludeListingId,
    })

    return NextResponse.json({
      status: result.status,
      range: result.range
        ? {
            min: result.range.min,
            max: result.range.max,
            median: result.range.median,
            p25: result.range.p25,
            p75: result.range.p75,
          }
        : null,
      sampleSize: result.sampleSize,
      confidence: result.confidence,
      message: result.message,
      reasonsRequired: result.reasonsRequired,
      comparableListingsCount: result.comparableListingsCount,
      buyerHint: result.buyerHint ?? null,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message ?? "Неверные данные" }, { status: 400 })
    }
    console.error("market-price estimate error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
