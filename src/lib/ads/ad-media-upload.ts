import type { AdMediaType } from "@prisma/client"

export type AdMediaUploadResult = {
  mediaUrl: string
  mediaType: AdMediaType
  mediaSize: number
  mediaMimeType: string
  mediaWidth: number | null
  mediaHeight: number | null
  mediaDuration: number | null
  mediaPosterUrl: string | null
}

type MediaKind = "IMAGE" | "GIF" | "VIDEO"

const RULES: Record<
  MediaKind,
  { maxBytes: number; mimes: Set<string>; exts: Set<string>; maxDurationSec: number | null }
> = {
  IMAGE: {
    maxBytes: 5 * 1024 * 1024,
    mimes: new Set(["image/jpeg", "image/png", "image/webp"]),
    exts: new Set(["jpg", "jpeg", "png", "webp"]),
    maxDurationSec: null,
  },
  GIF: {
    maxBytes: 8 * 1024 * 1024,
    mimes: new Set(["image/gif"]),
    exts: new Set(["gif"]),
    maxDurationSec: null,
  },
  VIDEO: {
    maxBytes: 30 * 1024 * 1024,
    mimes: new Set(["video/mp4", "video/webm"]),
    exts: new Set(["mp4", "webm"]),
    maxDurationSec: 30,
  },
}

const BLOCKED_EXTS = new Set([
  "svg",
  "exe",
  "zip",
  "html",
  "htm",
  "js",
  "mov",
  "php",
  "sh",
  "bat",
])

export function detectAdMediaKind(mime: string, ext: string): MediaKind | null {
  const e = ext.toLowerCase()
  if (BLOCKED_EXTS.has(e)) return null
  if (RULES.GIF.mimes.has(mime) || e === "gif") return "GIF"
  if (RULES.VIDEO.mimes.has(mime)) return "VIDEO"
  if (RULES.IMAGE.mimes.has(mime)) return "IMAGE"
  return null
}

export type AdMediaPlacementLimits = {
  maxFileBytes?: number | null
  allowedFormats?: string[]
}

export function validateAdMediaFile(input: {
  mime: string
  size: number
  ext: string
  durationSec?: number | null
  placementBanner?: boolean
  limits?: AdMediaPlacementLimits
}): { ok: true; kind: MediaKind } | { ok: false; error: string } {
  const ext = input.ext.toLowerCase().replace(/^\./, "")
  if (BLOCKED_EXTS.has(ext)) {
    return { ok: false, error: "Формат не поддерживается" }
  }

  const kind = detectAdMediaKind(input.mime, ext)
  if (!kind) {
    return {
      ok: false,
      error: "Загрузите изображение JPG, PNG, WEBP, GIF или видео MP4/WEBM",
    }
  }

  const rule = RULES[kind]
  if (!rule.mimes.has(input.mime) || !rule.exts.has(ext)) {
    return { ok: false, error: "Формат не поддерживается" }
  }

  const allowed = input.limits?.allowedFormats?.filter(Boolean) ?? []
  if (allowed.length > 0 && !allowed.includes(input.mime)) {
    return {
      ok: false,
      error: `Для этого места допустимы форматы: ${allowed.map(formatMimeLabel).join(", ")}`,
    }
  }

  const maxBytes = input.limits?.maxFileBytes ?? rule.maxBytes
  if (input.size > maxBytes) {
    const mb = Math.max(1, Math.round(maxBytes / (1024 * 1024)))
    return { ok: false, error: `Файл слишком большой (макс. ${mb} MB)` }
  }

  if (kind === "VIDEO" && input.durationSec != null) {
    const maxDur = input.placementBanner ? 30 : 15
    if (input.durationSec > maxDur) {
      return { ok: false, error: `Видео слишком длинное (макс. ${maxDur} сек)` }
    }
  }

  return { ok: true, kind }
}

export function buildSafeUploadFilename(ext: string): string {
  const safe = ext.toLowerCase().replace(/[^a-z0-9]/g, "")
  const allowed = safe === "jpeg" ? "jpg" : safe
  if (!["jpg", "png", "webp", "gif", "mp4", "webm"].includes(allowed)) {
    throw new Error("Invalid extension")
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}.${allowed}`
}

export function mediaTypeFromKind(kind: MediaKind): AdMediaType {
  return kind
}

function formatMimeLabel(mime: string): string {
  if (mime === "image/jpeg") return "JPG"
  if (mime === "image/png") return "PNG"
  if (mime === "image/webp") return "WebP"
  if (mime === "image/gif") return "GIF"
  if (mime === "video/mp4") return "MP4"
  if (mime === "video/webm") return "WebM"
  return mime
}

export function buildAcceptFromFormats(formats: string[]): string {
  if (!formats.length) {
    return "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
  }
  return formats.join(",")
}

/** Проверка соответствия размеру рекламного места (допуск ±35%) */
export function validateBannerDimensions(input: {
  width: number | null | undefined
  height: number | null | undefined
  designWidth: number
  designHeight: number
  kind: MediaKind
}): { ok: true } | { ok: false; error: string } {
  if (input.kind === "VIDEO") {
    return { ok: true }
  }

  const w = input.width ?? 0
  const h = input.height ?? 0
  if (w < 1 || h < 1) {
    return { ok: true }
  }

  const ratioExpected = input.designWidth / input.designHeight
  const ratioActual = w / h
  const ratioDiff = Math.abs(ratioExpected - ratioActual) / ratioExpected
  if (ratioDiff > 0.35) {
    return {
      ok: false,
      error: `Пропорции не подходят для места ${input.designWidth}×${input.designHeight} px. Загружено ${w}×${h}.`,
    }
  }

  if (w < input.designWidth * 0.5 || h < input.designHeight * 0.5) {
    return {
      ok: false,
      error: `Слишком маленький файл: нужно от ${input.designWidth}×${input.designHeight} px (лучше в 2× для Retina).`,
    }
  }

  return { ok: true }
}
