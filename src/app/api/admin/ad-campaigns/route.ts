import { NextResponse } from "next/server"
import { z } from "zod"
import { AdDevice, AdPlacement, AdPricingModel, AdStatus, AdType } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { withAdminApi } from "@/lib/admin/guards"
import { sanitizeAdTargetUrl } from "@/lib/ads/url-safety"

export const dynamic = "force-dynamic"

const campaignSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2).max(120),
  description: z.string().max(2000).optional().nullable(),
  imageUrl: z.string().max(2_500_000).optional().nullable(),
  targetUrl: z.string().min(1).max(2000),
  ctaText: z.string().max(80).optional().nullable(),
  label: z.string().max(80).optional().nullable(),
  companyName: z.string().max(120).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  pricingModel: z.nativeEnum(AdPricingModel).optional(),
  type: z.nativeEnum(AdType),
  placements: z.array(z.nativeEnum(AdPlacement)).min(1),
  status: z.nativeEnum(AdStatus),
  categoryIds: z.array(z.string()).default([]),
  subcategoryIds: z.array(z.string()).default([]),
  cityIds: z.array(z.string()).default([]),
  regionIds: z.array(z.string()).default([]),
  districtIds: z.array(z.string()).default([]),
  device: z.nativeEnum(AdDevice),
  keywords: z.array(z.string()).default([]),
  interests: z.array(z.string()).default([]),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  budget: z.number().int().nonnegative().optional().nullable(),
  dailyBudget: z.number().int().nonnegative().optional().nullable(),
  maxImpressionsPerUserPerDay: z.number().int().min(1).max(100).default(10),
  maxImpressionsPerSession: z.number().int().min(1).max(20).default(3),
})

function parseDate(value?: string | null) {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export const GET = withAdminApi(async () => {
  const campaigns = await prisma.adCampaign.findMany({
    orderBy: { updatedAt: "desc" },
    take: 200,
  })
  return NextResponse.json({ campaigns })
}, "settings.view")

export const POST = withAdminApi(async ({ req }) => {
  const input = campaignSchema.parse(await req.json())
  const safe = sanitizeAdTargetUrl(input.targetUrl)
  if (!safe.ok) {
    return NextResponse.json({ error: "Недопустимая ссылка" }, { status: 400 })
  }

  const data = {
    title: input.title,
    description: input.description,
    imageUrl: input.imageUrl,
    targetUrl: safe.url,
    ctaText: input.ctaText,
    label: input.label,
    companyName: input.companyName,
    phone: input.phone,
    city: input.city,
    pricingModel: input.pricingModel ?? "FIXED",
    type: input.type,
    placements: input.placements,
    status: input.status,
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
    budget: input.budget,
    dailyBudget: input.dailyBudget,
    maxImpressionsPerUserPerDay: input.maxImpressionsPerUserPerDay,
    maxImpressionsPerSession: input.maxImpressionsPerSession,
  }

  const campaign = input.id
    ? await prisma.adCampaign.update({ where: { id: input.id }, data })
    : await prisma.adCampaign.create({ data })

  return NextResponse.json({ campaign })
}, "settings.manage")
