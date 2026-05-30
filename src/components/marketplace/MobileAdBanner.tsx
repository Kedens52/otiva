"use client"

import { useState } from "react"
import { AdMark } from "@/components/ads/AdMark"

// Small ad strip above the bottom nav on mobile
// Replace href and content with your actual ad partner
const AD_CONFIG = {
  text: "Реклама на Нашло — для продавцов и бизнеса",
  cta: "Узнать →",
  href: "/advertising",
  bg: "from-[hsl(var(--nashlo-orange)/0.08)] to-[hsl(var(--nashlo-orange)/0.04)]",
  color: "text-[hsl(var(--nashlo-orange))]",
}

export function MobileAdBanner() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+var(--nashlo-mobile-nav-h)+0.375rem)] z-30 lg:hidden"
    >
      <div
        className={`pointer-events-auto relative mx-2.5 flex min-h-[var(--nashlo-mobile-ad-h)] items-center gap-2 rounded-xl border border-white/60 bg-white/80 py-2 pl-14 pr-3 shadow-[0_4px_20px_rgba(15,23,42,0.08)] backdrop-blur-xl ${AD_CONFIG.bg}`}
      >
        <AdMark className="left-1.5 top-1.5 bg-black/50" />
        <a href={AD_CONFIG.href} className="min-w-0 flex-1">
          <p className={`truncate text-[12px] font-medium leading-tight ${AD_CONFIG.color}`}>
            {AD_CONFIG.text}
            <span className="ml-1 font-semibold">{AD_CONFIG.cta}</span>
          </p>
        </a>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-200/70 text-xs text-zinc-500 transition active:bg-zinc-300"
          aria-label="Закрыть рекламу"
        >
          ×
        </button>
      </div>
    </div>
  )
}
