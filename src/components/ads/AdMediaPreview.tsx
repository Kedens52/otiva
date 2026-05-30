"use client"

import type { AdMediaType } from "@prisma/client"
import { cn } from "@/lib/utils"

export type AdMediaPreviewProps = {
  mediaType: AdMediaType
  mediaUrl?: string | null
  mediaPosterUrl?: string | null
  mediaAlt?: string | null
  className?: string
  aspectClass?: string
  showVideoControls?: boolean
}

export function AdMediaPreview({
  mediaType,
  mediaUrl,
  mediaPosterUrl,
  mediaAlt,
  className,
  aspectClass = "aspect-[4/3]",
  showVideoControls = true,
}: AdMediaPreviewProps) {
  const url = mediaUrl?.trim()
  if (!url || mediaType === "NONE") {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-50 text-xs text-zinc-500",
          aspectClass,
          className,
        )}
      >
        Без медиа
      </div>
    )
  }

  if (mediaType === "VIDEO") {
    return (
      <div className={cn("overflow-hidden rounded-xl bg-zinc-950", aspectClass, className)}>
        <video
          src={url}
          poster={mediaPosterUrl?.trim() || undefined}
          className="h-full w-full object-cover"
          muted
          playsInline
          preload="none"
          controls={showVideoControls}
          autoPlay={!showVideoControls}
          loop={!showVideoControls}
        />
      </div>
    )
  }

  return (
    <div className={cn("overflow-hidden rounded-xl bg-zinc-100", aspectClass, className)}>
      <img
        src={url}
        alt={mediaAlt?.trim() || "Реклама"}
        className="h-full w-full object-cover"
        loading="lazy"
        decoding="async"
      />
    </div>
  )
}
