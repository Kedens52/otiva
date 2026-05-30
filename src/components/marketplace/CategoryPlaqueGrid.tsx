"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export type CategoryPlaqueItem = {
  slug: string
  title: string
  hint: string | null
  href: string
  bg: string
  icon: string
  onClick?: () => void
}

/** Десктоп: 5 колонок × 2 строки основных категорий. */
export const DESKTOP_MAIN_CATEGORY_COUNT = 10

type CategoryPlaqueGridProps = {
  heading: string
  subheading: string
  allCategoriesHref: string
  allCategoriesLabel?: string
  items: CategoryPlaqueItem[]
  ariaLabel: string
  accentClassName?: string
  /** Сколько плашек на десктопе без листания (5×2). На мобильных — все items в ленте. */
  desktopMainCount?: number
  /** Компактные плашки для /kyplu */
  compact?: boolean
}

const DEFAULT_ACCENT = "text-[#FF5A00]"

export function CategoryPlaqueGrid({
  heading,
  subheading,
  allCategoriesHref,
  allCategoriesLabel = "Все категории",
  items,
  ariaLabel,
  accentClassName = DEFAULT_ACCENT,
  desktopMainCount = DESKTOP_MAIN_CATEGORY_COUNT,
  compact = false,
}: CategoryPlaqueGridProps) {
  const desktopItems = items.slice(0, desktopMainCount)

  return (
    <section
      className={cn(
        "overflow-hidden rounded-[20px] border border-[#E5E7EB] bg-white shadow-[0_2px_12px_rgba(15,23,42,0.04)]",
        compact ? "p-3 sm:p-4" : "p-4 sm:p-5",
      )}
    >
      <div className={cn("flex items-start justify-between gap-3", compact ? "mb-2" : "mb-3")}>
        <div className="min-w-0">
          <h2 className={cn("font-semibold text-[#111827]", compact ? "text-base" : "text-[18px]")}>
            {heading}
          </h2>
          <p
            className={cn(
              "mt-0.5 text-[#6B7280]",
              compact ? "line-clamp-1 text-xs sm:line-clamp-none sm:text-sm" : "text-sm",
            )}
          >
            {subheading}
          </p>
        </div>
        <Link
          href={allCategoriesHref}
          className={cn(
            "shrink-0 pt-0.5 font-medium underline-offset-2 transition hover:underline",
            compact ? "text-xs sm:text-sm" : "text-sm",
            accentClassName,
          )}
        >
          {allCategoriesLabel}
        </Link>
      </div>

      {/* Mobile: single-row horizontal scroll, compact cards */}
      <div
        className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden"
        aria-label={ariaLabel}
      >
        {items.map((c) => (
          <CategoryPlaque
            key={c.slug}
            item={c}
            accentClassName={accentClassName}
            compact={true}
            className="w-[140px] shrink-0"
          />
        ))}
      </div>

      <div
        className={cn("hidden grid-cols-5 lg:grid", compact ? "gap-2" : "gap-2.5")}
        aria-label={ariaLabel}
      >
        {desktopItems.map((c) => (
          <CategoryPlaque
            key={c.slug}
            item={c}
            accentClassName={accentClassName}
            compact={compact}
            className={compact ? "min-h-[84px] w-full" : "min-h-[112px] w-full"}
          />
        ))}
      </div>
    </section>
  )
}

function CategoryPlaque({
  item,
  className = "",
  accentClassName,
  compact = false,
}: {
  item: CategoryPlaqueItem
  className?: string
  accentClassName: string
  compact?: boolean
}) {
  return (
    <Link
      href={item.href}
      onClick={item.onClick}
      style={{ backgroundColor: item.bg }}
      className={cn(
        "group relative flex flex-col overflow-hidden border border-white/70 shadow-[0_2px_10px_rgba(15,23,42,0.05)] transition hover:brightness-[0.97] active:brightness-[0.93]",
        compact ? "rounded-xl" : "rounded-[16px]",
        className,
      )}
    >
      <div
        className={cn(
          "relative z-10 flex flex-1 flex-col",
          compact ? "min-h-[76px] p-2 pr-10" : "min-h-[108px] p-3 pr-12",
        )}
      >
        <span
          className={cn(
            "block font-bold leading-snug text-zinc-900",
            compact ? "text-[12px] leading-tight sm:text-[13px]" : "text-[13px] sm:text-[14px]",
          )}
        >
          {item.title}
        </span>
        {item.hint ? (
          <span
            className={cn(
              "leading-snug text-zinc-600/90",
              compact ? "mt-0.5 line-clamp-1 text-[10px]" : "mt-1 line-clamp-2 text-[11px]",
            )}
          >
            {item.hint}
          </span>
        ) : null}
        {!compact ? (
          <span
            className={cn(
              "mt-auto pt-2 text-[11px] font-semibold opacity-80 transition group-hover:opacity-100",
              accentClassName,
            )}
          >
            Смотреть →
          </span>
        ) : null}
      </div>
      <CategoryVisual slug={item.slug} icon={item.icon} compact={compact} />
    </Link>
  )
}

function CategoryVisual({
  slug,
  icon,
  compact,
}: {
  slug: string
  icon: string
  compact?: boolean
}) {
  const [failed, setFailed] = useState(false)
  return (
    <div
      className={cn(
        "absolute bottom-0 right-0 flex items-end justify-end",
        compact ? "h-10 w-10 pb-0.5 pr-0.5" : "h-14 w-14 pb-1 pr-1",
      )}
    >
      {failed ? (
        <span className={cn("opacity-80", compact ? "text-lg" : "text-2xl")} aria-hidden>
          {icon}
        </span>
      ) : (
        <img
          src={`/categories/${slug}.svg`}
          alt=""
          className={cn("object-contain opacity-85", compact ? "h-8 w-8" : "h-11 w-11")}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  )
}
