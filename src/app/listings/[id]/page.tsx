"use client"

import Link from "next/link"
import { notFound } from "next/navigation"
import { useState } from "react"
import { formatPrice, getListingById } from "@/lib/mock-marketplace"
import { ContactSellerModal } from "@/components/marketplace/ContactSellerModal"
import { ReportModal } from "@/components/marketplace/ReportModal"

export default function ListingDetailPage({ params }: { params: { id: string } }) {
  const listing = getListingById(params.id)
  const [contactOpen, setContactOpen] = useState(false)
  const [contactTab,  setContactTab]  = useState<"write" | "call">("write")
  const [reportOpen, setReportOpen] = useState(false)

  if (!listing) notFound()

  function openWrite() { setContactTab("write"); setContactOpen(true) }
  function openCall()  { setContactTab("call");  setContactOpen(true) }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 lg:py-10">
      {contactOpen && (
        <ContactSellerModal
          sellerName={listing.seller.name}
          listingTitle={listing.title}
          listingId={listing.id}
          listingCategory={listing.category}
          city={listing.city}
          onClose={() => setContactOpen(false)}
        />
      )}
      {reportOpen && (
        <ReportModal listingId={listing.id} listingTitle={listing.title} onClose={() => setReportOpen(false)} />
      )}

      <Link href="/feed" className="text-sm font-semibold text-zinc-500 hover:text-zinc-950">← Вернуться в ленту</Link>

      {/* Mobile sticky price bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur-sm lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-zinc-400">{listing.title}</p>
            <p className="text-xl font-bold text-zinc-950">{formatPrice(listing.price)}</p>
          </div>
          <button onClick={openWrite} className="shrink-0 rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800">
            Написать
          </button>
          <button onClick={openCall} className="shrink-0 rounded-full border-2 border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-50">
            Позвонить
          </button>
        </div>
      </div>

      <section className="mb-20 mt-6 grid gap-8 lg:mb-0 lg:grid-cols-[1fr_360px]">
        <div className="order-last lg:order-first">
          <div className={`overflow-hidden rounded-[36px] bg-gradient-to-br ${listing.imageTone} shadow-2xl shadow-zinc-950/15`}>
            <img src={`/listings/${listing.category}.svg`} alt={listing.title} className="h-52 w-full object-cover sm:h-80 lg:h-[420px]" />
          </div>
          <h1 className="mt-8 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">{listing.title}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-500">{listing.description}</p>

          {Object.keys(listing.specs).length > 0 && (
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
          )}
        </div>

        <aside className="order-first h-fit rounded-[32px] border border-zinc-200 bg-zinc-50 p-6 shadow-inner lg:order-last lg:sticky lg:top-6">
          <p className="text-sm text-zinc-500">{listing.city}{listing.district ? `, ${listing.district}` : ""}</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950">{formatPrice(listing.price)}</p>

          <div className="mt-6 rounded-[28px] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-base font-semibold text-white">
                {listing.seller.name.slice(0, 1)}
              </div>
              <div>
                <p className="font-semibold text-zinc-950">{listing.seller.name}</p>
                <p className="mt-0.5 text-sm text-zinc-500">★ {listing.seller.rating} · {listing.seller.since}</p>
              </div>
            </div>
            {listing.seller.verified && (
              <p className="mt-4 rounded-2xl bg-[hsl(var(--otiva-mint)/0.12)] px-4 py-2.5 text-sm font-semibold text-[hsl(var(--otiva-mint))]">
                ✓ Проверенный продавец
              </p>
            )}
          </div>

          <div className="mt-5 grid gap-3">
            <button
              onClick={openWrite}
              className="rounded-full bg-zinc-950 px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-zinc-950/10 transition hover:bg-zinc-800"
            >
              ✉ Написать продавцу
            </button>
            <button
              onClick={openCall}
              className="rounded-full border-2 border-zinc-200 bg-white px-6 py-4 text-sm font-semibold text-zinc-950 transition hover:border-zinc-300 hover:bg-zinc-50"
            >
              📞 Позвонить продавцу
            </button>
            <button className="rounded-full border border-zinc-100 bg-white px-6 py-3 text-sm font-semibold text-zinc-500 transition hover:bg-zinc-100">
              ♡ Добавить в избранное
            </button>
            <button
              onClick={() => setReportOpen(true)}
              className="w-full rounded-full py-2 text-xs font-medium text-zinc-400 transition hover:text-red-500"
            >
              Пожаловаться на объявление
            </button>
          </div>
        </aside>
      </section>
    </main>
  )
}
