"use client"

import Link from "next/link"
import { WANT_TO_BUY_SECTION_LABEL } from "@/config/want-to-buy-brand"
import { getWantToBuyHubPath } from "@/lib/want-to-buy/routes"
import { cn } from "@/lib/utils"

export type SiteMode = "sell" | "want"

export function ModeSwitcher({
  mode,
  className,
}: {
  mode: SiteMode
  className?: string
}) {
  return (
    <div
      role="group"
      aria-label="Режим: объявления или заявки «Куплю»"
      className={cn(
        "inline-flex min-h-11 gap-1 rounded-2xl border border-[#E5E7EB] bg-white/90 p-1 shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        className,
      )}
    >
      <Link
        href="/"
        title="Ищите товары и услуги, которые продают"
        className={cn(
          "inline-flex min-h-9 items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition",
          mode === "sell"
            ? "bg-[#111827] font-semibold text-white shadow-sm"
            : "text-[#4B5563] hover:text-black",
        )}
      >
        Объявления
      </Link>
      <Link
        href={getWantToBuyHubPath()}
        title="Смотрите заявки покупателей или создайте свою"
        className={cn(
          "inline-flex min-h-9 items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition",
          mode === "want"
            ? "bg-[hsl(var(--nashlo-orange))] font-semibold text-white shadow-sm"
            : "text-[#4B5563] hover:text-black",
        )}
      >
        {WANT_TO_BUY_SECTION_LABEL}
      </Link>
    </div>
  )
}
