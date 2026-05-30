import type { AdPlacement, AdType } from "@prisma/client"
import { buildAcceptFromFormats } from "@/lib/ads/ad-media-upload"
import { mediaHintForAdType } from "@/lib/ads/media"
import type { PlacementConfigDto } from "@/lib/ads/placement-config-service"

export type PublicPlacementRow = Pick<
  PlacementConfigDto,
  | "code"
  | "kind"
  | "name"
  | "pages"
  | "whereOnPage"
  | "deviceScope"
  | "designWidth"
  | "designHeight"
  | "allowedFormats"
  | "maxFileBytes"
>

export type CreativeRequirementsBundle = {
  placements: PublicPlacementRow[]
  primaryPlacement: PublicPlacementRow | null
  sizeLabel: string
  maxFileBytes: number
  allowedFormats: string[]
  accept: string
  previewAspectRatio: string
}

const DEFAULT_MAX_BYTES = 8 * 1024 * 1024

const FORMAT_LABELS: Record<string, string> = {
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/webp": "WebP",
  "image/gif": "GIF",
  "video/mp4": "MP4",
  "video/webm": "WebM",
}

export function formatAllowedFormats(formats: string[]): string {
  if (!formats.length) return "JPG, PNG, WebP, GIF, MP4, WebM"
  return formats.map((f) => FORMAT_LABELS[f] ?? f).join(", ")
}

export function formatMaxSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MB`
  return `${Math.round(bytes / 1024)} KB`
}

function previewAspectForType(adType: AdType, placement: PublicPlacementRow | null): string {
  if (placement?.designWidth && placement.designHeight) {
    return `${placement.designWidth} / ${placement.designHeight}`
  }
  if (adType === "BANNER") return "21 / 9"
  return "4 / 3"
}

export function resolveCreativeRequirements(
  all: PublicPlacementRow[],
  placementCodes: string[],
  adType: AdType,
): CreativeRequirementsBundle {
  const codes = new Set(placementCodes)
  const placements = all.filter((p) => codes.has(p.code as AdPlacement) || codes.has(p.code))

  const withSize = placements.filter((p) => p.designWidth && p.designHeight)
  const primaryPlacement = withSize[0] ?? placements[0] ?? null

  const allowedFormats = [
    ...new Set(placements.flatMap((p) => p.allowedFormats).filter(Boolean)),
  ]
  const maxFromPlacements = placements
    .map((p) => p.maxFileBytes)
    .filter((v): v is number => v != null && v > 0)
  const maxFileBytes = maxFromPlacements.length
    ? Math.min(...maxFromPlacements)
    : DEFAULT_MAX_BYTES

  const sizeParts = withSize.map((p) => `${p.designWidth}×${p.designHeight} px (${p.name})`)
  const sizeLabel =
    sizeParts.length > 0
      ? sizeParts.join(" · ")
      : mediaHintForAdType(adType)

  return {
    placements,
    primaryPlacement,
    sizeLabel,
    maxFileBytes,
    allowedFormats: allowedFormats.length ? allowedFormats : [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "video/mp4",
      "video/webm",
    ],
    accept: buildAcceptFromFormats(allowedFormats),
    previewAspectRatio: previewAspectForType(adType, primaryPlacement),
  }
}

export function dimensionMatchStatus(input: {
  width: number | null
  height: number | null
  designWidth: number | null | undefined
  designHeight: number | null | undefined
}): "ok" | "warn" | "unknown" {
  const { width, height, designWidth, designHeight } = input
  if (!width || !height || !designWidth || !designHeight) return "unknown"

  const ratioExpected = designWidth / designHeight
  const ratioActual = width / height
  const ratioDiff = Math.abs(ratioExpected - ratioActual) / ratioExpected

  if (ratioDiff > 0.35 || width < designWidth * 0.5 || height < designHeight * 0.5) {
    return "warn"
  }
  return "ok"
}
