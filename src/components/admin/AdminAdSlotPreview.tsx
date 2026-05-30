"use client"

import { AdMediaPreview } from "@/components/ads/AdMediaPreview"
import { AdMark } from "@/components/ads/AdMark"
import { resolveBannerSlotMedia } from "@/lib/ads/banner-slot-media"
import { normalizeAdDisclosureMark } from "@/lib/ads/disclosure-mark"
import { getAdSlotAspectRatio, getAdSlotDefinition, type ManagedAd } from "@/lib/ad-store"

type AdminAdSlotPreviewProps = {
  ad: Pick<
    ManagedAd,
    "slot" | "title" | "subtitle" | "cta" | "href" | "image" | "advertiser" | "erid" | "disclosureMark"
  >
  label?: string
}

const toneClasses = {
  orange: {
    border: "border-[hsl(var(--nashlo-orange)/0.18)]",
    bg: "bg-[linear-gradient(120deg,rgba(255,246,240,0.95),rgba(255,255,255,1))]",
    icon: "bg-[hsl(var(--nashlo-orange)/0.12)] text-[hsl(var(--nashlo-orange))]",
    label: "text-[hsl(var(--nashlo-orange))]",
    button: "bg-[hsl(var(--nashlo-orange))]",
  },
  blue: {
    border: "border-[hsl(var(--nashlo-blue)/0.18)]",
    bg: "bg-[linear-gradient(160deg,rgba(239,248,255,1),rgba(255,255,255,1))]",
    icon: "bg-[hsl(var(--nashlo-blue)/0.1)] text-[hsl(var(--nashlo-blue))]",
    label: "text-[hsl(var(--nashlo-blue))]",
    button: "bg-[hsl(var(--nashlo-blue))]",
  },
}

function previewFrameStyle(slot: ReturnType<typeof getAdSlotDefinition>) {
  const width =
    slot.variant === "box" || slot.variant === "tall"
      ? slot.displayWidth
      : slot.variant === "listingStrip"
        ? slot.displayWidth
        : Math.min(slot.displayWidth, 400)

  return {
    width: "100%",
    maxWidth: width,
    aspectRatio: getAdSlotAspectRatio(slot),
  } as const
}

export function AdminAdSlotPreview({ ad, label = "Как будет на сайте" }: AdminAdSlotPreviewProps) {
  const slot = getAdSlotDefinition(ad.slot)
  const styles = toneClasses[slot.tone]
  const hasImage = Boolean(ad.image?.trim())
  const { mediaType, mediaUrl } = resolveBannerSlotMedia(ad)
  const frameStyle = previewFrameStyle(slot)
  const disclosureMark = normalizeAdDisclosureMark(ad.disclosureMark)

  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-zinc-950">{label}</p>
          <p className="mt-0.5 text-xs font-semibold text-[hsl(var(--nashlo-orange))]">{slot.zoneLabel}</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {slot.page} · {slot.placement}
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-600 shadow-sm">
          {slot.size}
        </span>
      </div>

      <div className="mt-4 flex justify-center rounded-2xl border border-dashed border-zinc-200 bg-white p-3 shadow-inner">
        {hasImage ? (
          <div
            className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100"
            style={frameStyle}
          >
            <AdMark kind={disclosureMark} />
            <AdMediaPreview
              mediaType={mediaType}
              mediaUrl={mediaUrl}
              mediaAlt={ad.title}
              aspectClass="h-full w-full"
              showVideoControls={false}
            />
          </div>
        ) : slot.variant === "mobileStrip" || slot.variant === "listingStrip" ? (
          <div
            className={`relative flex w-full items-center justify-between gap-3 border border-zinc-900/10 bg-zinc-950 ${
              slot.variant === "listingStrip" ? "rounded-xl px-3 py-2.5" : "rounded-[16px] px-4 py-3"
            }`}
            style={frameStyle}
          >
            <AdMark kind={disclosureMark} />
            <p
              className={`font-semibold text-white ${
                slot.variant === "listingStrip" ? "text-xs" : "text-sm"
              }`}
            >
              {ad.title || "Заголовок"}
            </p>
            <span
              className={`shrink-0 rounded-[10px] bg-[#FF4F12] font-semibold text-white ${
                slot.variant === "listingStrip" ? "px-2 py-1 text-[10px]" : "px-3 py-1.5 text-xs"
              }`}
            >
              {ad.cta || "Кнопка"}
            </span>
          </div>
        ) : slot.variant === "leaderboard" ? (
          <div
            className={`relative flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${styles.border} ${styles.bg}`}
            style={frameStyle}
          >
            <AdMark kind={disclosureMark} />
            <div className="flex min-w-0 items-center gap-3">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${styles.icon}`}>
                ♥
              </span>
              <div className="min-w-0">
                <p className={`text-[10px] font-semibold uppercase tracking-wide ${styles.label}`}>
                  {ad.advertiser || "Рекламодатель"}
                </p>
                <p className="truncate text-sm font-semibold text-zinc-950">{ad.title || "Заголовок"}</p>
              </div>
            </div>
            <span className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-white ${styles.button}`}>
              {ad.cta || "Кнопка"} →
            </span>
          </div>
        ) : (
          <div
            className={`relative flex w-full flex-col items-center justify-center rounded-2xl border px-4 py-5 text-center ${styles.border} ${styles.bg}`}
            style={frameStyle}
          >
            <AdMark kind={disclosureMark} />
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${styles.icon}`}>↗</span>
            <p className={`mt-2 text-[10px] font-semibold uppercase tracking-wide ${styles.label}`}>
              {ad.advertiser || "Рекламодатель"}
            </p>
            <p className="mt-1 text-base font-semibold text-zinc-950">{ad.title || "Заголовок"}</p>
            <span className={`mt-4 rounded-lg px-3 py-1.5 text-xs font-semibold text-white ${styles.button}`}>
              {ad.cta || "Кнопка"} →
            </span>
          </div>
        )}
      </div>

      <p className="mt-2 text-center text-[11px] text-zinc-400">
        Превью в масштабе сайта · {slot.designWidth}×{slot.designHeight} px
        {slot.displayWidth < slot.designWidth
          ? ` · колонка ${slot.displayWidth}px`
          : null}
      </p>
      <p className="mt-1 text-[11px] text-zinc-400">
        Ссылка: {ad.href || "—"}
        {ad.erid ? ` · ${ad.erid}` : ""}
      </p>
    </div>
  )
}
