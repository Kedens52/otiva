import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { AdDevice, AdPlacement, AdType } from "@prisma/client"
import { buildCampaignMediaData, campaignMediaInputSchema } from "@/lib/ads/campaign-media-input"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import {
  logAdCampaignChange,
  resolveStatusAfterUserEdit,
  serializeCampaignForClient,
  USER_EDITABLE_STATUSES,
  validateCampaignTargetUrl,
} from "@/lib/ads/campaign-service"

export const dynamic = "force-dynamic"

const patchSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  description: z.string().max(2000).optional().nullable(),
  imageUrl: z.string().max(500).optional().nullable(),
  targetUrl: z.string().min(1).max(2000).optional(),
  ctaText: z.string().max(80).optional().nullable(),
  companyName: z.string().max(120).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  type: z.nativeEnum(AdType).optional(),
  placements: z.array(z.nativeEnum(AdPlacement)).optional(),
  categoryIds: z.array(z.string()).optional(),
  subcategoryIds: z.array(z.string()).optional(),
  cityIds: z.array(z.string()).optional(),
  regionIds: z.array(z.string()).optional(),
  districtIds: z.array(z.string()).optional(),
  device: z.nativeEnum(AdDevice).optional(),
  keywords: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  budget: z.number().int().positive().optional(),
  dailyBudget: z.number().int().positive().optional().nullable(),
}).merge(campaignMediaInputSchema)

function parseDate(value?: string | null) {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

const MEDIA_PATCH_KEYS = [
  "mediaType",
  "mediaUrl",
  "mediaPosterUrl",
  "mediaAlt",
  "mediaWidth",
  "mediaHeight",
  "mediaDuration",
  "mediaSize",
  "mediaMimeType",
  "imageUrl",
] as const

function campaignId(req: NextRequest) {
  return req.nextUrl.pathname.split("/").filter(Boolean).at(-1) ?? ""
}

async function loadOwned(id: string, userId: string) {
  return prisma.adCampaign.findFirst({ where: { id, ownerId: userId } })
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const campaign = await loadOwned(campaignId(req), user.id)
  if (!campaign) return NextResponse.json({ error: "Не найдено" }, { status: 404 })

  const [payments, changeLogs] = await Promise.all([
    prisma.adPayment.findMany({
      where: { adCampaignId: campaign.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.adCampaignChangeLog.findMany({
      where: { adCampaignId: campaign.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ])

  return NextResponse.json({
    campaign: serializeCampaignForClient(campaign),
    payments,
    changeLogs,
  })
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const id = campaignId(req)
  const existing = await loadOwned(id, user.id)
  if (!existing) return NextResponse.json({ error: "Не найдено" }, { status: 404 })

  if (!USER_EDITABLE_STATUSES.includes(existing.status)) {
    return NextResponse.json({ error: "Кампанию нельзя редактировать в текущем статусе" }, { status: 409 })
  }

  try {
    const input = patchSchema.parse(await req.json())
    const data: Record<string, unknown> = {}
    const changedKeys: string[] = []

    const mediaTouched = MEDIA_PATCH_KEYS.some((k) => input[k] !== undefined)
    if (mediaTouched) {
      const mediaData = buildCampaignMediaData({
        mediaType: input.mediaType ?? existing.mediaType,
        mediaUrl: input.mediaUrl !== undefined ? input.mediaUrl : existing.mediaUrl,
        mediaPosterUrl:
          input.mediaPosterUrl !== undefined ? input.mediaPosterUrl : existing.mediaPosterUrl,
        mediaAlt: input.mediaAlt !== undefined ? input.mediaAlt : existing.mediaAlt,
        mediaWidth: input.mediaWidth !== undefined ? input.mediaWidth : existing.mediaWidth,
        mediaHeight: input.mediaHeight !== undefined ? input.mediaHeight : existing.mediaHeight,
        mediaDuration:
          input.mediaDuration !== undefined ? input.mediaDuration : existing.mediaDuration,
        mediaSize: input.mediaSize !== undefined ? input.mediaSize : existing.mediaSize,
        mediaMimeType:
          input.mediaMimeType !== undefined ? input.mediaMimeType : existing.mediaMimeType,
        imageUrl: input.imageUrl !== undefined ? input.imageUrl : existing.imageUrl,
      })
      Object.assign(data, mediaData)
      for (const k of MEDIA_PATCH_KEYS) changedKeys.push(k)
    }

    for (const [key, value] of Object.entries(input)) {
      if (value === undefined) continue
      if (MEDIA_PATCH_KEYS.includes(key as (typeof MEDIA_PATCH_KEYS)[number])) continue
      if (key === "targetUrl" && typeof value === "string") {
        const safe = validateCampaignTargetUrl(value)
        if (!safe.ok) return NextResponse.json({ error: "Недопустимая ссылка" }, { status: 400 })
        data.targetUrl = safe.url
        changedKeys.push(key)
        continue
      }
      if (key === "startDate" || key === "endDate") {
        data[key] = parseDate(value as string | null)
        changedKeys.push(key)
        continue
      }
      data[key] = value
      changedKeys.push(key)
    }

    const nextStatus = resolveStatusAfterUserEdit(existing.status, changedKeys)
    if (nextStatus !== existing.status) data.status = nextStatus

    const campaign = await prisma.adCampaign.update({
      where: { id },
      data,
    })

    await logAdCampaignChange(prisma, {
      adCampaignId: id,
      userId: user.id,
      action: "updated",
      oldValue: { status: existing.status },
      newValue: { status: campaign.status, fields: changedKeys },
    })

    return NextResponse.json({ campaign: serializeCampaignForClient(campaign) })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message ?? "Ошибка данных" }, { status: 400 })
    }
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const id = campaignId(req)
  const existing = await loadOwned(id, user.id)
  if (!existing) return NextResponse.json({ error: "Не найдено" }, { status: 404 })

  if (existing.status === "ACTIVE") {
    return NextResponse.json({ error: "Сначала приостановите активную кампанию" }, { status: 409 })
  }

  await prisma.adCampaign.update({
    where: { id },
    data: { status: "ARCHIVED" },
  })

  return NextResponse.json({ ok: true })
}
