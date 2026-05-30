import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { withAdminApi } from "@/lib/admin/guards"
import { writeAudit, AuditAction } from "@/lib/admin/audit"
import { extractIp, extractUA } from "@/lib/admin/getRequestMeta"
import {
  isAdSlotId,
  managedAdToDbInput,
  serializeBannerSlotAd,
} from "@/lib/banner-slot-ads"
import type { ManagedAd } from "@/lib/ad-store"
import { validateBannerSlotMediaOnSave } from "@/lib/ads/banner-slot-media"
import { getPlacementConfigByCode, listPlacementConfigs } from "@/lib/ads/placement-config-service"

export const dynamic = "force-dynamic"

const adSchema = z.object({
  id: z.string().min(1),
  slot: z.string().refine(isAdSlotId, "Некорректный слот"),
  title: z.string().max(200).optional().default(""),
  subtitle: z.string().max(500).optional().default(""),
  cta: z.string().max(80).optional().default(""),
  href: z.string().min(1).max(500),
  image: z.string().max(8_000_000).optional().nullable(),
  mediaType: z.enum(["NONE", "IMAGE", "GIF", "VIDEO"]).optional(),
  mediaMimeType: z.string().max(80).optional().nullable(),
  mediaWidth: z.number().int().positive().optional().nullable(),
  mediaHeight: z.number().int().positive().optional().nullable(),
  mediaDuration: z.number().int().positive().optional().nullable(),
  advertiser: z.string().max(120).optional().default(""),
  active: z.boolean(),
  startsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  erid: z.string().max(120).optional().default(""),
  ordName: z.string().max(120).optional().default(""),
  imageOnly: z.boolean().optional(),
  disclosureMark: z.enum(["ad", "partner"]).optional(),
  ownerEmail: z.union([z.string().email(), z.literal("")]).optional().nullable(),
  ownerName: z.string().max(120).optional().nullable(),
  status: z.enum(["draft", "pending", "approved", "rejected"]).optional(),
  moderationComment: z.string().max(500).optional().nullable(),
  impressions: z.number().int().min(0).optional(),
  clicks: z.number().int().min(0).optional(),
})

const syncSchema = z.object({
  ads: z.array(adSchema),
})

export const GET = withAdminApi(async ({ staff, req }) => {
  try {
    const rows = await prisma.bannerSlotAd.findMany({
      orderBy: { updatedAt: "desc" },
    })

    await writeAudit({
      actorId: staff.id,
      action: AuditAction.ADMIN_SETTINGS_VIEWED,
      targetType: "BannerSlotAd",
      metadata: { count: rows.length },
      ip: extractIp(req),
      userAgent: extractUA(req),
    })

    return NextResponse.json({ ads: rows.map(serializeBannerSlotAd) })
  } catch (error) {
    console.warn("admin banner-slots GET unavailable:", error)
    return NextResponse.json({ ads: [] })
  }
}, "settings.view")

export const PUT = withAdminApi(async ({ staff, req }) => {
  try {
    const { ads } = syncSchema.parse(await req.json())
    const placementConfigs = await listPlacementConfigs(prisma)

    for (const ad of ads) {
      if (ad.image?.trim()) {
        const mediaCheck = validateBannerSlotMediaOnSave({
          slot: ad.slot as ManagedAd["slot"],
          image: ad.image,
          mediaType: ad.mediaType ?? null,
          mediaMimeType: ad.mediaMimeType,
          mediaWidth: ad.mediaWidth,
          mediaHeight: ad.mediaHeight,
          mediaDuration: ad.mediaDuration,
          placementConfig: getPlacementConfigByCode(placementConfigs, ad.slot),
        })
        if (!mediaCheck.ok) {
          return NextResponse.json({ error: mediaCheck.error }, { status: 400 })
        }
      }
    }

    for (const ad of ads) {
      if (ad.active) {
        const conflict = ads.some(
          (other) =>
            other.id !== ad.id && other.slot === ad.slot && other.active,
        )
        if (conflict) {
          return NextResponse.json(
            { error: `В слоте «${ad.slot}» может быть только одна активная реклама.` },
            { status: 400 },
          )
        }
      }
    }

    const incomingIds = new Set(ads.map((ad) => ad.id))
    const existing = await prisma.bannerSlotAd.findMany({ select: { id: true } })
    const toDelete = existing.filter((row) => !incomingIds.has(row.id)).map((row) => row.id)

    await prisma.$transaction(async (tx) => {
      if (toDelete.length) {
        await tx.bannerSlotAd.deleteMany({ where: { id: { in: toDelete } } })
      }

      for (const ad of ads) {
        const data = managedAdToDbInput({ ...(ad as ManagedAd), imageOnly: ad.imageOnly })

        if (ad.active) {
          await tx.bannerSlotAd.updateMany({
            where: { slot: data.slot, id: { not: ad.id }, active: true },
            data: { active: false, status: "draft" },
          })
        }

        await tx.bannerSlotAd.upsert({
          where: { id: ad.id },
          create: { id: ad.id, ...data },
          update: data,
        })
      }
    })

    const rows = await prisma.bannerSlotAd.findMany({ orderBy: { updatedAt: "desc" } })

    await writeAudit({
      actorId: staff.id,
      action: AuditAction.ADMIN_SETTINGS_UPDATED,
      targetType: "BannerSlotAd",
      metadata: { count: rows.length },
      ip: extractIp(req),
      userAgent: extractUA(req),
    })

    return NextResponse.json({ ads: rows.map(serializeBannerSlotAd) })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const detail = error.errors.map((e) => e.message).join("; ")
      return NextResponse.json({ error: detail || "Ошибка валидации" }, { status: 400 })
    }
    console.error("admin banner-slots PUT error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}, "settings.manage")
