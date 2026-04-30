"use client"

import Link from "next/link"
import { notFound } from "next/navigation"
import { useState } from "react"
import { formatPrice, getListingById } from "@/lib/mock-marketplace"
import { ContactSellerModal } from "@/components/marketplace/ContactSellerModal"
import { ReportModal } from "@/components/marketplace/ReportModal"

export default function CarDetailPage({ params }: { params: { id: string } }) {
  const car = getListingById(params.id)
  const [contactOpen, setContactOpen] = useState(false)
  const [contactTab,  setContactTab]  = useState<"write" | "call">("write")
  const [reportOpen, setReportOpen] = useState(false)

  if (!car || car.category !== "cars") notFound()

  function openWrite() { setContactTab("write"); setContactOpen(true) }
  function openCall()  { setContactTab("call");  setContactOpen(true) }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      {contactOpen && (
        <ContactSellerModal
          sellerName={car.seller.name}
          listingTitle={car.title}
          listingId={car.id}
          listingCategory={car.category}
          city={car.city}
          onClose={() => setContactOpen(false)}
        />
      )}
      {reportOpen && (
        <ReportModal listingId={car.id} listingTitle={car.title} onClose={() => setReportOpen(false)} />
      )}

      <Link href="/cars" className="text-sm font-medium text-zinc-500 hover:text-zinc-950">← Все автомобили</Link>

      {/* Mobile sticky price bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur-sm lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-zinc-400">{car.title}</p>
            <p className="text-xl font-bold text-zinc-950">{formatPrice(car.price)}</p>
          </div>
          <button
            onClick={openWrite}
            className="shrink-0 rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-zinc-800"
          >
            Написать
          </button>
          <button
            onClick={openCall}
            className="shrink-0 rounded-full border-2 border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-50"
          >
            Позвонить
          </button>
        </div>
      </div>

      <section className="mb-20 mt-6 grid gap-8 lg:mb-0 lg:grid-cols-[1fr_380px]">
        <div>
          <div className={`overflow-hidden rounded-[36px] bg-gradient-to-br ${car.imageTone} shadow-2xl shadow-zinc-950/15`}>
            <img src={`/listings/${car.category}.svg`} alt={car.title} className="h-[420px] w-full object-cover" />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            {car.tags.map((tag) => (
              <div key={tag} className="rounded-[22px] border border-zinc-200 bg-white px-4 py-4 text-sm font-medium text-zinc-700 shadow-sm">{tag}</div>
            ))}
          </div>
          <div className="mt-10">
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">{car.title}</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-500">{car.description}</p>
          </div>
          <div className="mt-10 rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-zinc-950">Характеристики</h2>
            <dl className="mt-6 grid gap-0 overflow-hidden rounded-3xl border border-zinc-200 sm:grid-cols-2">
              {Object.entries(car.specs).map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4 border-b border-zinc-200 px-5 py-4 even:bg-zinc-50 sm:odd:border-r">
                  <dt className="text-sm text-zinc-500">{label}</dt>
                  <dd className="text-sm font-semibold text-zinc-950">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <aside className="h-fit rounded-[32px] border border-zinc-200 bg-zinc-50 p-6 shadow-inner lg:sticky lg:top-28">
          <p className="text-sm text-zinc-500">{car.city}{car.district ? `, ${car.district}` : ""}</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950">{formatPrice(car.price)}</p>

          <div className="mt-6 rounded-[28px] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-lg font-semibold text-white">
                {car.seller.name.slice(0, 1)}
              </div>
              <div>
                <p className="font-semibold text-zinc-950">{car.seller.name}</p>
                <p className="text-sm text-zinc-500">★ {car.seller.rating} · {car.seller.since}</p>
              </div>
            </div>
            {car.seller.verified && (
              <p className="mt-4 rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-medium text-zinc-700">Продавец проверен Отивой</p>
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
              className="rounded-full border-2 border-zinc-200 bg-white px-6 py-4 text-sm font-semibold text-zinc-950 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
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
