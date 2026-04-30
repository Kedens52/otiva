"use client"

import { useState } from "react"
import Link from "next/link"
import { listings, formatPrice } from "@/lib/mock-marketplace"
import { ListingCard } from "@/components/marketplace/ListingCard"
import { getReviews, calcRating } from "@/lib/mock-reviews"
import { RatingSummary } from "@/components/reviews/RatingSummary"
import { ReviewCard } from "@/components/reviews/ReviewCard"

// For demo purposes, we create a rich storefront for "Алексей Морозов"
// In production this would fetch from DB by seller slug/id

const DEMO_SELLER = {
  name: "Алексей Морозов",
  slug: "aleksey-morozov",
  avatar: "А",
  avatarTone: "from-zinc-950 to-zinc-700",
  since: "на Отива с 2022",
  verified: true,
  city: "Москва",
  about: "Продаю автомобили с прозрачной историей. Только проверенные машины, все документы на руках. Работаю честно уже 3 года.",
  rating: 4.9,
  reviewCount: 47,
  dealCount: 23,
  responseTime: "~15 минут",
  badge: "Топ продавец",
}

export default function SellerStorefrontPage({ params }: { params: { name: string } }) {
  const [activeTab, setActiveTab] = useState<"listings" | "reviews">("listings")

  // Get seller's listings (in demo, filter by seller name)
  const sellerListings = listings.filter(
    (l) => l.seller.name.toLowerCase().replace(/\s+/g, "-") === params.name ||
            l.seller.name === DEMO_SELLER.name
  )
  const sellerName = sellerListings[0]?.seller.name ?? DEMO_SELLER.name
  const seller = { ...DEMO_SELLER, name: sellerName }

  const reviews = getReviews(sellerName)
  const rating = calcRating(reviews)

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 lg:py-10">
      {/* Hero */}
      <div className="overflow-hidden rounded-[36px] border border-zinc-200 bg-white shadow-sm">
        {/* Banner */}
        <div className={`h-32 bg-gradient-to-br ${seller.avatarTone} sm:h-44`} />

        <div className="relative px-6 pb-6">
          {/* Avatar */}
          <div className={`-mt-10 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${seller.avatarTone} text-2xl font-bold text-white shadow-lg ring-4 ring-white`}>
            {seller.avatar}
          </div>

          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold text-zinc-950 sm:text-3xl">{seller.name}</h1>
                {seller.verified && (
                  <span className="rounded-full bg-[hsl(var(--otiva-mint)/0.12)] px-3 py-1 text-xs font-semibold text-[hsl(var(--otiva-mint))]">
                    ✓ Проверен
                  </span>
                )}
                {seller.badge && (
                  <span className="rounded-full bg-[hsl(var(--otiva-orange)/0.1)] px-3 py-1 text-xs font-semibold text-[hsl(var(--otiva-orange))]">
                    ★ {seller.badge}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-zinc-500">{seller.city} · {seller.since}</p>
              {seller.about && (
                <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-600">{seller.about}</p>
              )}
            </div>
            <Link
              href={`/chat`}
              className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              ✉ Написать продавцу
            </Link>
          </div>

          {/* Stats row */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-zinc-50 p-4 text-center">
              <p className="text-xl font-bold text-zinc-950">{seller.rating}</p>
              <p className="mt-0.5 text-xs text-zinc-500">рейтинг</p>
            </div>
            <div className="rounded-2xl bg-zinc-50 p-4 text-center">
              <p className="text-xl font-bold text-zinc-950">{seller.reviewCount}</p>
              <p className="mt-0.5 text-xs text-zinc-500">отзывов</p>
            </div>
            <div className="rounded-2xl bg-zinc-50 p-4 text-center">
              <p className="text-xl font-bold text-zinc-950">{seller.dealCount}</p>
              <p className="mt-0.5 text-xs text-zinc-500">сделок</p>
            </div>
            <div className="rounded-2xl bg-zinc-50 p-4 text-center">
              <p className="text-xl font-bold text-zinc-950">{seller.responseTime}</p>
              <p className="mt-0.5 text-xs text-zinc-500">ответ</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-2">
        <button
          onClick={() => setActiveTab("listings")}
          className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${activeTab === "listings" ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}
        >
          Объявления ({sellerListings.length})
        </button>
        <button
          onClick={() => setActiveTab("reviews")}
          className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${activeTab === "reviews" ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}
        >
          Отзывы ({rating.count || seller.reviewCount})
        </button>
      </div>

      {/* Content */}
      <div className="mt-5">
        {activeTab === "listings" ? (
          sellerListings.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
              {sellerListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] border border-zinc-200 bg-white py-16 text-center">
              <p className="text-zinc-400">У продавца пока нет активных объявлений</p>
            </div>
          )
        ) : (
          <div className="space-y-5">
            {reviews.length > 0 ? (
              <>
                <RatingSummary reviews={reviews} />
                <div className="grid gap-3 sm:grid-cols-2">
                  {reviews.map((r) => (
                    <ReviewCard key={r.id} review={r} />
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-[28px] border border-zinc-200 bg-white py-16 text-center">
                <p className="text-2xl mb-3">★</p>
                <p className="font-semibold text-zinc-950">Пока нет отзывов</p>
                <p className="mt-1 text-sm text-zinc-500">Отзывы появятся после завершения сделок</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
