import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { logAdCampaignChange, serializeCampaignForClient } from "@/lib/ads/campaign-service"

export const dynamic = "force-dynamic"

const bodySchema = z.object({
  action: z.enum(["pause", "resume", "finish", "duplicate", "submit_payment"]),
})

function campaignId(req: NextRequest) {
  const parts = req.nextUrl.pathname.split("/").filter(Boolean)
  return parts[parts.length - 2] ?? ""
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const id = campaignId(req)
  const campaign = await prisma.adCampaign.findFirst({ where: { id, ownerId: user.id } })
  if (!campaign) return NextResponse.json({ error: "Не найдено" }, { status: 404 })

  const { action } = bodySchema.parse(await req.json())

  if (action === "duplicate") {
    const copy = await prisma.adCampaign.create({
      data: {
        ownerId: user.id,
        title: `${campaign.title} (копия)`,
        description: campaign.description,
        imageUrl: campaign.imageUrl,
        targetUrl: campaign.targetUrl,
        ctaText: campaign.ctaText,
        label: campaign.label,
        city: campaign.city,
        companyName: campaign.companyName,
        phone: campaign.phone,
        type: campaign.type,
        placements: campaign.placements,
        status: "DRAFT",
        categoryIds: campaign.categoryIds,
        subcategoryIds: campaign.subcategoryIds,
        cityIds: campaign.cityIds,
        regionIds: campaign.regionIds,
        districtIds: campaign.districtIds,
        device: campaign.device,
        keywords: campaign.keywords,
        interests: campaign.interests,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        pricingModel: campaign.pricingModel,
        budget: campaign.budget,
        dailyBudget: campaign.dailyBudget,
        spent: 0,
        impressions: 0,
        clicks: 0,
        moderationNote: null,
        maxImpressionsPerUserPerDay: campaign.maxImpressionsPerUserPerDay,
        maxImpressionsPerSession: campaign.maxImpressionsPerSession,
      },
    })
    return NextResponse.json({ campaign: serializeCampaignForClient(copy) })
  }

  let status = campaign.status

  if (action === "pause") {
    if (campaign.status !== "ACTIVE") {
      return NextResponse.json({ error: "Можно приостановить только активную кампанию" }, { status: 409 })
    }
    status = "PAUSED"
  } else if (action === "resume") {
    if (campaign.status !== "PAUSED") {
      return NextResponse.json({ error: "Можно возобновить только приостановленную кампанию" }, { status: 409 })
    }
    const paid = await prisma.adPayment.findFirst({
      where: { adCampaignId: id, status: "PAID" },
    })
    if (!paid) {
      return NextResponse.json({ error: "Нет подтверждённой оплаты" }, { status: 409 })
    }
    status = "ACTIVE"
  } else if (action === "finish") {
    status = "FINISHED"
  } else if (action === "submit_payment") {
    status = "WAITING_PAYMENT"
  }

  const updated = await prisma.adCampaign.update({
    where: { id },
    data: { status },
  })

  await logAdCampaignChange(prisma, {
    adCampaignId: id,
    userId: user.id,
    action,
    oldValue: { status: campaign.status },
    newValue: { status },
  })

  return NextResponse.json({ campaign: serializeCampaignForClient(updated) })
}
