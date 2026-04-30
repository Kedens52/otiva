"use client"

import { useSearchParams } from "next/navigation"
import { Suspense, useMemo, useState } from "react"
import Link from "next/link"
import { listings, marketplaceCategories, formatPrice, type ListingCategory } from "@/lib/mock-marketplace"
import { ListingCard } from "@/components/marketplace/ListingCard"

type SortKey = "relevance" | "price_asc" | "price_desc"

function SearchResults() {
  const params = useSearchParams()
  const rawQ = params.get("q") ?? ""
  const rawCity = params.get("city") ?? ""

  const [sort, setSort] = useState<SortKey>("relevance")
  const [selectedCategory, setSelectedCategory] = useState<ListingCategory | "">("")
  const [priceMin, setPriceMin] = useState("")
  const [priceMax, setPriceMax] = useState("")

  const results = useMemo(() => {
    const q = rawQ.toLowerCase().trim()
    const city = rawCity.trim()

    let filtered = listings.filter((l) => {
      if (q) {
        const haystack = [l.title, l.subtitle, l.description, ...l.tags, l.city, l.district ?? ""]
          .join(" ")
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      if (city && city !== "Везде") {
        if (l.city !== city) return false
      }
      if (selectedCategory && l.category !== selectedCategory) return false
      const min = priceMin ? parseInt(priceMin, 10) : null
      const max = priceMax ? parseInt(priceMax, 10) : null
      if (min !== null && l.price < min) return false
      if (max !== null && l.price > max) return false
      return true
    })

    if (sort === "price_asc") filtered = [...filtered].sort((a, b) => a.price - b.price)
    else if (sort === "price_desc") filtered = [...filtered].sort((a, b) => b.price - a.price)

    return filtered
  }, [rawQ, rawCity, selectedCategory, priceMin, priceMax, sort])

  const titleParts = []
  if (rawQ) titleParts.push(`«${rawQ}»`)
  if (rawCity && rawCity !== "Везде") titleParts.push(`в ${rawCity}`)

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 lg:py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
          {titleParts.length > 0 ? `Поиск: ${titleParts.join(" ")}` : "Все объявления"}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {results.length === 0
            ? "Ничего не найдено — попробуйте изменить запрос"
            : `${results.length} ${pluralListings(results.length)}`}
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Sidebar filters */}
        <aside className="w-full shrink-0 lg:w-64">
          <div className="rounded-[24px] border border-zinc-200 bg-white p-5 space-y-5">
            <div>
              <p className="mb-2.5 text-sm font-semibold text-zinc-950">Категория</p>
              <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
                <button
                  onClick={() => setSelectedCategory("")}
                  className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                    selectedCategory === ""
                      ? "bg-zinc-950 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  Все
                </button>
                {marketplaceCategories.map((c) => (
                  <button
                    key={c.slug}
                    onClick={() => setSelectedCategory(c.slug)}
                    className={`rounded-xl px-3 py-1.5 text-sm font-medium transition text-left ${
                      selectedCategory === c.slug
                        ? "bg-zinc-950 text-white"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >
                    {c.title}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2.5 text-sm font-semibold text-zinc-950">Цена, ₽</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="от"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                />
                <input
                  type="number"
                  placeholder="до"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                />
              </div>
            </div>

            {(selectedCategory || priceMin || priceMax) && (
              <button
                onClick={() => { setSelectedCategory(""); setPriceMin(""); setPriceMax("") }}
                className="w-full rounded-xl border border-zinc-200 py-2 text-sm text-zinc-500 transition hover:bg-zinc-50"
              >
                Сбросить фильтры
              </button>
            )}
          </div>
        </aside>

        {/* Results */}
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-zinc-400 mr-1">Сортировка:</span>
            {(
              [
                { key: "relevance", label: "Релевантность" },
                { key: "price_asc", label: "Дешевле" },
                { key: "price_desc", label: "Дороже" },
              ] as { key: SortKey; label: string }[]
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSort(key)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  sort === key
                    ? "bg-zinc-950 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {results.length === 0 ? (
            <EmptyState q={rawQ} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
              {results.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

function EmptyState({ q }: { q: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[24px] border border-zinc-200 bg-white py-20 text-center">
      <div className="mb-4 text-5xl">🔍</div>
      <p className="text-lg font-semibold text-zinc-950">
        {q ? `По запросу «${q}» ничего не найдено` : "Ничего не найдено"}
      </p>
      <p className="mt-2 max-w-xs text-sm text-zinc-500">
        Попробуйте изменить запрос, убрать фильтры или выбрать другой город
      </p>
      <Link
        href="/"
        className="mt-6 rounded-xl bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
      >
        На главную
      </Link>
    </div>
  )
}

function pluralListings(n: number) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return "объявление"
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return "объявления"
  return "объявлений"
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-10 text-zinc-400 text-sm">Загрузка...</div>}>
      <SearchResults />
    </Suspense>
  )
}
