"use client"

import { AdMark } from "@/components/ads/AdMark"
import { useBannerSlot } from "@/components/ads/BannerSlotsProvider"
import { AdMediaPreview } from "@/components/ads/AdMediaPreview"
import { AdSlotSkeleton } from "@/components/marketplace/AdSlotSkeleton"
import { resolveBannerSlotMedia } from "@/lib/ads/banner-slot-media"
import {
  getAdSlotAspectRatio,
  getAdSlotDefinition,
  getTrackedAdHref,
  trackAdClick,
  trackAdImpression,
  type AdSlotId,
  type ManagedAd,
} from "@/lib/ad-store"
import { useEffect, useRef } from "react"

type AdSlotProps = {
  slot: AdSlotId
  variant?: "leaderboard" | "mobileStrip" | "listingStrip" | "box" | "tall"
  tone?: "orange" | "blue"
}

const toneClasses = {
  orange: {
    border: "border-[hsl(var(--nashlo-orange)/0.18)] hover:border-[hsl(var(--nashlo-orange)/0.45)]",
    bg: "bg-[linear-gradient(120deg,rgba(255,246,240,0.95),rgba(255,255,255,1))]",
    icon: "bg-[hsl(var(--nashlo-orange)/0.12)] text-[hsl(var(--nashlo-orange))]",
    label: "text-[hsl(var(--nashlo-orange))]",
    button: "bg-[hsl(var(--nashlo-orange))] shadow-[hsl(var(--nashlo-orange)/0.25)]",
    hint: "text-orange-300",
  },
  blue: {
    border: "border-[hsl(var(--nashlo-blue)/0.18)] hover:border-[hsl(var(--nashlo-blue)/0.45)]",
    bg: "bg-[linear-gradient(160deg,rgba(239,248,255,1),rgba(255,255,255,1))]",
    icon: "bg-[hsl(var(--nashlo-blue)/0.1)] text-[hsl(var(--nashlo-blue))]",
    label: "text-[hsl(var(--nashlo-blue))]",
    button: "bg-[hsl(var(--nashlo-blue))] shadow-[hsl(var(--nashlo-blue)/0.22)]",
    hint: "text-sky-300",
  },
}

const fallback: Record<AdSlotId, Pick<ManagedAd, "title" | "subtitle" | "cta" | "href" | "advertiser" | "erid" | "ordName">> = {
  leaderboard: {
    title: "Ваша реклама помогает Нашло развиваться",
    subtitle: "Мы вкладываем поддержку партнёров в новые функции, модерацию и удобный поиск.",
    cta: "Поддержать рекламой",
    href: "/advertising",
    advertiser: "Место партнёра",
    erid: "",
    ordName: "",
  },
  mobileLeaderboard: {
    title: "Здесь может быть ваша реклама",
    subtitle: "На главной Nashlo",
    cta: "Разместить",
    href: "/advertising",
    advertiser: "Реклама",
    erid: "",
    ordName: "",
  },
  sidebarTop: {
    title: "Помогите проекту расти",
    subtitle: "Ваша реклама поддерживает развитие сервиса и помогает нам делать поиск лучше.",
    cta: "Разместиться",
    href: "/advertising",
    advertiser: "Место партнёра",
    erid: "",
    ordName: "",
  },
  sidebarTall: {
    title: "Продвигайте бизнес и поддерживайте Нашло",
    subtitle: "Партнёрские размещения помогают развивать мобильную версию, фильтры и безопасность сделок.",
    cta: "Узнать условия",
    href: "/advertising",
    advertiser: "Реклама с пользой",
    erid: "",
    ordName: "",
  },
  listingSidebar: {
    title: "Здесь может быть ваша реклама",
    subtitle: "Под карточкой объявления",
    cta: "Подробнее",
    href: "/advertising",
    advertiser: "Реклама",
    erid: "",
    ordName: "",
  },
}

export function AdSlot({ slot, variant: variantProp, tone: toneProp }: AdSlotProps) {
  const { ad, ready } = useBannerSlot(slot)
  const impressionSent = useRef<string | null>(null)

  const slotDef = getAdSlotDefinition(slot)
  const variant = variantProp ?? slotDef.variant
  const tone = toneProp ?? slotDef.tone
  const styles = toneClasses[tone]

  useEffect(() => {
    if (!ready || !ad?.id || impressionSent.current === ad.id) return
    impressionSent.current = ad.id
    trackAdImpression(ad.id)
  }, [ready, ad?.id])

  if (!ready) {
    return <AdSlotSkeleton slot={slot} variant={variant} />
  }

  const data = ad ?? fallback[slot]
  const isManaged = Boolean(ad)
  const disclosureMark = ad?.disclosureMark ?? "ad"

  const href = ad ? getTrackedAdHref(ad) : data.href

  function handleClick() {
    if (ad?.id) trackAdClick(ad.id)
  }

  if (isManaged && ad?.image) {
    const rounded =
      variant === "mobileStrip" || variant === "listingStrip"
        ? "rounded-[16px]"
        : variant === "leaderboard"
          ? "rounded-3xl"
          : "rounded-2xl"
    const { mediaType, mediaUrl } = resolveBannerSlotMedia(ad)

    return (
      <a
        key={ad.id}
        href={href}
        onClick={handleClick}
        className={`group relative block w-full overflow-hidden border border-zinc-200 bg-zinc-100 shadow-[0_1px_6px_rgba(17,24,39,0.035)] transition hover:shadow-md ${rounded}`}
        style={{ aspectRatio: getAdSlotAspectRatio(slotDef) }}
        title={data.title}
        aria-label={data.title}
      >
        <AdMark kind={disclosureMark} />
        <AdMediaPreview
          mediaType={mediaType}
          mediaUrl={mediaUrl}
          mediaAlt={data.title}
          aspectClass="h-full w-full"
          showVideoControls={false}
          className="h-full transition duration-300 group-hover:scale-[1.01]"
        />
      </a>
    )
  }

  if (variant === "mobileStrip" || variant === "listingStrip") {
    const compact = variant === "listingStrip"

    return (
      <a
        href={href}
        onClick={handleClick}
        className={`group relative flex w-full items-center justify-between overflow-hidden border border-zinc-200 bg-[linear-gradient(135deg,rgba(249,250,251,1),rgba(255,255,255,1))] shadow-[0_1px_6px_rgba(17,24,39,0.06)] transition hover:border-zinc-300 hover:shadow-md ${
          compact ? "rounded-xl px-3 py-2.5" : "rounded-[16px] px-4 py-3"
        }`}
        style={{ aspectRatio: getAdSlotAspectRatio(slotDef) }}
        title={data.title}
      >
        <AdMark kind={disclosureMark} />
        <div className="min-w-0 flex-1 pr-2">
          <p
            className={`line-clamp-2 font-semibold leading-snug text-zinc-950 ${
              compact ? "text-[13px]" : "text-[15px]"
            }`}
          >
            {data.title}
          </p>
          {data.subtitle ? (
            <p className={`mt-0.5 line-clamp-1 text-zinc-500 ${compact ? "text-[11px]" : "text-[12px]"}`}>
              {data.subtitle}
            </p>
          ) : null}
        </div>
        <span
          className={`shrink-0 rounded-[10px] bg-[hsl(var(--nashlo-orange))] font-semibold text-white ${
            compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-[12px]"
          }`}
        >
          {data.cta}
        </span>
        {isManaged && data.erid ? (
          <span className="absolute bottom-1 right-2 text-[9px] text-zinc-400">{data.erid}</span>
        ) : null}
      </a>
    )
  }

  if (variant === "leaderboard") {
    return (
      <a
        href={href}
        onClick={handleClick}
        className={`group relative flex w-full items-center justify-between overflow-hidden rounded-3xl border px-4 py-3 shadow-sm transition hover:shadow-md sm:px-8 ${styles.border} ${styles.bg}`}
        style={{ aspectRatio: getAdSlotAspectRatio(slotDef) }}
        title={data.title}
      >
        <AdMark kind={disclosureMark} />
        <div className="flex min-w-0 items-center gap-4">
          {isManaged && ad?.image ? (
            <img src={ad.image} alt="" className="h-16 w-24 shrink-0 rounded-2xl object-cover shadow-sm" />
          ) : (
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl ${styles.icon}`}>♥</span>
          )}
          <div className="min-w-0">
            <p className={`text-sm font-semibold uppercase tracking-[0.12em] ${styles.label}`}>{data.advertiser}</p>
            <p className="mt-0.5 truncate text-base font-semibold text-zinc-950">{data.title}</p>
            <p className="mt-1 line-clamp-1 text-sm text-zinc-500">{data.subtitle}</p>
          </div>
        </div>
        <span className={`ml-4 shrink-0 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition group-hover:scale-[1.02] ${styles.button}`}>
          {data.cta} →
        </span>
        <span className={`absolute bottom-2 right-4 text-[10px] font-medium ${styles.hint}`}>
          {isManaged ? data.erid : "минимум 1 месяц"}
        </span>
      </a>
    )
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      className={`group relative flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl border px-5 text-center shadow-sm transition hover:shadow-md ${styles.border} ${styles.bg}`}
      style={{ aspectRatio: getAdSlotAspectRatio(slotDef) }}
      title={data.title}
    >
      <AdMark kind={disclosureMark} />
      {isManaged && ad?.image ? (
        <img src={ad.image} alt="" className="mb-4 h-24 w-full rounded-2xl object-cover shadow-sm" />
      ) : (
        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${styles.icon}`}>{variant === "tall" ? "↗" : "♥"}</span>
      )}
      <p className={`mt-3 text-sm font-semibold uppercase tracking-[0.12em] ${styles.label}`}>{data.advertiser}</p>
      <p className="mt-2 text-lg font-semibold leading-6 text-zinc-950">{data.title}</p>
      <p className="mt-2 line-clamp-3 text-sm leading-5 text-zinc-500">{data.subtitle}</p>
      <span className={`mt-5 mb-5 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition group-hover:scale-[1.02] ${styles.button}`}>
        {data.cta} →
      </span>
      <span className={`absolute bottom-3 right-4 text-[10px] font-medium ${styles.hint}`}>
        {isManaged ? data.erid : variant === "tall" ? "модерация вручную" : "от 1 месяца"}
      </span>
    </a>
  )
}
