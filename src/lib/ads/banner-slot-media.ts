import type { AdMediaType } from "@prisma/client"
import type { AdSlotId } from "@/lib/ad-store"
import {
  detectAdMediaKind,
  validateAdMediaFile,
  validateBannerDimensions,
  type AdMediaPlacementLimits,
} from "@/lib/ads/ad-media-upload"
import { getAdSlotDefinition } from "@/lib/ad-store"
import type { PlacementConfigDto } from "@/lib/ads/placement-config-service"

export type BannerSlotMediaFields = {
  image?: string | null
  mediaType?: AdMediaType | null
  mediaMimeType?: string | null
  mediaWidth?: number | null
  mediaHeight?: number | null
  mediaDuration?: number | null
}

export function inferBannerMediaType(imageUrl: string | null | undefined): AdMediaType {
  const url = imageUrl?.trim().toLowerCase() ?? ""
  if (!url) return "NONE"
  if (url.endsWith(".gif") || url.includes("image/gif")) return "GIF"
  if (url.endsWith(".mp4") || url.endsWith(".webm") || url.includes("video/")) return "VIDEO"
  return "IMAGE"
}

export function resolveBannerSlotMedia(ad: BannerSlotMediaFields): {
  mediaType: AdMediaType
  mediaUrl: string | null
} {
  const mediaUrl = ad.image?.trim() || null
  const mediaType =
    ad.mediaType && ad.mediaType !== "NONE" ? ad.mediaType : inferBannerMediaType(mediaUrl)
  return { mediaType, mediaUrl }
}

export function placementLimitsFromConfig(
  config: PlacementConfigDto | undefined,
): AdMediaPlacementLimits {
  return {
    maxFileBytes: config?.maxFileBytes ?? null,
    allowedFormats: config?.allowedFormats?.length ? config.allowedFormats : undefined,
  }
}

export function validateBannerSlotMediaOnSave(input: {
  slot: AdSlotId
  image?: string | null
  mediaType?: AdMediaType | null
  mediaMimeType?: string | null
  mediaWidth?: number | null
  mediaHeight?: number | null
  mediaDuration?: number | null
  placementConfig?: PlacementConfigDto
}): { ok: true } | { ok: false; error: string } {
  const url = input.image?.trim()
  if (!url) return { ok: true }

  if (url.startsWith("data:")) {
    if (url.length > 8_000_000) {
      return { ok: false, error: "Встроенное изображение слишком большое — загрузите файл через кнопку." }
    }
    return { ok: true }
  }

  if (/^javascript:/i.test(url) || /^data:text\/html/i.test(url)) {
    return { ok: false, error: "Недопустимая ссылка на медиа" }
  }

  const mediaType =
    input.mediaType && input.mediaType !== "NONE"
      ? input.mediaType
      : inferBannerMediaType(url)

  if (mediaType === "NONE") return { ok: true }

  const ext = url.split("?")[0]?.split(".").pop()?.toLowerCase() ?? ""
  const mime = input.mediaMimeType || mimeFromMediaType(mediaType, ext)
  const kind = detectAdMediaKind(mime, ext)
  if (!kind) {
    return { ok: false, error: "Неподдерживаемый формат медиа" }
  }

  const limits = placementLimitsFromConfig(input.placementConfig)
  const sizeGuess = 0
  const fileCheck = validateAdMediaFile({
    mime,
    size: sizeGuess,
    ext,
    durationSec: input.mediaDuration,
    placementBanner: true,
    limits,
  })
  if (!fileCheck.ok && fileCheck.error.includes("большой")) {
    return fileCheck
  }

  const slotDef = getAdSlotDefinition(input.slot)
  const dimCheck = validateBannerDimensions({
    width: input.mediaWidth,
    height: input.mediaHeight,
    designWidth: input.placementConfig?.designWidth ?? slotDef.designWidth,
    designHeight: input.placementConfig?.designHeight ?? slotDef.designHeight,
    kind,
  })
  if (!dimCheck.ok) return dimCheck

  return { ok: true }
}

function mimeFromMediaType(type: AdMediaType, ext: string): string {
  if (type === "GIF") return "image/gif"
  if (type === "VIDEO") {
    if (ext === "webm") return "video/webm"
    return "video/mp4"
  }
  if (ext === "png") return "image/png"
  if (ext === "webp") return "image/webp"
  return "image/jpeg"
}
