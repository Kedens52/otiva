"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { type AppListing, categorySlug, listingHref, formatPrice, imageToneForCategory } from "@/lib/listing-types"
import { trackListingInterest } from "@/lib/recommendations"

type ListingCardProps = {
  listing: AppListing
  href?: string
  compact?: boolean
  hideFav?: boolean
}

export function ListingCard({ listing, href, compact = false, hideFav = false }: ListingCardProps) {
  const router   = useRouter()
  const slug     = categorySlug(listing)
  const target   = href ?? listingHref(listing)
  const tone     = imageToneForCategory(slug)
  const firstImg = listing.images?.[0]
  const isPhoto  = firstImg && (firstImg.startsWith("http") || firstImg.startsWith("/uploads"))
  const imageSrc = isPhoto ? firstImg : `/categories/${slug}.svg`
  const [fav, setFav] = useState(false)
  const [favPending, setFavPending] = useState(false)

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
      if (res.status === 401) { router.push("/login"); return }
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
      className={`group block min-w-0 overflow-hidden bg-white transition duration-300 hover:-translate-y-1 ${
        compact ? "rounded-2xl" : "rounded-[28px] border border-zinc-200 shadow-sm hover:shadow-xl"
      }`}
    >
      <div className={`relative ${compact ? "h-32 rounded-2xl sm:h-40" : "h-40 sm:h-52"} overflow-hidden bg-gradient-to-br ${tone}`}>
        <img
          src={imageSrc}
          alt={listing.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
        {listing.city && (
          <div className="absolute left-3 top-3 max-w-[calc(100%-1.5rem)] truncate rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-zinc-900 shadow-sm sm:left-4 sm:top-4 sm:px-3 sm:text-xs">
            {listing.city}
          </div>
        )}
        {listing.isPromoted ? (
          <div className="absolute right-3 top-3 rounded-full bg-zinc-950 px-2.5 py-1 text-[11px] font-medium text-white shadow-sm sm:right-4 sm:top-4 sm:px-3 sm:text-xs">
            Продвигается
          </div>
        ) : !hideFav ? (
          <button
            type="button"
            aria-label={fav ? "Убрать из избранного" : "В избранное"}
            onClick={toggleFav}
            className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full shadow-sm backdrop-blur-sm transition sm:right-3 sm:top-3 sm:h-9 sm:w-9 ${
              fav
                ? "bg-red-500/90 text-white"
                : "bg-white/80 text-zinc-400 hover:bg-white hover:text-red-400"
            } ${favPending ? "opacity-50" : ""}`}
          >
            <span className="text-base leading-none">{fav ? "♥" : "♡"}</span>
          </button>
        ) : null}
      </div>
      <div className={compact ? "min-w-0 space-y-1 py-3" : "min-w-0 space-y-2 p-3 sm:space-y-4 sm:p-5"}>
        <div className="min-w-0">
          <div className={compact ? "min-w-0 space-y-1" : "min-w-0 sm:flex sm:items-start sm:justify-between sm:gap-4"}>
            <h3 className={`${compact ? "truncate text-sm font-semibold sm:text-base" : "min-w-0 truncate text-base font-semibold sm:text-lg"} leading-tight text-zinc-950`}>
              {listing.title}
            </h3>
            <span className={`${compact ? "block truncate text-sm sm:text-base" : "mt-1 block truncate text-base sm:mt-0 sm:shrink-0 sm:text-lg"} font-semibold text-zinc-950`}>
              {formatPrice(listing.price)}
            </span>
          </div>
          {!compact && listing.description && (
            <p className="mt-1 line-clamp-2 text-xs text-zinc-500 sm:text-sm">
              {listing.description}
            </p>
          )}
        </div>
        {listing.seller && (
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-bold text-zinc-700">
              {listing.seller.name?.slice(0, 1).toUpperCase() ?? "?"}
            </div>
            <span className="truncate text-xs text-zinc-500">
              {listing.seller.name ?? "Продавец"}
              {listing.seller.isVerified && (
                <span className="ml-1 text-[hsl(var(--nashlo-blue))]">&#10003;</span>
              )}
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}
