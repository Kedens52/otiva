import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import {
  checkBlockedImageHash,
  saveUploadedImageFingerprint,
  validateListingImageBuffer,
} from "@/lib/content-policy/image-validate"
import {
  loadUserContextForIncident,
  recordContentModerationIncident,
} from "@/lib/content-policy/incident"
import { getRequestMeta } from "@/lib/content-policy/request-meta"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const BLOCKED_UPLOAD_EXTENSIONS = new Set([
  "svg",
  "gif",
  "exe",
  "zip",
  "html",
  "htm",
  "js",
  "php",
  "sh",
  "bat",
  "heic",
  "heif",
])

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 400 })
    }

    const type = (formData.get("type") as string) || "image"
    const isVideo = type === "video"

    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `Файл слишком большой (макс. ${isVideo ? "50" : "5"}MB)` },
        { status: 400 },
      )
    }

    const allowedVideo = ["video/mp4", "video/webm", "video/quicktime"]
    const allowedImage = ["image/jpeg", "image/png", "image/webp"]

    if (isVideo) {
      if (!allowedVideo.includes(file.type)) {
        return NextResponse.json({ error: "Разрешены MP4, WebM, MOV" }, { status: 400 })
      }
      const ext = file.type.split("/")[1] === "quicktime" ? "mov" : file.type.split("/")[1]
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const uploadDir = path.join(process.cwd(), "public", "uploads")
      await mkdir(uploadDir, { recursive: true })
      const buffer = Buffer.from(await file.arrayBuffer())
      await writeFile(path.join(uploadDir, filename), buffer)
      return NextResponse.json({ url: `/uploads/${filename}` })
    }

    if (!allowedImage.includes(file.type)) {
      return NextResponse.json({ error: "Разрешены JPEG, PNG, WebP" }, { status: 400 })
    }

    const ext = file.type.split("/")[1]
    if (BLOCKED_UPLOAD_EXTENSIONS.has(ext)) {
      return NextResponse.json({ error: "Формат не поддерживается" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const validated = validateListingImageBuffer(buffer, file.type)
    if (!validated.ok) {
      const { ip, userAgent } = getRequestMeta(request)
      const userContext = await loadUserContextForIncident(user.id)
      void recordContentModerationIncident({
        source: "LISTING_UPLOAD",
        severity: "BLOCKED",
        userId: user.id,
        reasonCode: validated.reasonCode,
        summary: validated.error,
        matchedRules: [validated.error],
        payload: {
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          user: userContext,
          ip,
          userAgent,
        },
        ip,
        userAgent,
      })
      return NextResponse.json({ error: validated.error }, { status: 400 })
    }

    const blocked = await checkBlockedImageHash(prisma, validated.sha256)
    if (blocked.blocked) {
      const { ip, userAgent } = getRequestMeta(request)
      const userContext = await loadUserContextForIncident(user.id)
      void recordContentModerationIncident({
        source: "LISTING_UPLOAD",
        severity: "BLOCKED",
        userId: user.id,
        reasonCode: "STOLEN_PHOTOS",
        summary: blocked.reason ?? "Изображение заблокировано",
        matchedRules: ["Заблокированный хеш изображения"],
        payload: {
          sha256: validated.sha256,
          fileName: file.name,
          user: userContext,
          ip,
          userAgent,
        },
        ip,
        userAgent,
      })
      return NextResponse.json({ error: blocked.reason }, { status: 400 })
    }

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const uploadDir = path.join(process.cwd(), "public", "uploads")
    await mkdir(uploadDir, { recursive: true })
    await writeFile(path.join(uploadDir, filename), buffer)

    const url = `/uploads/${filename}`
    await saveUploadedImageFingerprint({
      userId: user.id,
      url,
      sha256: validated.sha256,
      mimeType: validated.mimeType,
      sizeBytes: validated.sizeBytes,
      width: validated.width,
      height: validated.height,
    })

    return NextResponse.json({
      url,
      meta: {
        width: validated.width,
        height: validated.height,
        sha256: validated.sha256,
      },
    })
  } catch (error) {
    console.error("upload error:", error)
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 })
  }
}
