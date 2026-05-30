import { NextRequest, NextResponse } from "next/server"
import { getPublicUserBadges } from "@/lib/badges/get-public-badges"

export const dynamic = "force-dynamic"

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userId = decodeURIComponent(params.id ?? "").trim()
    if (!userId) {
      return NextResponse.json({ error: "Некорректный id" }, { status: 400 })
    }
    const badges = await getPublicUserBadges(userId)
    return NextResponse.json(badges)
  } catch (error) {
    console.error("GET /api/users/[id]/badges:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
