import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { AdDevice, AdPlacement, AdPricingModel, AdType } from "@prisma/client"
import { buildCampaignMediaData, campaignMediaInputSchema } from "@/lib/ads/campaign-media-input"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { getFormatById } from "@/lib/ads/ad-formats"
import {
  logAdCampaignChange,
  serializeCampaignForClient,
  validateCampaignTargetUrl,
} from "@/lib/ads/campaign-service"

export const dynamic = "force-dynamic"

const createSchema = z.object({
  formatId: z.string(),
  title: z.string().min(2).max(120),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().max(500).optional(),
  targetUrl: z.string().min(1).max(2000),
  ctaText: z.string().max(80).optional(),
  companyName: z.string().max(120).optional(),
  phone: z.string().max(30).optional(),
  city: z.string().max(100).optional(),
  categoryIds: z.array(z.string()).default([]),
  subcategoryIds: z.array(z.string()).default([]),
  cityIds: z.array(z.string()).default([]),
  regionIds: z.array(z.string()).default([]),
  districtIds: z.array(z.string()).default([]),
  device: z.nativeEnum(AdDevice).default("ALL"),
  keywords: z.array(z.string()).default([]),
  interests: z.array(z.string()).default([]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  pricingModel: z.nativeEnum(AdPricingModel).default("FIXED"),
  budget: z.number().int().positive(),
  dailyBudget: z.number().int().positive().optional(),
  placements: z.array(z.nativeEnum(AdPlacement)).optional(),
  type: z.nativeEnum(AdType).optional(),
  submitForPayment: z.boolean().optional(),
}).merge(campaignMediaInputSchema)

function parseDate(value?: string) {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const campaigns = await prisma.adCampaign.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json({
    campaigns: campaigns.map(serializeCampaignForClient),
  })
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  try {
    const input = createSchema.parse(await request.json())
    const format = getFormatById(input.formatId)
    const safe = validateCampaignTargetUrl(input.targetUrl)
    if (!safe.ok) {
      return NextResponse.json({ error: "Недопустимая ссылка" }, { status: 400 })
    }

    const type = input.type ?? format?.type ?? "NATIVE_CARD"
    const placements = input.placements?.length
      ? input.placements
      : format?.placements ?? ["MOBILE_FEED_INLINE"]

    const status = input.submitForPayment ? "WAITING_PAYMENT" : "DRAFT"
    const mediaData = buildCampaignMediaData(input)

    const campaign = await prisma.adCampaign.create({
      data: {
        ownerId: user.id,
        title: input.title,
        description: input.description,
        ...mediaData,
        targetUrl: safe.url,
        ctaText: input.ctaText,
        companyName: input.companyName,
        phone: input.phone,
        city: input.city,
        type,
        placements,
        status,
        categoryIds: input.categoryIds,
        subcategoryIds: input.subcategoryIds,
        cityIds: input.cityIds,
        regionIds: input.regionIds,
        districtIds: input.districtIds,
        device: input.device,
        keywords: input.keywords,
        interests: input.interests,
        startDate: parseDate(input.startDate),
        endDate: parseDate(input.endDate),
        pricingModel: input.pricingModel,
        budget: input.budget,
        dailyBudget: input.dailyBudget,
      },
    })

    await logAdCampaignChange(prisma, {
      adCampaignId: campaign.id,
      userId: user.id,
      action: "created",
      newValue: { status: campaign.status },
    })

    return NextResponse.json({ campaign: serializeCampaignForClient(campaign) })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message ?? "Ошибка данных" }, { status: 400 })
    }
    console.error("[profile/ads POST]", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
