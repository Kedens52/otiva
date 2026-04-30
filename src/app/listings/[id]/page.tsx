import Link from "next/link"
import { notFound } from "next/navigation"
import { formatPrice, getListingById } from "@/lib/mock-marketplace"

export default function ListingDetailPage({ params }: { params: { id: string } }) {
  const listing = getListingById(params.id)

  if (!listing) {
    notFound()
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 lg:py-10">
      <Link href="/feed" className="text-sm font-semibold text-zinc-500 hover:text-zinc-950">
        ← Вернуться в ленту
      </Link>

      <section className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="order-last lg:order-first">
          <div className={`overflow-hidden rounded-[36px] bg-gradient-to-br ${listing.imageTone} shadow-2xl shadow-zinc-950/15`}>
            <img src={`/listings/${listing.category}.svg`} alt={listing.title} className="h-52 w-full object-cover sm:h-80 lg:h-[420px]" />
          </div>
          <h1 className="mt-8 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">{listing.title}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-500">{listing.description}</p>

          <div className="mt-8 rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-zinc-950">Характеристики</h2>
            <dl className="mt-5 grid gap-3 grid-cols-2">
              {Object.entries(listing.specs).map(([name, value]) => (
                <div key={name} className="rounded-2xl bg-zinc-50 px-4 py-3">
                  <dt className="text-sm text-zinc-500">{name}</dt>
                  <dd className="mt-1 text-sm font-semibold text-zinc-950">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <aside className="order-first h-fit rounded-[32px] border border-zinc-200 bg-zinc-50 p-6 shadow-inner lg:order-last lg:sticky lg:top-6">
          <p className="text-sm text-zinc-500">{listing.city}{listing.district ? `, ${listing.district}` : ""}</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950">{formatPrice(listing.price)}</p>
          <div className="mt-6 rounded-[28px] bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-zinc-950">{listing.seller.name}</h2>
            <p className="mt-1 text-sm text-zinc-500">★ {listing.seller.rating} · {listing.seller.since}</p>
          </div>
          <div className="mt-5 grid gap-3">
            <Link href="/chat/demo" className="rounded-full bg-zinc-950 px-6 py-4 text-center text-sm font-semibold text-white hover:bg-zinc-800">
              Написать продавцу
            </Link>
            <Link href="/favorites" className="rounded-full border border-zinc-200 bg-white px-6 py-4 text-center text-sm font-semibold text-zinc-950 hover:bg-zinc-100">
              Добавить в избранное
            </Link>
          </div>
        </aside>
      </section>
    </main>
  )
}
