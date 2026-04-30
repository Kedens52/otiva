import { NextResponse } from "next/server"
import { getListingsByCategory } from "@/lib/mock-marketplace"

export async function GET() {
  return NextResponse.json({
    listings: getListingsByCategory("cars"),
  })
}
