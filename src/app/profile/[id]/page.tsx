import { notFound } from "next/navigation"
import { ListingCard } from "@/components/marketplace/ListingCard"
import { listings } from "@/lib/mock-marketplace"

const sellers = listings.map((listing) => listing.seller)

export default function PublicProfilePage({ params }: { params: { id: string } }) {
  const seller = sellers.find((item) => item.name.toLowerCase().replace(/\s+/g, "-") === params.id) ?? sellers[Number(params.id) - 1]

  if (!seller) {
    notFound()
  }

  const sellerListings = listings.filter((listing) => listing.seller.name === seller.name)

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <section className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <aside className="h-fit rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-zinc-950 text-3xl font-semibold text-white">
            {seller.name.slice(0, 1)}
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-zinc-950">{seller.name}</h1>
          <p className="mt-2 text-sm text-zinc-500">★ {seller.rating} · {seller.since}</p>
          {seller.verified && (
            <p className="mt-5 rounded-2xl bg-[hsl(var(--otiva-mint)/0.12)] px-4 py-3 text-sm font-semibold text-[hsl(var(--otiva-mint))]">
              Проверенный продавец
            </p>
          )}
        </aside>

        <section>
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-950">Объявления продавца</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {(sellerListings.length > 0 ? sellerListings : listings.slice(0, 2)).map((listing) => (
              <ListingCard key={listing.id} listing={listing} href={listing.category === "cars" ? `/cars/${listing.id}` : `/listings/${listing.id}`} />
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}
