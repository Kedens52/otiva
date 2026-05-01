import Link from "next/link"
import type { MarketplaceListing } from "@/lib/mock-marketplace"
import { formatPrice } from "@/lib/mock-marketplace"

type ListingCardProps = {
  listing: MarketplaceListing
  href?: string
  compact?: boolean
}

export function ListingCard({ listing, href, compact = false }: ListingCardProps) {
  const target = href ?? (listing.category === "cars" ? `/cars/${listing.id}` : "#")
  const imageSrc = `/listings/${listing.category}.svg`

  return (
    <Link
      href={target}
      className={`group block min-w-0 overflow-hidden bg-white transition duration-300 hover:-translate-y-1 ${
        compact ? "rounded-2xl" : "rounded-[28px] border border-zinc-200 shadow-sm hover:shadow-xl"
      }`}
    >
      <div className={`relative ${compact ? "h-32 rounded-2xl sm:h-40" : "h-40 sm:h-52"} overflow-hidden bg-gradient-to-br ${listing.imageTone}`}>
        <img src={imageSrc} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
        <div className="absolute left-3 top-3 max-w-[calc(100%-1.5rem)] truncate rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-zinc-900 shadow-sm sm:left-4 sm:top-4 sm:px-3 sm:text-xs">
          {listing.city}
        </div>
        {listing.promoted && (
          <div className="absolute right-3 top-3 rounded-full bg-zinc-950 px-2.5 py-1 text-[11px] font-medium text-white shadow-sm sm:right-4 sm:top-4 sm:px-3 sm:text-xs">
            Продвигается
          </div>
        )}
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
          <p className="mt-1 truncate text-xs text-zinc-500 sm:text-sm">{listing.subtitle}</p>
        </div>
        {!compact && (
          <div className="hidden flex-wrap gap-2 sm:flex">
            {listing.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
