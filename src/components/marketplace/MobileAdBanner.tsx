"use client"

import { useState } from "react"

// Small ad strip above the bottom nav on mobile
// Replace href and content with your actual ad partner
const AD_CONFIG = {
  text: "Разместите рекламу на Нашло — охват 50 000+ пользователей",
  cta: "Узнать →",
  href: "/advertising",
  bg: "from-[hsl(var(--nashlo-orange)/0.08)] to-[hsl(var(--nashlo-orange)/0.04)]",
  color: "text-[hsl(var(--nashlo-orange))]",
}

export function MobileAdBanner() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+3.75rem)] inset-x-0 z-40 lg:hidden">
      <div className={`mx-3 flex items-center justify-between rounded-2xl border border-[hsl(var(--nashlo-orange)/0.15)] bg-gradient-to-r ${AD_CONFIG.bg} px-4 py-2 shadow-sm backdrop-blur-sm`}>
        <a href={AD_CONFIG.href} className="min-w-0 flex-1">
          <p className={`truncate text-xs font-medium ${AD_CONFIG.color}`}>
            <span className="mr-1.5 rounded bg-[hsl(var(--nashlo-orange)/0.12)] px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide">Реклама</span>
            {AD_CONFIG.text}
            <span className="ml-1.5 font-semibold">{AD_CONFIG.cta}</span>
          </p>
        </a>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="ml-3 shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200/70 text-[10px] text-zinc-500 hover:bg-zinc-300"
          aria-label="Закрыть рекламу"
        >
          ×
        </button>
      </div>
    </div>
  )
}
