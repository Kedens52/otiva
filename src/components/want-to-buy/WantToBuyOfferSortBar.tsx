"use client"

import {
  WANT_TO_BUY_OFFER_SORT_OPTIONS,
  type WantToBuyOfferSortKey,
} from "@/lib/want-to-buy/offer-sort"
import { cn } from "@/lib/utils"

type WantToBuyOfferSortBarProps = {
  value: WantToBuyOfferSortKey
  onChange: (value: WantToBuyOfferSortKey) => void
  className?: string
}

export function WantToBuyOfferSortBar({ value, onChange, className }: WantToBuyOfferSortBarProps) {
  const active = WANT_TO_BUY_OFFER_SORT_OPTIONS.find((o) => o.value === value)

  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Сортировка откликов</p>
        {active?.hint ? <p className="mt-0.5 text-xs text-zinc-400">{active.hint}</p> : null}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {WANT_TO_BUY_OFFER_SORT_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition",
              value === option.value
                ? "bg-[hsl(var(--nashlo-orange))] text-white shadow-sm"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
