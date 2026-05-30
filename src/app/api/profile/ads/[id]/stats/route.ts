import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { calcCtr } from "@/lib/ads/campaign-status"

export const dynamic = "force-dynamic"

function campaignId(req: NextRequest) {
  return req.nextUrl.pathname.split("/").filter(Boolean).at(-2) ?? ""
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const id = campaignId(req)
  const campaign = await prisma.adCampaign.findFirst({
    where: { id, ownerId: user.id },
  })
  if (!campaign) return NextResponse.json({ error: "Не найдено" }, { status: 404 })

  const events = await prisma.adEvent.findMany({
    where: { adId: id, eventType: { in: ["IMPRESSION", "CLICK"] } },
    select: {
      eventType: true,
      createdAt: true,
      categoryId: true,
      cityId: true,
      device: true,
      placement: true,
    },
    orderBy: { createdAt: "asc" },
    take: 5000,
  })

  const byDay = new Map<string, { impressions: number; clicks: number }>()
  const byCategory = new Map<string, number>()
  const byCity = new Map<string, number>()
  const byDevice = new Map<string, number>()
  const byPlacement = new Map<string, number>()

  for (const e of events) {
    const day = e.createdAt.toISOString().slice(0, 10)
    const row = byDay.get(day) ?? { impressions: 0, clicks: 0 }
    if (e.eventType === "IMPRESSION") row.impressions += 1
    if (e.eventType === "CLICK") row.clicks += 1
    byDay.set(day, row)

    if (e.eventType === "CLICK") {
      if (e.categoryId) byCategory.set(e.categoryId, (byCategory.get(e.categoryId) ?? 0) + 1)
      if (e.cityId) byCity.set(e.cityId, (byCity.get(e.cityId) ?? 0) + 1)
      if (e.device) byDevice.set(e.device, (byDevice.get(e.device) ?? 0) + 1)
      if (e.placement) byPlacement.set(e.placement, (byPlacement.get(e.placement) ?? 0) + 1)
    }
  }

  const top = (map: Map<string, number>) =>
    [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([key, count]) => ({ key, count }))

  return NextResponse.json({
    summary: {
      impressions: campaign.impressions,
      clicks: campaign.clicks,
      ctr: calcCtr(campaign.impressions, campaign.clicks),
      spent: campaign.spent,
      budget: campaign.budget,
      budgetRemaining: campaign.budget != null ? Math.max(0, campaign.budget - campaign.spent) : null,
    },
    byDay: [...byDay.entries()].map(([date, v]) => ({ date, ...v })),
    topCategories: top(byCategory),
    topCities: top(byCity),
    topDevices: top(byDevice),
    topPlacements: top(byPlacement),
  })
}
