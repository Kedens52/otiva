import { z } from "zod"
import { AdMediaType } from "@prisma/client"
import { resolveCampaignMedia, syncLegacyImageUrl } from "@/lib/ads/media"

export const campaignMediaInputSchema = z.object({
  mediaType: z.nativeEnum(AdMediaType).optional(),
  mediaUrl: z.string().max(500).optional().nullable(),
  mediaPosterUrl: z.string().max(500).optional().nullable(),
  mediaAlt: z.string().max(200).optional().nullable(),
  mediaWidth: z.number().int().positive().optional().nullable(),
  mediaHeight: z.number().int().positive().optional().nullable(),
  mediaDuration: z.number().int().nonnegative().optional().nullable(),
  mediaSize: z.number().int().nonnegative().optional().nullable(),
  mediaMimeType: z.string().max(120).optional().nullable(),
  imageUrl: z.string().max(500).optional().nullable(),
})

export type CampaignMediaInput = z.infer<typeof campaignMediaInputSchema>

/** Нормализация полей медиа для Prisma (create/update). */
export function buildCampaignMediaData(input: CampaignMediaInput): {
  mediaType: AdMediaType
  mediaUrl: string | null
  mediaPosterUrl: string | null
  mediaAlt: string | null
  mediaWidth: number | null
  mediaHeight: number | null
  mediaDuration: number | null
  mediaSize: number | null
  mediaMimeType: string | null
  imageUrl: string | null
} {
  const hasExplicitMedia =
    input.mediaType !== undefined ||
    input.mediaUrl !== undefined ||
    input.imageUrl !== undefined

  if (!hasExplicitMedia) {
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
    }
  }

  const merged = resolveCampaignMedia({
    mediaType: input.mediaType ?? (input.mediaUrl ? undefined : "NONE"),
    mediaUrl: input.mediaUrl ?? null,
    mediaPosterUrl: input.mediaPosterUrl ?? null,
    mediaAlt: input.mediaAlt ?? null,
    mediaWidth: input.mediaWidth ?? null,
    mediaHeight: input.mediaHeight ?? null,
    mediaDuration: input.mediaDuration ?? null,
    mediaSize: input.mediaSize ?? null,
    mediaMimeType: input.mediaMimeType ?? null,
    imageUrl: input.imageUrl ?? null,
  })

  if (input.mediaType === "NONE" || (!input.mediaUrl && !input.imageUrl)) {
    return {
      mediaType: "NONE",
      mediaUrl: null,
      mediaPosterUrl: null,
      mediaAlt: input.mediaAlt ?? null,
      mediaWidth: null,
      mediaHeight: null,
      mediaDuration: null,
      mediaSize: null,
      mediaMimeType: null,
      imageUrl: null,
    }
  }

  return {
    mediaType: input.mediaType ?? merged.mediaType,
    mediaUrl: input.mediaUrl?.trim() || merged.mediaUrl,
    mediaPosterUrl: input.mediaPosterUrl?.trim() || merged.mediaPosterUrl,
    mediaAlt: input.mediaAlt?.trim() || merged.mediaAlt,
    mediaWidth: input.mediaWidth ?? merged.mediaWidth,
    mediaHeight: input.mediaHeight ?? merged.mediaHeight,
    mediaDuration: input.mediaDuration ?? merged.mediaDuration,
    mediaSize: input.mediaSize ?? merged.mediaSize,
    mediaMimeType: input.mediaMimeType ?? merged.mediaMimeType,
    imageUrl: syncLegacyImageUrl({
      mediaType: input.mediaType ?? merged.mediaType,
      mediaUrl: input.mediaUrl?.trim() || merged.mediaUrl,
    }),
  }
}
