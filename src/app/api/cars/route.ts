import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { getListings } from "@/lib/listings/get-listings"

export const dynamic = "force-dynamic"

/** Те же фильтры и поиск, что GET /api/listings?category=cars */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const data = await getListings(prisma, request.nextUrl.searchParams, {
      forcedCategorySlug: "cars",
      currentUserId: user?.id ?? null,
    })
    return NextResponse.json(data)
  } catch (error) {
    console.error("cars GET error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
