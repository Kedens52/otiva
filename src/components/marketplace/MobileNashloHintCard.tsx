"use client"

import Link from "next/link"
import { useCallback, useMemo, useState } from "react"
import {
  dismissHintSession,
  isHintDismissedSession,
  mobileNashloHintSessionKey,
  NASHLO_MOBILE_HINTS,
  type NashloMobileHintVariant,
} from "@/lib/mobile-nashlo-hints"

type MobileNashloHintCardProps = {
  variant: NashloMobileHintVariant
  /** Уникальный контекст страницы и позиции, чтобы закрытие было отдельным по слотам */
  scope: string
  slot: number
}

export function MobileNashloHintCard({ variant, scope, slot }: MobileNashloHintCardProps) {
  const key = useMemo(() => mobileNashloHintSessionKey(scope, variant, slot), [scope, variant, slot])
  const [gone, setGone] = useState(() => isHintDismissedSession(key))
  const cfg = NASHLO_MOBILE_HINTS[variant]

  const close = useCallback(() => {
    dismissHintSession(key)
    setGone(true)
  }, [key])

  if (gone) return null

  return (
    <div className="col-span-2 rounded-2xl border border-white/80 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.05)] sm:col-span-full lg:hidden">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-600">
          Подсказка Нашло
        </span>
        <button
          type="button"
          onClick={close}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-200/80 hover:text-zinc-700"
          aria-label="Скрыть подсказку"
        >
          ×
        </button>
      </div>
      <p className="text-sm font-semibold leading-snug text-zinc-950">{cfg.title}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-zinc-600">{cfg.description}</p>
      <div className="mt-3">
        {cfg.dismissOnly ? (
          <button
            type="button"
            onClick={close}
            className="rounded-xl bg-[hsl(var(--nashlo-orange))] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[hsl(var(--nashlo-orange)/0.92)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--nashlo-orange)/0.30)]"
          >
            {cfg.cta}
          </button>
        ) : cfg.href ? (
          <Link
            href={cfg.href}
            onClick={close}
            className="inline-flex rounded-xl bg-[hsl(var(--nashlo-orange))] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[hsl(var(--nashlo-orange)/0.92)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--nashlo-orange)/0.30)]"
          >
            {cfg.cta}
          </Link>
        ) : null}
      </div>
    </div>
  )
}
