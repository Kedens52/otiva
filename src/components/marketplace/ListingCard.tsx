"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Heart, MapPin } from "lucide-react"
import {
  type AppListing,
  categorySlug,
  listingHref,
  formatPrice,
  imageToneForCategory,
  listingThumbnailSrc,
} from "@/lib/listing-types"
import { getListingCardChips } from "@/lib/listings/listing-card-chips"
import { trackListingInterest } from "@/lib/recommendations"
import { cn } from "@/lib/utils"
import { buildListingImageAlt } from "@/lib/seo/image-alt"

type ListingCardProps = {
  listing: AppListing
  href?: string
  /** @deprecated Сетка использует единый компактный вид; оставлено для совместимости API */
  compact?: boolean
  hideFav?: boolean
}

function formatCardDate(value?: string) {
  if (!value) return "сегодня"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "сегодня"
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
}

function formatCardPrice(price: number) {
  if (price > 0) return formatPrice(price)
  if (price === 0) return "Бесплатно"
  return "Цена не указана"
}

export function ListingCard({ listing, href, hideFav = false }: ListingCardProps) {
  const router = useRouter()
  const slug = categorySlug(listing)
  const target = href ?? listingHref(listing)
  const tone = imageToneForCategory(slug)
  const { src: imageSrc, isPhoto } = listingThumbnailSrc(listing.images?.[0], slug)
  const [fav, setFav] = useState(Boolean(listing.favorited))
  const [favPending, setFavPending] = useState(false)

  const attrs = listing.attributes ?? undefined
  const chipsMobile = getListingCardChips(attrs, slug, 3)
  const chipsDesktop = getListingCardChips(attrs, slug, 4)

  const locationLabel = listing.city || listing.district || null
  const dateLabel = formatCardDate(listing.createdAt)

  async function toggleFav(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (favPending) return
    setFavPending(true)
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id }),
      })
      if (res.status === 401) {
        router.push("/login")
        return
      }
      if (res.ok) {
        trackListingInterest(listing, 4)
        setFav((v) => !v)
      }
    } finally {
      setFavPending(false)
    }
  }

  return (
    <Link
      href={target}
      onClick={() => trackListingInterest(listing, 2)}
      className={cn(
        "group flex h-full min-w-0 flex-col overflow-hidden rounded-[18px] border border-[rgba(15,23,42,0.06)] bg-white shadow-[0_4px_16px_rgba(15,23,42,0.04)] transition-[transform,box-shadow,border-color] duration-[180ms] ease-out",
        "hover:-translate-y-0.5 hover:border-[rgba(255,91,31,0.14)] hover:shadow-[0_10px_28px_rgba(15,23,42,0.08)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--nashlo-orange)/0.32)]",
      )}
    >
      <div className={cn("relative aspect-[4/3] overflow-hidden bg-gradient-to-br", tone)}>
        <img
          src={imageSrc}
          alt={buildListingImageAlt(listing.title, listing.city, 0)}
          className={cn(
            "h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]",
            !isPhoto && "object-contain p-6",
          )}
        />

        {listing.isPromoted && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-[hsl(var(--nashlo-orange))] px-[7px] py-1 text-[10px] font-semibold leading-none text-white">
            Продвигается
          </span>
        )}

        {!hideFav && (
          <button
            type="button"
            aria-label={fav ? "Убрать из избранного" : "В избранное"}
            onClick={toggleFav}
            disabled={favPending}
            className={cn(
              "absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full border border-white/90 bg-white text-zinc-600 shadow-[0_2px_8px_rgba(15,23,42,0.12)] transition hover:scale-[1.03] disabled:opacity-60 sm:right-2.5 sm:top-2.5",
              fav && "text-[hsl(var(--nashlo-orange))]",
            )}
          >
            <Heart className={cn("h-4 w-4", fav && "fill-current")} />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3 sm:gap-2 sm:p-3.5">
        <p className="text-[15px] font-bold leading-tight text-[#111827] sm:text-[16px] lg:text-[18px] lg:leading-tight">
          {formatCardPrice(listing.price)}
        </p>

        <h3 className="line-clamp-2 break-words text-[13px] font-medium leading-snug text-[#374151] sm:text-[14px] lg:text-[15px] lg:leading-snug">
          {listing.title}
        </h3>

        {chipsMobile.length > 0 && (
          <div className="flex flex-wrap gap-1 sm:gap-1.5 lg:hidden">
            {chipsMobile.map((chip) => (
              <span
                key={chip}
                className="rounded-full bg-[#F3F4F6] px-[7px] py-[3px] text-[11px] leading-none text-[#6B7280]"
              >
                {chip}
              </span>
            ))}
          </div>
        )}

        {chipsDesktop.length > 0 && (
          <div className="hidden flex-wrap gap-1.5 lg:flex">
            {chipsDesktop.map((chip) => (
              <span
                key={chip}
                className="rounded-full bg-[#F3F4F6] px-[7px] py-[3px] text-[11px] leading-none text-[#6B7280]"
              >
                {chip}
              </span>
            ))}
          </div>
        )}

        {locationLabel ? (
          <p className="mt-auto flex min-w-0 items-center gap-1 pt-0.5 text-[11px] leading-tight text-[#8A94A6] sm:text-[11px] lg:text-xs">
            <MapPin className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
            <span className="truncate">{locationLabel}</span>
            <span className="shrink-0 opacity-60">·</span>
            <span className="shrink-0">{dateLabel}</span>
          </p>
        ) : (
          <p className="mt-auto pt-0.5 text-[11px] text-[#8A94A6] sm:text-[11px] lg:text-xs">{dateLabel}</p>
        )}
      </div>
    </Link>
  )
}
