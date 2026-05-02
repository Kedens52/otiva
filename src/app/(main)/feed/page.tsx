"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ListingCard } from "@/components/marketplace/ListingCard"
import { AdSlot } from "@/components/marketplace/AdSlot"
import { InstallAppBanner } from "@/components/marketplace/InstallAppBanner"
import { CATEGORY_META, type AppListing } from "@/lib/listing-types"
import { rankListingsForUser, trackUserInterest } from "@/lib/recommendations"

export default function FeedPage() {
  const [recommended, setRecommended] = useState<AppListing[]>([])
  const [latest, setLatest]           = useState<AppListing[]>([])
  const [loading, setLoading]         = useState(true)
  const [showAllCats, setShowAllCats] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/listings?pageSize=24&sortBy=createdAt&sortOrder=desc")
        if (res.ok) {
          const data = await res.json()
          const items: AppListing[] = data.items ?? []
          const personalized = rankListingsForUser(items)
          const recommendedItems = personalized.slice(0, 8)
          const recommendedIds = new Set(recommendedItems.map((item) => item.id))
          setRecommended(recommendedItems)
          setLatest(items.filter((item) => !recommendedIds.has(item.id)).slice(0, 8))
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const mobileCats = showAllCats ? CATEGORY_META : CATEGORY_META.slice(0, 8)

  return (
    <main className="bg-white">
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-6 lg:grid-cols-[1fr_300px]">
        <div>
          <section className="max-w-4xl">
            <div className="lg:hidden">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {mobileCats.map((c) => (
                  <Link key={c.slug} href={c.href} onClick={() => trackUserInterest({ category: c.slug, weight: 3 })}
                    className="group flex items-center gap-3 overflow-hidden rounded-2xl bg-zinc-100 px-3 py-3 transition active:scale-[0.98] hover:bg-zinc-200">
                    <img src={`/categories/${c.slug}.svg`} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover shadow-sm" />
                    <span className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-950">{c.title}</span>
                  </Link>
                ))}
              </div>
              {CATEGORY_META.length > 8 && (
                <button
                  onClick={() => setShowAllCats((v) => !v)}
                  className="mt-2.5 w-full rounded-2xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-500 hover:bg-zinc-50 transition">
                  {showAllCats ? "Скрыть категории" : "Все категории (" + CATEGORY_META.length + ")"}
                </button>
              )}
            </div>

            <div className="hidden grid-cols-2 gap-3 lg:grid lg:grid-cols-4">
              {CATEGORY_META.map((c) => (
                <Link key={c.slug} href={c.href} onClick={() => trackUserInterest({ category: c.slug, weight: 3 })}
                  className="group flex min-h-[7rem] min-w-0 flex-col justify-between overflow-hidden rounded-3xl bg-zinc-100 p-3 transition hover:-translate-y-0.5 hover:bg-zinc-200 sm:min-h-32 sm:p-4">
                  <h2 className="line-clamp-2 text-sm font-semibold leading-5 text-zinc-950 sm:text-base">{c.title}</h2>
                  <img src={`/categories/${c.slug}.svg`} alt="" className="mx-auto h-12 w-12 shrink-0 rounded-xl object-cover shadow-sm transition group-hover:scale-105 sm:h-16 sm:w-16 sm:rounded-2xl" />
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-5 hidden lg:block">
            <AdSlot slot="leaderboard" variant="leaderboard" tone="orange" />
          </section>

          <section className="pt-6">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Рекомендации для вас</h1>
            {loading ? (
              <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-48 rounded-2xl bg-zinc-100 animate-pulse" />)}
              </div>
            ) : recommended.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-400">Объявлений пока нет. Станьте первым!</p>
            ) : (
              <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
                {recommended.map((l) => <ListingCard key={l.id} listing={l} compact />)}
              </div>
            )}
          </section>

          {!loading && latest.length > 0 && (
            <section className="pt-6">
              <h2 className="text-3xl font-semibold tracking-tight text-zinc-950">Новые объявления</h2>
              <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
                {latest.map((l) => <ListingCard key={l.id} listing={l} compact />)}
              </div>
            </section>
          )}

          <div className="mt-8 flex justify-center">
            <Link href="/search" className="rounded-2xl border border-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
              Смотреть все объявления
            </Link>
          </div>
        </div>

        <aside className="hidden space-y-5 lg:block">
          <InstallAppBanner />
          <AdSlot slot="sidebarTop" variant="box" tone="orange" />
          <AdSlot slot="sidebarTall" variant="tall" tone="blue" />
        </aside>
      </section>
      <div className="mx-auto max-w-7xl px-4 pb-6 lg:hidden">
        <InstallAppBanner />
      </div>
    </main>
  )
}
