"use client"

import { useEffect, useState } from "react"
import { getActiveAd, getTrackedAdHref, trackAdClick, trackAdImpression, type AdSlotId, type ManagedAd } from "@/lib/ad-store"

type AdSlotProps = {
  slot: AdSlotId
  variant: "leaderboard" | "box" | "tall"
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
}

export function AdSlot({ slot, variant, tone = "orange" }: AdSlotProps) {
  const [ad, setAd] = useState<ManagedAd | null>(null)
  const styles = toneClasses[tone]
  const data = ad ?? fallback[slot]
  const isManaged = Boolean(ad)

  useEffect(() => {
    function reload() {
      setAd(getActiveAd(slot))
    }

    reload()
    window.addEventListener("nashlo-ads-change", reload)
    window.addEventListener("storage", reload)
    return () => {
      window.removeEventListener("nashlo-ads-change", reload)
      window.removeEventListener("storage", reload)
    }
  }, [slot])

  useEffect(() => {
    if (!ad?.id) return
    trackAdImpression(ad.id)
  }, [ad?.id])

  const href = ad ? getTrackedAdHref(ad) : data.href

  function handleClick() {
    if (ad?.id) trackAdClick(ad.id)
  }

  if (isManaged && ad?.image) {
    const sizeClass = variant === "leaderboard" ? "h-[96px]" : variant === "tall" ? "h-[300px]" : "h-[250px]"

    return (
      <a
        href={href}
        onClick={handleClick}
        className={`group block w-full overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md ${sizeClass}`}
        title={data.title}
        aria-label={data.title}
      >
        <img src={ad.image} alt={data.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
      </a>
    )
  }

  if (variant === "leaderboard") {
    return (
      <a
        href={href}
        onClick={handleClick}
        className={`group relative flex min-h-[96px] w-full items-center justify-between overflow-hidden rounded-3xl border px-8 shadow-sm transition hover:shadow-md ${styles.border} ${styles.bg}`}
        title={data.title}
      >
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
      className={`group relative flex w-full flex-col items-center justify-center overflow-hidden rounded-3xl border px-5 text-center shadow-sm transition hover:shadow-md ${variant === "tall" ? "h-[300px]" : "h-[250px]"} ${styles.border} ${styles.bg}`}
      title={data.title}
    >
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
