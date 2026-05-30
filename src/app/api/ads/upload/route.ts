import { NextRequest, NextResponse } from "next/server"
import { mkdir, writeFile } from "fs/promises"
import path from "path"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  buildSafeUploadFilename,
  mediaTypeFromKind,
  validateAdMediaFile,
  validateBannerDimensions,
} from "@/lib/ads/ad-media-upload"
import { listPlacementConfigs } from "@/lib/ads/placement-config-service"
import { resolveCreativeRequirements } from "@/lib/ads/placement-requirements"
import type { AdPlacement } from "@prisma/client"

export const dynamic = "force-dynamic"

function extFromName(name: string): string {
  const parts = name.split(".")
  return parts.length > 1 ? parts.pop()!.toLowerCase() : ""
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get("file")
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 400 })
    }

    const ext = extFromName(file.name)
    const mime = file.type || ""
    const durationRaw = formData.get("durationSec")
    const durationSec =
      typeof durationRaw === "string" && durationRaw.trim()
        ? Number.parseFloat(durationRaw)
        : null
    const placementBanner = formData.get("placementBanner") === "1"
    const placementCodesRaw = formData.get("placementCodes")
    const placementCodes =
      typeof placementCodesRaw === "string" && placementCodesRaw.trim()
        ? (placementCodesRaw.split(",").filter(Boolean) as AdPlacement[])
        : []

    let limits: { maxFileBytes?: number | null; allowedFormats?: string[] } | undefined
    let primaryWidth: number | null = null
    let primaryHeight: number | null = null

    if (placementCodes.length) {
      const catalog = await listPlacementConfigs(prisma)
      const req = resolveCreativeRequirements(
        catalog,
        placementCodes,
        placementBanner ? "BANNER" : "NATIVE_CARD",
      )
      limits = {
        maxFileBytes: req.maxFileBytes,
        allowedFormats: req.allowedFormats,
      }
      primaryWidth = req.primaryPlacement?.designWidth ?? null
      primaryHeight = req.primaryPlacement?.designHeight ?? null
    }

    const validation = validateAdMediaFile({
      mime,
      size: file.size,
      ext,
      durationSec: Number.isFinite(durationSec) ? durationSec : null,
      placementBanner,
      limits,
    })
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const widthRaw = formData.get("width")
    const heightRaw = formData.get("height")
    const mediaWidth =
      typeof widthRaw === "string" ? Number.parseInt(widthRaw, 10) : null
    const mediaHeight =
      typeof heightRaw === "string" ? Number.parseInt(heightRaw, 10) : null

    if (primaryWidth && primaryHeight) {
      const dimCheck = validateBannerDimensions({
        width: Number.isFinite(mediaWidth) ? mediaWidth : null,
        height: Number.isFinite(mediaHeight) ? mediaHeight : null,
        designWidth: primaryWidth,
        designHeight: primaryHeight,
        kind: validation.kind,
      })
      if (!dimCheck.ok) {
        return NextResponse.json({ error: dimCheck.error }, { status: 400 })
      }
    }

    const filename = buildSafeUploadFilename(ext)
    const uploadDir = path.join(process.cwd(), "public", "uploads", "ads")
    await mkdir(uploadDir, { recursive: true })

    const bytes = await file.arrayBuffer()
    await writeFile(path.join(uploadDir, filename), Buffer.from(bytes))

    const mediaUrl = `/uploads/ads/${filename}`
    const mediaType = mediaTypeFromKind(validation.kind)

    return NextResponse.json({
      mediaUrl,
      mediaType,
      mediaSize: file.size,
      mediaMimeType: mime,
      mediaWidth: Number.isFinite(mediaWidth) ? mediaWidth : null,
      mediaHeight: Number.isFinite(mediaHeight) ? mediaHeight : null,
      mediaDuration:
        validation.kind === "VIDEO" && Number.isFinite(durationSec)
          ? Math.round(durationSec!)
          : null,
      mediaPosterUrl: null,
    })
  } catch (error) {
    console.error("[ads/upload]", error)
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 })
  }
}
