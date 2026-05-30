import { NextRequest, NextResponse } from "next/server"
import { mkdir, writeFile } from "fs/promises"
import path from "path"
import { prisma } from "@/lib/prisma"
import { withAdminApi } from "@/lib/admin/guards"
import { isAdSlotId } from "@/lib/banner-slot-ads"
import { getAdSlotDefinition } from "@/lib/ad-store"
import {
  buildSafeUploadFilename,
  mediaTypeFromKind,
  validateAdMediaFile,
  validateBannerDimensions,
} from "@/lib/ads/ad-media-upload"
import { placementLimitsFromConfig } from "@/lib/ads/banner-slot-media"
import { getPlacementConfigByCode, listPlacementConfigs } from "@/lib/ads/placement-config-service"

export const dynamic = "force-dynamic"

function extFromName(name: string): string {
  const parts = name.split(".")
  return parts.length > 1 ? parts.pop()!.toLowerCase() : ""
}

export const POST = withAdminApi(async ({ req }) => {
  try {
    const formData = await req.formData()
    const file = formData.get("file")
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 400 })
    }

    const slotRaw = formData.get("slot")
    const slot = typeof slotRaw === "string" && isAdSlotId(slotRaw) ? slotRaw : null
    if (!slot) {
      return NextResponse.json({ error: "Укажите рекламный слот" }, { status: 400 })
    }

    const placements = await listPlacementConfigs(prisma)
    const placementConfig = getPlacementConfigByCode(placements, slot)
    const slotDef = getAdSlotDefinition(slot)

    const ext = extFromName(file.name)
    const mime = file.type || ""
    const durationRaw = formData.get("durationSec")
    const durationSec =
      typeof durationRaw === "string" && durationRaw.trim()
        ? Number.parseFloat(durationRaw)
        : null
    const widthRaw = formData.get("width")
    const heightRaw = formData.get("height")
    const mediaWidth =
      typeof widthRaw === "string" ? Number.parseInt(widthRaw, 10) : null
    const mediaHeight =
      typeof heightRaw === "string" ? Number.parseInt(heightRaw, 10) : null

    const validation = validateAdMediaFile({
      mime,
      size: file.size,
      ext,
      durationSec: Number.isFinite(durationSec) ? durationSec : null,
      placementBanner: true,
      limits: placementLimitsFromConfig(placementConfig),
    })
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const dimCheck = validateBannerDimensions({
      width: mediaWidth,
      height: mediaHeight,
      designWidth: placementConfig?.designWidth ?? slotDef.designWidth,
      designHeight: placementConfig?.designHeight ?? slotDef.designHeight,
      kind: validation.kind,
    })
    if (!dimCheck.ok) {
      return NextResponse.json({ error: dimCheck.error }, { status: 400 })
    }

    const filename = buildSafeUploadFilename(ext)
    const uploadDir = path.join(process.cwd(), "public", "uploads", "banner-slots")
    await mkdir(uploadDir, { recursive: true })

    const bytes = await file.arrayBuffer()
    await writeFile(path.join(uploadDir, filename), Buffer.from(bytes))

    const mediaUrl = `/uploads/banner-slots/${filename}`
    const mediaType = mediaTypeFromKind(validation.kind)

    return NextResponse.json({
      image: mediaUrl,
      mediaType,
      mediaMimeType: mime,
      mediaWidth: Number.isFinite(mediaWidth) ? mediaWidth : null,
      mediaHeight: Number.isFinite(mediaHeight) ? mediaHeight : null,
      mediaDuration:
        validation.kind === "VIDEO" && Number.isFinite(durationSec)
          ? Math.round(durationSec!)
          : null,
    })
  } catch (error) {
    console.error("[admin/banner-slots/upload]", error)
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 })
  }
}, "settings.manage")
