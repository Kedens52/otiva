import { notFound } from "next/navigation"
import { ListingCard } from "@/components/marketplace/ListingCard"
import { listings } from "@/lib/mock-marketplace"
import { getReviews } from "@/lib/mock-reviews"
import { RatingSummary } from "@/components/reviews/RatingSummary"
import { ReviewCard } from "@/components/reviews/ReviewCard"

const sellers = listings.map((l) => l.seller).filter((s, i, arr) => arr.findIndex((x) => x.name === s.name) === i)

export default function PublicProfilePage({ params }: { params: { id: string } }) {
  const seller =
    sellers.find((s) => s.name.toLowerCase().replace(/\s+/g, "-") === params.id) ??
    sellers[Number(params.id) - 1]

  if (!seller) notFound()

  const sellerListings = listings.filter((l) => l.seller.name === seller.name)
  const reviews = getReviews(seller.name)

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 lg:py-12">
      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-950 text-3xl font-semibold text-white">
              {seller.name.slice(0, 1)}
            </div>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-zinc-950">{seller.name}</h1>
            <p className="mt-1 text-sm text-zinc-500">{seller.since}</p>

            <div className="mt-4 flex items-center gap-2">
              <span className="text-lg font-bold text-zinc-950">{seller.rating}</span>
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map((s) => (
                  <span key={s} className={`text-base ${s <= Math.round(seller.rating) ? "text-[hsl(var(--otiva-orange))]" : "text-zinc-200"}`}>★</span>
                ))}
              </div>
              <span className="text-sm text-zinc-500">({reviews.length})</span>
            </div>

            {seller.verified && (
              <div className="mt-4 rounded-2xl bg-[hsl(var(--otiva-mint)/0.12)] px-4 py-2.5 text-sm font-semibold text-[hsl(var(--otiva-mint))]">
                ✓ Проверенный продавец
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-zinc-50 p-3 text-center">
                <p className="text-xl font-semibold text-zinc-950">{sellerListings.length}</p>
                <p className="mt-0.5 text-xs text-zinc-500">объявлений</p>
              </div>
              <div className="rounded-2xl bg-zinc-50 p-3 text-center">
                <p className="text-xl font-semibold text-zinc-950">{reviews.length}</p>
                <p className="mt-0.5 text-xs text-zinc-500">отзывов</p>
              </div>
            </div>

            <button className="mt-4 w-full rounded-2xl bg-[hsl(var(--otiva-orange))] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[hsl(var(--otiva-orange)/0.9)]">
              Написать продавцу
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="space-y-8">
          {/* Listings */}
          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
              Объявления продавца
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {(sellerListings.length > 0 ? sellerListings : listings.slice(0, 2)).map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  href={listing.category === "cars" ? `/cars/${listing.id}` : `/listings/${listing.id}`}
                />
              ))}
            </div>
          </section>

          {/* Reviews */}
          <section>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
                Отзывы
              </h2>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-semibold text-zinc-600">
                {reviews.length}
              </span>
            </div>

            {reviews.length > 0 ? (
              <>
                <div className="mt-5 rounded-[24px] border border-zinc-200 bg-white p-5 shadow-sm">
                  <RatingSummary reviews={reviews} />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {reviews.map((r) => (
                    <ReviewCard key={r.id} review={r} />
                  ))}
                </div>
              </>
            ) : (
              <div className="mt-4 rounded-[24px] border border-zinc-200 bg-white p-8 text-center">
                <p className="text-4xl">💬</p>
                <p className="mt-3 font-semibold text-zinc-950">Отзывов пока нет</p>
                <p className="mt-1 text-sm text-zinc-500">Будьте первым — купите товар у этого продавца</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
