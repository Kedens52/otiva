"use client"

import Link from "next/link"
import { ArrowRight, Eye, MapPin, MessageSquare, UserRound } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { WantToBuyCardItem } from "@/lib/want-to-buy/client-types"
import {
  getWantToBuyCategoryIcon,
  getWantToBuyCategoryTitle,
  WANT_TO_BUY_CATEGORY_BG,
} from "@/lib/want-to-buy/category-display"
import {
  formatWantToBuyOfferCount,
  getWantToBuyCategoryDetails,
} from "@/lib/want-to-buy/category-card-details"
import {
  formatDaysLeft,
  formatWantToBuyPriceMax,
} from "@/lib/want-to-buy/labels"
import { WANT_TO_BUY_SECTION_LABEL } from "@/config/want-to-buy-brand"
import { cn } from "@/lib/utils"
import { getWantToBuyDetailPath, getWantToBuyOfferPath } from "@/lib/want-to-buy/routes"

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
}

export type WantToBuyCardLayout = "grid" | "list"

type WantToBuyCardProps = {
  item: WantToBuyCardItem
  className?: string
  showOfferButton?: boolean
  layout?: WantToBuyCardLayout
  /** Плотная карточка для /kyplu */
  compact?: boolean
}

function WantToBuyTypeBadge({ compact }: { compact?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md bg-[#FF5A00] font-bold uppercase tracking-wide text-white",
        compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]",
      )}
    >
      {WANT_TO_BUY_SECTION_LABEL}
    </span>
  )
}

function CategoryBadge({
  slug,
  nameRu,
  compact,
}: {
  slug: string
  nameRu: string
  compact?: boolean
}) {
  const bg = WANT_TO_BUY_CATEGORY_BG[slug] ?? "#F3F4F6"
  const icon = getWantToBuyCategoryIcon(slug)
  const title = getWantToBuyCategoryTitle(slug, nameRu)

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-full font-semibold text-[#374151]",
        compact ? "gap-1 px-2 py-0.5 text-[10px]" : "gap-1.5 px-2.5 py-1 text-[11px]",
      )}
      style={{ backgroundColor: bg }}
    >
      <span className={cn("leading-none", compact ? "text-xs" : "text-sm")} aria-hidden>
        {icon}
      </span>
      <span className="truncate">{title}</span>
    </span>
  )
}

function CategoryDetailChips({
  item,
  compact,
}: {
  item: WantToBuyCardItem
  compact?: boolean
}) {
  const details = getWantToBuyCategoryDetails(item).slice(0, compact ? 3 : 4)
  if (!details.length) return null

  if (compact) {
    return (
      <p className="mt-1 line-clamp-1 text-[11px] text-[#6B7280]">
        {details.map((d) => `${d.label}: ${d.value}`).join(" · ")}
      </p>
    )
  }

  return (
    <dl className="mt-2 grid gap-1.5 sm:grid-cols-2">
      {details.map((d) => (
        <div
          key={`${d.label}-${d.value}`}
          className="rounded-lg bg-[#F9FAFB] px-2.5 py-1.5 ring-1 ring-[#ECEFF3]"
        >
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
            {d.label}
          </dt>
          <dd className="mt-0.5 text-[12px] font-medium leading-snug text-[#374151]">{d.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function OfferCountBadge({ count, compact }: { count: number; compact?: boolean }) {
  const isEmpty = count === 0
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold",
        compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
        isEmpty ? "bg-[#FFF3EC] text-[#FF5A00]" : "bg-[#ECFDF3] text-[#047857]",
      )}
    >
      {formatWantToBuyOfferCount(count)}
    </span>
  )
}

function BuyerRow({ item, compact }: { item: WantToBuyCardItem; compact?: boolean }) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2", compact && "gap-1.5")}>
      <Avatar className={cn("border border-zinc-100", compact ? "h-7 w-7" : "h-9 w-9")}>
        <AvatarImage src={item.buyer.avatar ?? undefined} alt="" />
        <AvatarFallback>
          <UserRound className={cn("text-zinc-400", compact ? "h-3 w-3" : "h-4 w-4")} />
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate font-semibold text-[#111827]", compact ? "text-xs" : "text-sm")}>
          {item.buyer.name?.trim() || "Покупатель"}
        </p>
        {item.buyer.reviewCount > 0 ? (
          <p className="text-[10px] text-[#6B7280]">★ {item.buyer.rating.toFixed(1)}</p>
        ) : (
          <p className="text-[10px] text-[#9CA3AF]">Новый</p>
        )}
      </div>
      {!compact ? (
        <div className="flex shrink-0 items-center gap-3 text-xs text-[#8A94A6]">
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" aria-hidden />
            {item.views}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" aria-hidden />
            {item.offerCount}
          </span>
        </div>
      ) : null}
    </div>
  )
}

function MetaLine({ item, compact }: { item: WantToBuyCardItem; compact?: boolean }) {
  return (
    <p className={cn("flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[#9CA3AF]", compact ? "text-[10px]" : "text-xs")}>
      {item.city ? (
        <span className="inline-flex items-center gap-0.5">
          <MapPin className="h-3 w-3 shrink-0" aria-hidden />
          {item.city}
        </span>
      ) : null}
      <span>{formatDate(item.createdAt)}</span>
      {compact ? (
        <>
          <span>·</span>
          <span className="inline-flex items-center gap-0.5">
            <Eye className="h-3 w-3" aria-hidden />
            {item.views}
          </span>
        </>
      ) : null}
    </p>
  )
}

function OfferButton({
  offerHref,
  className,
  compact,
}: {
  offerHref: string
  className?: string
  compact?: boolean
}) {
  return (
    <Button
      asChild
      size={compact ? "sm" : "default"}
      className={cn(compact ? "h-8 shrink-0 gap-1 px-3 text-xs" : "w-full", className)}
    >
      <Link href={offerHref}>
        <span className={compact ? "truncate" : undefined}>Предложить товар</span>
        {compact ? <ArrowRight className="h-3 w-3 shrink-0" aria-hidden /> : null}
      </Link>
    </Button>
  )
}

export function WantToBuyCard({
  item,
  className,
  showOfferButton = true,
  layout = "grid",
  compact = false,
}: WantToBuyCardProps) {
  const pathInput = { id: item.id, categorySlug: item.category.slug }
  const href = getWantToBuyDetailPath(pathInput)
  const offerHref = getWantToBuyOfferPath(pathInput)
  const daysLeft = formatDaysLeft(item.expiresAt)
  const categoryBg = WANT_TO_BUY_CATEGORY_BG[item.category.slug] ?? "#F3F4F6"
  const categoryIcon = getWantToBuyCategoryIcon(item.category.slug)
  const accent = categoryBg === "#F3F4F6" ? "#2563EB" : categoryBg

  if (layout === "list") {
    if (compact) {
      return (
        <article
          className={cn(
            "group relative overflow-hidden rounded-xl border border-[rgba(15,23,42,0.06)] bg-white shadow-[0_1px_6px_rgba(15,23,42,0.04)] transition hover:border-[rgba(255,90,0,0.22)] hover:shadow-[0_4px_14px_rgba(15,23,42,0.07)]",
            className,
          )}
        >
          <div className="absolute inset-y-2 left-0 w-0.5 rounded-r-full" style={{ backgroundColor: accent }} aria-hidden />

          <div className="flex items-stretch gap-2.5 p-2.5 pl-3 sm:gap-3 sm:p-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg sm:h-11 sm:w-11"
              style={{ backgroundColor: categoryBg }}
              aria-hidden
            >
              {categoryIcon}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <Link href={href} className="min-w-0 flex-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A00]/30">
                <div className="flex flex-wrap items-center gap-1.5">
                  <WantToBuyTypeBadge compact />
                  <CategoryBadge slug={item.category.slug} nameRu={item.category.nameRu} compact />
                  <OfferCountBadge count={item.offerCount} compact />
                  <span className="text-[10px] font-semibold text-[#FF5A00]">{daysLeft}</span>
                </div>
                <h2 className="mt-1 line-clamp-2 text-[13px] font-semibold leading-snug text-[#111827] group-hover:text-[#FF5A00] sm:text-sm">
                  {item.title}
                </h2>
                <p className="mt-0.5 text-[12px] font-semibold text-[#6B7280]">
                  {formatWantToBuyPriceMax(item.priceMax)}
                </p>
                <CategoryDetailChips item={item} compact />
                <MetaLine item={item} compact />
              </Link>

              <div className="flex shrink-0 items-center justify-between gap-2 sm:w-[168px] sm:flex-col sm:items-stretch sm:justify-center">
                <BuyerRow item={item} compact />
                {showOfferButton ? (
                  <OfferButton offerHref={offerHref} compact className="w-full sm:w-auto" />
                ) : null}
              </div>
            </div>
          </div>
        </article>
      )
    }

    return (
      <article
        className={cn(
          "group relative overflow-hidden rounded-[16px] border border-[rgba(15,23,42,0.06)] bg-white shadow-[0_4px_16px_rgba(15,23,42,0.04)] transition hover:border-[rgba(255,90,0,0.22)] hover:shadow-[0_10px_28px_rgba(15,23,42,0.08)]",
          className,
        )}
      >
        <div
          className="absolute inset-y-0 left-0 w-1"
          style={{ backgroundColor: accent }}
          aria-hidden
        />

        <div className="flex flex-col gap-4 p-4 pl-5 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl sm:h-16 sm:w-16"
            style={{ backgroundColor: categoryBg }}
            aria-hidden
          >
            {categoryIcon}
          </div>

          <Link href={href} className="min-w-0 flex-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A00]/30">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <WantToBuyTypeBadge />
              <CategoryBadge slug={item.category.slug} nameRu={item.category.nameRu} />
              <span className="ml-auto text-xs font-medium text-[#FF5A00] sm:ml-0">{daysLeft}</span>
            </div>

            <h2 className="line-clamp-2 text-base font-semibold leading-snug text-[#111827] group-hover:text-[#FF5A00] sm:text-lg">
              {item.title}
            </h2>
            <p className="mt-1 text-lg font-bold tracking-tight text-[#FF5A00] sm:text-xl">
              {formatWantToBuyPriceMax(item.priceMax)}
            </p>
            {item.description ? (
              <p className="mt-1 line-clamp-2 text-sm text-[#6B7280]">{item.description}</p>
            ) : null}

            <CategoryDetailChips item={item} />

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <OfferCountBadge count={item.offerCount} />
              <MetaLine item={item} />
            </div>
          </Link>

          <div className="flex shrink-0 flex-col items-stretch gap-3 sm:w-[200px] sm:items-end">
            <BuyerRow item={item} compact />
            {showOfferButton ? (
              <OfferButton offerHref={offerHref} compact className="w-full sm:w-auto" />
            ) : null}
          </div>
        </div>
      </article>
    )
  }

  const gridCompact = compact

  return (
    <article
      className={cn(
        "group relative flex h-full min-w-0 flex-col overflow-hidden border border-[rgba(15,23,42,0.06)] bg-white shadow-[0_1px_6px_rgba(15,23,42,0.04)] transition hover:border-[rgba(255,90,0,0.2)] hover:shadow-[0_6px_18px_rgba(15,23,42,0.07)]",
        gridCompact ? "rounded-xl hover:-translate-y-0" : "rounded-[16px] hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(15,23,42,0.08)]",
        className,
      )}
    >
      <div className="absolute inset-y-0 left-0 w-0.5 sm:w-1" style={{ backgroundColor: accent }} aria-hidden />

      <div
        className={cn(
          "flex items-start gap-2.5 border-b border-[rgba(15,23,42,0.05)] pl-3.5",
          gridCompact ? "px-3 py-2.5" : "gap-3 px-4 py-3 pl-5",
        )}
      >
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-lg",
            gridCompact ? "h-9 w-9 text-base" : "h-12 w-12 rounded-xl text-xl",
          )}
          style={{ backgroundColor: categoryBg }}
          aria-hidden
        >
          {categoryIcon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <WantToBuyTypeBadge compact={gridCompact} />
            <CategoryBadge slug={item.category.slug} nameRu={item.category.nameRu} compact={gridCompact} />
            <OfferCountBadge count={item.offerCount} compact={gridCompact} />
            <span className="ml-auto shrink-0 text-[10px] font-semibold text-[#FF5A00]">{daysLeft}</span>
          </div>
        </div>
      </div>

      <Link
        href={href}
        className={cn(
          "flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FF5A00]/25",
          gridCompact ? "px-3 pb-2.5 pl-3.5 pt-2" : "px-4 pb-4 pl-5 pt-3",
        )}
      >
        <h2
          className={cn(
            "line-clamp-2 font-semibold leading-snug text-[#111827] group-hover:text-[#FF5A00]",
            gridCompact ? "text-[14px]" : "text-[16px]",
          )}
        >
          {item.title}
        </h2>
        <p
          className={cn(
            "font-bold leading-tight text-[#FF5A00]",
            gridCompact ? "mt-0.5 text-sm" : "mt-1.5 text-base",
          )}
        >
          {formatWantToBuyPriceMax(item.priceMax)}
        </p>
        {!gridCompact && item.description ? (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#6B7280]">{item.description}</p>
        ) : null}

        <CategoryDetailChips item={item} compact={gridCompact} />

        <div className={cn("border-t border-[rgba(15,23,42,0.05)]", gridCompact ? "mt-2 pt-2" : "mt-4 pt-3")}>
          <BuyerRow item={item} compact={gridCompact} />
          <MetaLine item={item} compact={gridCompact} />
        </div>
      </Link>

      {showOfferButton ? (
        <div className={cn("border-t border-[rgba(15,23,42,0.05)]", gridCompact ? "px-3 py-2" : "px-4 py-3")}>
          <OfferButton offerHref={offerHref} compact={gridCompact} />
        </div>
      ) : null}
    </article>
  )
}

export function WantToBuyCardSkeleton({
  layout = "grid",
  compact = false,
}: {
  layout?: WantToBuyCardLayout
  compact?: boolean
}) {
  if (layout === "list") {
    return (
      <div
        className={cn(
          "animate-pulse rounded-xl border border-zinc-100 bg-white/90",
          compact ? "h-[88px] sm:h-[76px]" : "h-[148px] sm:h-[120px]",
        )}
      />
    )
  }
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl border border-zinc-100 bg-white/90",
        compact ? "h-[200px]" : "h-[280px]",
      )}
    />
  )
}
