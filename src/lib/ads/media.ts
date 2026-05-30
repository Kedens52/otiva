import type { AdMediaType, AdType } from "@prisma/client"

export type ResolvedAdMedia = {
  mediaType: AdMediaType
  mediaUrl: string | null
  mediaPosterUrl: string | null
  mediaAlt: string | null
  mediaWidth: number | null
  mediaHeight: number | null
  mediaDuration: number | null
  mediaSize: number | null
  mediaMimeType: string | null
  /** Для обратной совместимости с AdCard (imageUrl) */
  imageUrl: string | null
  hasMedia: boolean
}

export type CampaignMediaFields = {
  mediaType?: AdMediaType | null
  mediaUrl?: string | null
  mediaPosterUrl?: string | null
  mediaAlt?: string | null
  mediaWidth?: number | null
  mediaHeight?: number | null
  mediaDuration?: number | null
  mediaSize?: number | null
  mediaMimeType?: string | null
  imageUrl?: string | null
  title?: string | null
}

/** Единый источник URL/типа: mediaUrl или legacy imageUrl. */
export function resolveCampaignMedia(campaign: CampaignMediaFields): ResolvedAdMedia {
  const mediaUrl = campaign.mediaUrl?.trim() || null
  const mediaType = campaign.mediaType ?? "NONE"

  if (mediaUrl && mediaType !== "NONE") {
    return {
      mediaType,
      mediaUrl,
      mediaPosterUrl: campaign.mediaPosterUrl?.trim() || null,
      mediaAlt: campaign.mediaAlt?.trim() || campaign.title?.trim() || null,
      mediaWidth: campaign.mediaWidth ?? null,
      mediaHeight: campaign.mediaHeight ?? null,
      mediaDuration: campaign.mediaDuration ?? null,
      mediaSize: campaign.mediaSize ?? null,
      mediaMimeType: campaign.mediaMimeType ?? null,
      imageUrl: mediaType === "IMAGE" || mediaType === "GIF" ? mediaUrl : campaign.imageUrl ?? null,
      hasMedia: true,
    }
  }

  const legacy = campaign.imageUrl?.trim() || null
  if (legacy) {
    const isGif = legacy.toLowerCase().endsWith(".gif")
    return {
      mediaType: isGif ? "GIF" : "IMAGE",
      mediaUrl: legacy,
      mediaPosterUrl: null,
      mediaAlt: campaign.mediaAlt?.trim() || campaign.title?.trim() || null,
      mediaWidth: campaign.mediaWidth ?? null,
      mediaHeight: campaign.mediaHeight ?? null,
      mediaDuration: null,
      mediaSize: campaign.mediaSize ?? null,
      mediaMimeType: isGif ? "image/gif" : campaign.mediaMimeType ?? null,
      imageUrl: legacy,
      hasMedia: true,
    }
  }

  return {
    mediaType: "NONE",
    mediaUrl: null,
    mediaPosterUrl: null,
    mediaAlt: null,
    mediaWidth: null,
    mediaHeight: null,
    mediaDuration: null,
    mediaSize: null,
    mediaMimeType: null,
    imageUrl: null,
    hasMedia: false,
  }
}

export function syncLegacyImageUrl(
  media: Pick<ResolvedAdMedia, "mediaType" | "mediaUrl">,
): string | null {
  if (media.mediaType === "IMAGE" || media.mediaType === "GIF") {
    return media.mediaUrl
  }
  return null
}

export const AD_MEDIA_REJECT_REASONS = [
  "Некачественное изображение",
  "Запрещённый контент",
  "Слишком много текста на баннере",
  "Неподходящий формат",
  "Ссылка не соответствует рекламе",
  "Видео нарушает правила",
  "Другое",
] as const

export const AD_CREATIVE_RULES = {
  allowed: [
    "фото товара или услуги",
    "баннер компании",
    "короткое видео",
    "GIF без раздражающей анимации",
  ],
  forbidden: [
    "шок-контент",
    "обманные баннеры",
    "мигающие агрессивные GIF",
    "запрещённые товары и услуги",
    "нечитабельный текст",
    "чужие логотипы без прав",
    "видео со звуком по умолчанию",
    "материалы 18+ без разрешения правил",
  ],
} as const

export const AD_MEDIA_SIZE_HINTS: Record<string, string> = {
  NATIVE_CARD: "1080×1080 или 1080×1350",
  BANNER: "1200×628 или 1440×360",
  VIDEO: "720×1280 (вертикальное) или 1200×628",
  SIDEBAR: "600×600",
}

export function mediaHintForAdType(type: AdType): string {
  if (type === "BANNER") return AD_MEDIA_SIZE_HINTS.BANNER
  if (type === "NATIVE_CARD" || type === "SERVICE_CARD" || type === "SHOP_CARD") {
    return AD_MEDIA_SIZE_HINTS.NATIVE_CARD
  }
  return AD_MEDIA_SIZE_HINTS.NATIVE_CARD
}
