"use client"

import { useMemo, useRef, useState } from "react"
import type { AdMediaType, AdPlacement, AdType } from "@prisma/client"
import { AdMediaPreview } from "@/components/ads/AdMediaPreview"
import { AdPlacementRequirements } from "@/components/ads/cabinet/AdPlacementRequirements"
import { usePublicPlacementConfigs } from "@/hooks/usePublicPlacementConfigs"
import { AD_CREATIVE_RULES } from "@/lib/ads/media"
import {
  validateAdMediaFile,
  validateBannerDimensions,
} from "@/lib/ads/ad-media-upload"
import type { AdMediaUploadResult } from "@/lib/ads/ad-media-upload"
import { resolveCreativeRequirements } from "@/lib/ads/placement-requirements"

export type AdMediaDraft = {
  mediaType: AdMediaType
  mediaUrl: string | null
  mediaPosterUrl: string | null
  mediaAlt: string | null
  mediaWidth: number | null
  mediaHeight: number | null
  mediaDuration: number | null
  mediaSize: number | null
  mediaMimeType: string | null
}

const emptyMedia: AdMediaDraft = {
  mediaType: "NONE",
  mediaUrl: null,
  mediaPosterUrl: null,
  mediaAlt: null,
  mediaWidth: null,
  mediaHeight: null,
  mediaDuration: null,
  mediaSize: null,
  mediaMimeType: null,
}

type Props = {
  value: AdMediaDraft
  onChange: (value: AdMediaDraft) => void
  adType?: AdType
  placementCodes?: AdPlacement[]
  placementBanner?: boolean
  disabled?: boolean
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

function extFromName(name: string): string {
  const parts = name.split(".")
  return parts.length > 1 ? parts.pop()!.toLowerCase() : ""
}

export function AdMediaUpload({
  value,
  onChange,
  adType = "NATIVE_CARD",
  placementCodes = [],
  placementBanner,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const { placements: catalog, loading: catalogLoading } = usePublicPlacementConfigs()

  const requirements = useMemo(
    () => resolveCreativeRequirements(catalog, placementCodes, adType),
    [catalog, placementCodes, adType],
  )

  async function handleFile(file: File | null) {
    if (!file || disabled) return
    setError("")

    const ext = extFromName(file.name)
    const mime = file.type || ""

    const fileCheck = validateAdMediaFile({
      mime,
      size: file.size,
      ext,
      placementBanner: placementBanner ?? adType === "BANNER",
      limits: {
        maxFileBytes: requirements.maxFileBytes,
        allowedFormats: requirements.allowedFormats,
      },
    })
    if (!fileCheck.ok) {
      setError(fileCheck.error)
      return
    }

    setUploading(true)
    try {
      const [dims, videoMeta] = await Promise.all([
        readImageSize(file),
        file.type.startsWith("video/") ? readVideoMeta(file) : Promise.resolve(null),
      ])

      const width = dims?.width ?? videoMeta?.width ?? null
      const height = dims?.height ?? videoMeta?.height ?? null
      const durationSec = videoMeta?.duration ?? null

      if (fileCheck.ok && requirements.primaryPlacement?.designWidth) {
        const dimCheck = validateBannerDimensions({
          width,
          height,
          designWidth: requirements.primaryPlacement.designWidth,
          designHeight: requirements.primaryPlacement.designHeight ?? 1,
          kind: fileCheck.kind,
        })
        if (!dimCheck.ok) {
          setError(dimCheck.error)
          return
        }
      }

      if (fileCheck.kind === "VIDEO" && durationSec != null && durationSec > 30) {
        setError("Видео слишком длинное (макс. 30 сек)")
        return
      }

      const fd = new FormData()
      fd.append("file", file)
      if (width != null) fd.append("width", String(width))
      if (height != null) fd.append("height", String(height))
      if (durationSec != null) fd.append("durationSec", String(durationSec))
      if (placementBanner) fd.append("placementBanner", "1")
      if (placementCodes.length) {
        fd.append("placementCodes", placementCodes.join(","))
      }
      fd.append("adType", adType)

      const res = await fetch("/api/ads/upload", { method: "POST", body: fd })
      const data = (await res.json()) as AdMediaUploadResult & { error?: string }
      if (!res.ok) throw new Error(data.error ?? "Ошибка загрузки")

      onChange({
        mediaType: data.mediaType,
        mediaUrl: data.mediaUrl,
        mediaPosterUrl: data.mediaPosterUrl,
        mediaAlt: value.mediaAlt,
        mediaWidth: data.mediaWidth,
        mediaHeight: data.mediaHeight,
        mediaDuration: data.mediaDuration,
        mediaSize: data.mediaSize,
        mediaMimeType: data.mediaMimeType,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  function clearMedia() {
    onChange(emptyMedia)
    setError("")
  }

  const hasMedia = value.mediaType !== "NONE" && Boolean(value.mediaUrl)

  return (
    <div className="space-y-4">
      {catalogLoading ? (
        <p className="text-xs text-zinc-500">Загрузка требований к размещению…</p>
      ) : (
        <AdPlacementRequirements
          requirements={requirements}
          adType={adType}
          uploaded={
            hasMedia
              ? {
                  width: value.mediaWidth,
                  height: value.mediaHeight,
                  mediaType: value.mediaType,
                  sizeBytes: value.mediaSize,
                }
              : undefined
          }
        />
      )}

      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-zinc-950">Загрузка креатива</p>
            <p className="mt-1 text-xs text-zinc-600">
              Видео — без звука. GIF — до {Math.round(requirements.maxFileBytes / (1024 * 1024))} MB.
            </p>
          </div>
          <div
            className="hidden w-28 shrink-0 rounded-lg border border-dashed border-zinc-300 bg-white sm:block"
            style={{ aspectRatio: requirements.previewAspectRatio }}
            title="Пропорции превью на сайте"
          >
            <div className="flex h-full items-center justify-center px-1 text-center text-[10px] font-medium text-zinc-400">
              Превью пропорций
            </div>
          </div>
        </div>

        {hasMedia ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_200px]">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Как будет выглядеть
              </p>
              <AdMediaPreview
                mediaType={value.mediaType}
                mediaUrl={value.mediaUrl}
                mediaPosterUrl={value.mediaPosterUrl}
                mediaAlt={value.mediaAlt}
                aspectClass="w-full max-w-md"
                showVideoControls={false}
              />
            </div>
            <div className="flex flex-col gap-2 text-xs text-zinc-600">
              <p>
                Тип: <strong>{value.mediaType}</strong>
                {value.mediaSize ? ` · ${(value.mediaSize / 1024).toFixed(0)} KB` : null}
              </p>
              {value.mediaWidth && value.mediaHeight ? (
                <p>
                  {value.mediaWidth}×{value.mediaHeight} px
                  {value.mediaDuration ? ` · ${value.mediaDuration} сек` : null}
                </p>
              ) : null}
              <div className="mt-auto flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={disabled || uploading}
                  onClick={() => inputRef.current?.click()}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800"
                >
                  Заменить
                </button>
                <button
                  type="button"
                  disabled={disabled || uploading}
                  onClick={clearMedia}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600"
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
            className="mt-4 flex min-h-[140px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-6 text-center text-sm text-zinc-600 transition hover:border-[hsl(var(--nashlo-orange)/0.5)]"
          >
            <span className="font-semibold text-zinc-800">
              {uploading ? "Загрузка…" : "Выберите файл"}
            </span>
            <span className="mt-2 max-w-sm text-xs text-zinc-500">
              {requirements.sizeLabel}
            </span>
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={requirements.accept}
          className="sr-only"
          disabled={disabled || uploading}
          onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
        />

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </div>

      <details className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-600">
        <summary className="cursor-pointer font-medium text-zinc-700">Правила креатива</summary>
        <p className="mt-2 font-medium text-emerald-800">Можно:</p>
        <ul className="mt-1 list-inside list-disc">
          {AD_CREATIVE_RULES.allowed.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <p className="mt-2 font-medium text-red-800">Нельзя:</p>
        <ul className="mt-1 list-inside list-disc">
          {AD_CREATIVE_RULES.forbidden.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </details>
    </div>
  )
}
