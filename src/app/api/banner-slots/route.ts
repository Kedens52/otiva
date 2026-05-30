import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { pickActiveAds, serializeBannerSlotAd } from "@/lib/banner-slot-ads"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const rows = await prisma.bannerSlotAd.findMany({
      where: { active: true, status: "approved" },
      orderBy: { updatedAt: "desc" },
    })
    const ads = rows.map(serializeBannerSlotAd)
    return NextResponse.json(
      { slots: pickActiveAds(ads) },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0, must-revalidate",
        },
      },
    )
  } catch (error) {
    console.warn("banner-slots GET unavailable:", error)
    return NextResponse.json({ slots: {} })
  }
}
