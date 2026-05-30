"use client"

import { useRef, useState } from "react"
import type { AdMediaType } from "@prisma/client"
import { AdMediaPreview } from "@/components/ads/AdMediaPreview"
import { getAdminCsrfFromDocument } from "@/lib/admin/csrf-client"
import type { AdSlotId } from "@/lib/ad-store"
import { AdPlacementRequirements } from "@/components/ads/cabinet/AdPlacementRequirements"
import { buildAcceptFromFormats } from "@/lib/ads/ad-media-upload"
import { resolveCreativeRequirements } from "@/lib/ads/placement-requirements"
import type { PlacementConfigDto } from "@/lib/ads/placement-config-service"
import { usePublicPlacementConfigs } from "@/hooks/usePublicPlacementConfigs"

type Props = {
  slot: AdSlotId
  slotSizeLabel: string
  placementConfig?: PlacementConfigDto
  image?: string
  mediaType?: AdMediaType
  mediaWidth?: number
  mediaHeight?: number
  mediaSize?: number
  onUploaded: (payload: {
    image: string
    mediaType: AdMediaType
    mediaMimeType: string | null
    mediaWidth: number | null
    mediaHeight: number | null
    mediaDuration: number | null
  }) => void
  onClear: () => void
}

function readImageSize(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) {
      resolve(null)
      return
    }
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(url)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }
    img.src = url
  })
}

function readVideoMeta(file: File): Promise<{ width: number; height: number; duration: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement("video")
    video.preload = "metadata"
    video.onloadedmetadata = () => {
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration,
      })
      URL.revokeObjectURL(url)
    }
    video.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }
    video.src = url
  })
}

export function AdminBannerSlotMediaUpload({
  slot,
  slotSizeLabel,
  placementConfig,
  image,
  mediaType = "IMAGE",
  mediaWidth,
  mediaHeight,
  mediaSize,
  onUploaded,
  onClear,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  const { placements: catalog } = usePublicPlacementConfigs()
  const requirements = resolveCreativeRequirements(
    catalog,
    [slot],
    "BANNER",
  )
  const accept = buildAcceptFromFormats(requirements.allowedFormats)

  async function handleFile(file: File | null) {
    if (!file) return
    setError("")
    setUploading(true)
    try {
      const [dims, videoMeta] = await Promise.all([
        readImageSize(file),
        file.type.startsWith("video/") ? readVideoMeta(file) : Promise.resolve(null),
      ])

      const fd = new FormData()
      fd.append("file", file)
      fd.append("slot", slot)
      if (dims) {
        fd.append("width", String(dims.width))
        fd.append("height", String(dims.height))
      }
      if (videoMeta) {
        fd.append("width", String(videoMeta.width))
        fd.append("height", String(videoMeta.height))
        fd.append("durationSec", String(videoMeta.duration))
      }

      const res = await fetch("/api/admin/banner-slots/upload", {
        method: "POST",
        headers: { "X-CSRF-Token": getAdminCsrfFromDocument() },
        body: fd,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || "Не удалось загрузить файл")
        return
      }

      onUploaded({
        image: data.image,
        mediaType: data.mediaType,
        mediaMimeType: data.mediaMimeType ?? file.type,
        mediaWidth: data.mediaWidth ?? dims?.width ?? videoMeta?.width ?? null,
        mediaHeight: data.mediaHeight ?? dims?.height ?? videoMeta?.height ?? null,
        mediaDuration: data.mediaDuration ?? null,
      })
    } catch {
      setError("Ошибка загрузки")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const resolvedType =
    mediaType && mediaType !== "NONE" ? mediaType : image?.toLowerCase().includes(".gif") ? "GIF" : "IMAGE"

  return (
    <div className="space-y-3">
      <AdPlacementRequirements
        requirements={requirements}
        adType="BANNER"
        uploaded={
          image
            ? {
                width: mediaWidth ?? null,
                height: mediaHeight ?? null,
                mediaType: resolvedType,
                sizeBytes: mediaSize ?? null,
              }
            : undefined
        }
      />
      <span className="text-sm font-medium text-zinc-600">
        Медиа ({slotSizeLabel})
      </span>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={uploading}
        onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
        className="block w-full text-sm text-zinc-500 file:mr-3 file:rounded-xl file:border-0 file:bg-zinc-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white disabled:opacity-50"
      />
      {uploading ? <p className="text-xs text-zinc-500">Загрузка…</p> : null}
      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
      {image ? (
        <div className="space-y-2">
          <AdMediaPreview
            mediaType={resolvedType}
            mediaUrl={image}
            mediaAlt="Превью баннера"
            aspectClass="aspect-[2/1] max-h-40"
            showVideoControls={false}
          />
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-semibold text-red-600 hover:underline"
          >
            Удалить медиа
          </button>
        </div>
      ) : null}
    </div>
  )
}
