import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { OfferStatusBadge } from "@/components/want-to-buy/OfferStatusBadge"
import { formatPrice } from "@/lib/listing-types"
import { UserRound } from "lucide-react"

export type OfferCardData = {
  id: string
  message: string
  price: number
  status: string
  listingPath: string | null
  createdAt: string
  seller: {
    id: string
    name: string | null
    avatar: string | null
    rating: number
    reviewCount: number
    isVerified: boolean
  }
}

type OfferCardProps = {
  offer: OfferCardData
  /** Подсветка лучшего предложения по цене */
  highlight?: "top_price" | null
}

export function OfferCard({ offer, highlight }: OfferCardProps) {
  return (
    <article
      className={
        highlight === "top_price"
          ? "rounded-[18px] border-2 border-[hsl(var(--nashlo-orange)/0.35)] bg-[#FFFBF8] p-5 shadow-sm"
          : "rounded-[18px] border border-[rgba(15,23,42,0.06)] bg-white p-5 shadow-sm"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="h-11 w-11">
            <AvatarImage src={offer.seller.avatar ?? undefined} alt="" />
            <AvatarFallback>
              <UserRound className="h-5 w-5 text-zinc-400" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-semibold text-[#000000]">
              {offer.seller.name?.trim() || "Продавец"}
              {offer.seller.isVerified ? (
                <span className="ml-1 text-xs text-[hsl(var(--nashlo-orange))]">✓</span>
              ) : null}
            </p>
            {offer.seller.reviewCount > 0 ? (
              <p className="text-xs text-[#4B4B4B]">
                ★ {offer.seller.rating.toFixed(1)} · {offer.seller.reviewCount} отзывов
              </p>
            ) : (
              <p className="text-xs text-[#4B4B4B]">Продавец на Нашло</p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {highlight === "top_price" ? (
            <span className="rounded-full bg-[hsl(var(--nashlo-orange))] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              Макс. цена
            </span>
          ) : null}
          <OfferStatusBadge status={offer.status} />
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-[#4B4B4B]">{offer.message}</p>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <span
          className={
            highlight === "top_price"
              ? "text-xl font-bold text-[hsl(var(--nashlo-orange))]"
              : "text-lg font-bold text-[#000000]"
          }
        >
          {formatPrice(offer.price)}
        </span>
        {offer.listingPath ? (
          <Link
            href={offer.listingPath}
            className="font-medium text-[hsl(var(--nashlo-orange))] hover:underline"
          >
            Объявление →
          </Link>
        ) : null}
        <span className="text-[#4B4B4B]">
          {new Date(offer.createdAt).toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </article>
  )
}
