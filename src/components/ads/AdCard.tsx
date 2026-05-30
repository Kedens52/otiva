"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { MapPin, X } from "lucide-react"
import type { AdPlacement } from "@prisma/client"
import type { SelectedAdPayload } from "@/lib/ads/types"
import { AdMark } from "@/components/ads/AdMark"
import { AdMediaPreview } from "@/components/ads/AdMediaPreview"
import { cn } from "@/lib/utils"

type AdCardProps = {
  ad: SelectedAdPayload
  placement: AdPlacement
  compact?: boolean
  sessionId?: string
  categoryId?: string
  cityId?: string
}

export function AdCard({
  ad,
  placement,
  compact = false,
  sessionId,
  categoryId,
  cityId,
}: AdCardProps) {
  const rootRef = useRef<HTMLElement>(null)
  const [hidden, setHidden] = useState(false)
  const [impressionSent, setImpressionSent] = useState(false)

  useEffect(() => {
    const el = rootRef.current
    if (!el || impressionSent) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting && e.intersectionRatio >= 0.45)
        if (!visible || impressionSent) return
        setImpressionSent(true)
        void fetch("/api/ads/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adId: ad.id,
            eventType: "IMPRESSION",
            placement,
            sessionId,
            categoryId,
            cityId,
          }),
        })
      },
      { threshold: [0.45] },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [ad.id, categoryId, cityId, impressionSent, placement, sessionId])

  async function trackClick() {
    void fetch("/api/ads/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adId: ad.id,
        eventType: "CLICK",
        placement,
        sessionId,
        categoryId,
        cityId,
      }),
    })
  }

  async function trackEvent(eventType: "HIDE" | "REPORT") {
    void fetch("/api/ads/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adId: ad.id,
        eventType,
        placement,
        sessionId,
        categoryId,
        cityId,
      }),
    })
  }

  async function hideAd(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setHidden(true)
    await trackEvent("HIDE")
  }

  async function reportAd(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setHidden(true)
    await trackEvent("REPORT")
  }

  if (hidden) return null

  const rel = ad.isExternal ? "sponsored nofollow" : undefined
  const hasMedia = ad.mediaType !== "NONE" && Boolean(ad.mediaUrl?.trim())
  const isBanner = ad.type === "BANNER"

  return (
    <article
      ref={rootRef}
      className={cn(
        "relative block min-w-0 overflow-hidden border border-white/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)]",
        compact ? "rounded-2xl" : "rounded-[22px]",
        isBanner && "border-orange-100/60",
      )}
    >
      <AdMark />

      <Link
        href={ad.clickHref}
        rel={rel}
        target={ad.isExternal ? "_blank" : undefined}
        onClick={trackClick}
        className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--nashlo-orange)/0.32)]"
      >
        {hasMedia ? (
          <div className="relative">
            <AdMediaPreview
              mediaType={ad.mediaType}
              mediaUrl={ad.mediaUrl}
              mediaPosterUrl={ad.mediaPosterUrl}
              mediaAlt={ad.mediaAlt ?? ad.title}
              aspectClass={isBanner ? "aspect-[21/9] sm:aspect-[3/1]" : "aspect-[4/3]"}
              showVideoControls={false}
              className="rounded-none"
            />
            {ad.label ? (
              <span className="absolute bottom-2.5 left-2.5 z-[1] rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-zinc-700">
                {ad.label}
              </span>
            ) : null}
          </div>
        ) : (
          <div
            className={cn(
              "relative flex items-center justify-center bg-gradient-to-br from-orange-50 to-white",
              isBanner ? "aspect-[21/9] min-h-[72px]" : "aspect-[4/3]",
            )}
          >
            <p className="max-w-[80%] text-center text-sm font-semibold text-zinc-800">{ad.title}</p>
          </div>
        )}

        <div className={cn("space-y-1", compact ? "p-3" : "p-3.5")}>
          <p className="line-clamp-2 text-sm font-semibold text-[#111827]">{ad.title}</p>
          {ad.description ? (
            <p className="line-clamp-2 text-xs text-[#6B7280]">{ad.description}</p>
          ) : null}
          {ad.city ? (
            <p className="flex items-center gap-1 text-xs text-[#6B7280]">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{ad.city}</span>
            </p>
          ) : null}
          {ad.ctaText ? (
            <span className="inline-flex rounded-full bg-[hsl(var(--nashlo-orange)/0.1)] px-2.5 py-1 text-xs font-semibold text-[hsl(var(--nashlo-orange))]">
              {ad.ctaText}
            </span>
          ) : null}
        </div>
      </Link>

      <div className="absolute right-2 top-2 z-10 flex gap-1">
        <button
          type="button"
          aria-label="Пожаловаться на рекламу"
          onClick={reportAd}
          className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-zinc-500 shadow-sm hover:text-zinc-800"
        >
          Жалоба
        </button>
        <button
          type="button"
          aria-label="Скрыть рекламу"
          onClick={hideAd}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-zinc-500 shadow-sm hover:text-zinc-800"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  )
}
