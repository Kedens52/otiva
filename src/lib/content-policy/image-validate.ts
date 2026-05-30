import { createHash } from "crypto"
import { readFile } from "fs/promises"
import path from "path"
import type { PrismaClient } from "@prisma/client"
import { prisma } from "@/lib/prisma"

const MIN_WIDTH = 200
const MIN_HEIGHT = 200
const MAX_WIDTH = 8000
const MAX_HEIGHT = 8000
const MIN_BYTES = 1024
const MAX_ASPECT = 4

export type ImageValidationResult =
  | {
      ok: true
      sha256: string
      mimeType: string
      sizeBytes: number
      width: number | null
      height: number | null
    }
  | { ok: false; error: string; reasonCode: string }

function detectMime(buffer: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg"
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png"
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp"
  }
  return null
}

function readPngDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 24) return null
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  }
}

function readJpegDimensions(buffer: Buffer): { width: number; height: number } | null {
  let offset = 2
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) return null
    const marker = buffer[offset + 1]
    const length = buffer.readUInt16BE(offset + 2)
    if (marker === 0xc0 || marker === 0xc2) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      }
    }
    offset += 2 + length
  }
  return null
}

function readWebpDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 30) return null
  const chunk = buffer.toString("ascii", 12, 16)
  if (chunk === "VP8 ") {
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    }
  }
  if (chunk === "VP8L" && buffer.length >= 25) {
    const bits = buffer.readUInt32LE(21)
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    }
  }
  if (chunk === "VP8X" && buffer.length >= 30) {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3),
    }
  }
  return null
}

function readDimensions(
  buffer: Buffer,
  mime: "image/jpeg" | "image/png" | "image/webp",
): { width: number; height: number } | null {
  if (mime === "image/png") return readPngDimensions(buffer)
  if (mime === "image/jpeg") return readJpegDimensions(buffer)
  return readWebpDimensions(buffer)
}

export function validateListingImageBuffer(buffer: Buffer, declaredMime: string): ImageValidationResult {
  if (buffer.length < MIN_BYTES) {
    return { ok: false, error: "Файл повреждён или слишком маленький", reasonCode: "IMAGE_INVALID" }
  }

  const detected = detectMime(buffer)
  if (!detected) {
    return { ok: false, error: "Недопустимый формат изображения", reasonCode: "IMAGE_INVALID" }
  }

  const allowed = ["image/jpeg", "image/png", "image/webp"]
  if (!allowed.includes(declaredMime) || declaredMime !== detected) {
    return {
      ok: false,
      error: "Тип файла не совпадает с содержимым",
      reasonCode: "IMAGE_INVALID",
    }
  }

  const dims = readDimensions(buffer, detected)
  if (!dims || dims.width < MIN_WIDTH || dims.height < MIN_HEIGHT) {
    return {
      ok: false,
      error: `Минимальный размер фото ${MIN_WIDTH}×${MIN_HEIGHT} px`,
      reasonCode: "IMAGE_TOO_SMALL",
    }
  }

  if (dims.width > MAX_WIDTH || dims.height > MAX_HEIGHT) {
    return {
      ok: false,
      error: "Изображение слишком большое",
      reasonCode: "IMAGE_INVALID",
    }
  }

  const aspect = Math.max(dims.width, dims.height) / Math.min(dims.width, dims.height)
  if (aspect > MAX_ASPECT) {
    return {
      ok: false,
      error: "Некорректные пропорции изображения",
      reasonCode: "IMAGE_INVALID",
    }
  }

  const sha256 = createHash("sha256").update(buffer).digest("hex")
  return {
    ok: true,
    sha256,
    mimeType: detected,
    sizeBytes: buffer.length,
    width: dims.width,
    height: dims.height,
  }
}

export async function checkBlockedImageHash(
  db: PrismaClient,
  sha256: string,
): Promise<{ blocked: boolean; reason?: string }> {
  const row = await db.uploadedMediaFingerprint.findFirst({
    where: { sha256, blocked: true },
    orderBy: { createdAt: "desc" },
    select: { blockReason: true },
  })
  if (!row) return { blocked: false }
  return { blocked: true, reason: row.blockReason ?? "Изображение заблокировано модерацией" }
}

export async function saveUploadedImageFingerprint(input: {
  userId: string
  url: string
  sha256: string
  mimeType: string
  sizeBytes: number
  width: number | null
  height: number | null
  blocked?: boolean
  blockReason?: string
}) {
  await prisma.uploadedMediaFingerprint.create({
    data: {
      userId: input.userId,
      url: input.url,
      sha256: input.sha256,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      width: input.width,
      height: input.height,
      blocked: input.blocked ?? false,
      blockReason: input.blockReason,
    },
  })
}

function uploadsPathFromUrl(url: string): string | null {
  if (!url.startsWith("/uploads/")) return null
  const name = path.basename(url)
  if (name.includes("..")) return null
  return path.join(process.cwd(), "public", "uploads", name)
}

/** Проверка фото объявления по URL (локальные /uploads/). */
export async function validateListingImageUrls(
  db: PrismaClient,
  userId: string,
  urls: string[],
): Promise<{ ok: true } | { ok: false; error: string; reasonCode: string; sha256?: string }> {
  for (const url of urls) {
    const filePath = uploadsPathFromUrl(url)
    if (!filePath) continue

    let buffer: Buffer
    try {
      buffer = await readFile(filePath)
    } catch {
      return { ok: false, error: "Не удалось прочитать загруженное фото", reasonCode: "IMAGE_INVALID" }
    }

    const mime =
      url.endsWith(".png") ? "image/png" : url.endsWith(".webp") ? "image/webp" : "image/jpeg"
    const validated = validateListingImageBuffer(buffer, mime)
    if (!validated.ok) return validated

    const blocked = await checkBlockedImageHash(db, validated.sha256)
    if (blocked.blocked) {
      return {
        ok: false,
        error: blocked.reason ?? "Это изображение нельзя использовать",
        reasonCode: "STOLEN_PHOTOS",
        sha256: validated.sha256,
      }
    }

    const known = await db.uploadedMediaFingerprint.findFirst({
      where: { sha256: validated.sha256, userId, url },
      select: { id: true },
    })
    if (!known) {
      await saveUploadedImageFingerprint({
        userId,
        url,
        sha256: validated.sha256,
        mimeType: validated.mimeType,
        sizeBytes: validated.sizeBytes,
        width: validated.width,
        height: validated.height,
      })
    }
  }

  return { ok: true }
}

/** Один и тот же файл у продавца в нескольких активных объявлениях — на проверку. */
export async function findDuplicateImageAcrossListings(
  db: PrismaClient,
  sellerId: string,
  imageUrls: string[],
  excludeListingId?: string,
): Promise<boolean> {
  const fingerprints = await db.uploadedMediaFingerprint.findMany({
    where: { userId: sellerId, url: { in: imageUrls } },
    select: { sha256: true },
  })
  const hashes = [...new Set(fingerprints.map((f) => f.sha256))]
  if (!hashes.length) return false

  const otherMedia = await db.uploadedMediaFingerprint.findMany({
    where: {
      userId: sellerId,
      sha256: { in: hashes },
      url: { notIn: imageUrls },
    },
    select: { url: true },
  })
  const otherUrls = otherMedia.map((m) => m.url)
  if (!otherUrls.length) return false

  const count = await db.listing.count({
    where: {
      sellerId,
      status: { in: ["ACTIVE", "MODERATION"] },
      images: { hasSome: otherUrls },
      ...(excludeListingId ? { id: { not: excludeListingId } } : {}),
    },
  })
  return count > 0
}
