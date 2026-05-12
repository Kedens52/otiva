"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ListingCard } from "@/components/marketplace/ListingCard"
import { type AppListing, CATEGORY_META, imageToneForCategory } from "@/lib/listing-types"
import { trackUserInterest } from "@/lib/recommendations"
import { getCategoryConfig } from "@/lib/category-config"

type CategoryPageProps = {
  category: string
}

const STATIC_CITY_OPTIONS = [
  "Москва",
  "Санкт-Петербург",
  "Казань",
  "Екатеринбург",
  "Новосибирск",
  "Сочи",
  "Краснодар",
  "Нижний Новгород",
  "Самара",
  "Ростов-на-Дону",
]

function mergeCityOptions(staticList: string[], fromApi: string[] | undefined): string[] {
  const s = new Set(staticList)
  for (const c of fromApi ?? []) {
    if (c?.trim()) s.add(c.trim())
  }
  return [...s].sort((a, b) => a.localeCompare(b, "ru"))
}

const sortOptions = [
  { value: "newest",     label: "Сначала новые" },
  { value: "price_asc",  label: "Дешевле" },
  { value: "price_desc", label: "Дороже" },
]

export function CategoryPage({ category }: CategoryPageProps) {
  const meta     = CATEGORY_META.find((c) => c.slug === category)
  const categoryConfig = getCategoryConfig(category)
  const tone     = imageToneForCategory(category)

  const [items, setItems]   = useState<AppListing[]>([])
  const [total, setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [query, setQuery]   = useState("")
  const [city, setCity]     = useState("")
  const [sort, setSort]     = useState("newest")
  const [priceMax, setPriceMax] = useState("")
  const [cityOptions, setCityOptions] = useState<string[]>(() => [...STATIC_CITY_OPTIONS])
  const abortRef = useRef<AbortController | null>(null)

  const fetchItems = useCallback(async () => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setLoading(true)

    const sp = new URLSearchParams()
    sp.set("category", category)
    sp.set("pageSize", "60")
    if (query) sp.set("q", query)
    if (city) sp.set("city", city)
    if (priceMax) sp.set("priceMax", priceMax)
    const sortMap: Record<string, { by: string; order: string }> = {
      newest: { by: "createdAt", order: "desc" },
      price_asc: { by: "price", order: "asc" },
      price_desc: { by: "price", order: "desc" },
    }
    sp.set("sortBy", sortMap[sort].by)
    sp.set("sortOrder", sortMap[sort].order)

    try {
      const res = await fetch(`/api/listings?${sp.toString()}`, { signal: ctrl.signal })
      if (!res.ok) return
      const data = await res.json()
      setItems(data.items ?? [])
      setTotal(data.total ?? 0)
      const dyn = data.availableFilterOptions?.cities
      if (Array.isArray(dyn) && dyn.length) {
        setCityOptions(mergeCityOptions(STATIC_CITY_OPTIONS, dyn))
      } else {
        setCityOptions([...STATIC_CITY_OPTIONS])
      }
    } catch (e: unknown) {
      if (!(e instanceof Error && e.name === "AbortError")) {
        setItems([])
        setTotal(0)
      }
    } finally {
      setLoading(false)
    }
  }, [category, query, city, sort, priceMax])

  useEffect(() => {
    const t = setTimeout(fetchItems, 300)
    return () => clearTimeout(t)
  }, [fetchItems])

  useEffect(() => {
    trackUserInterest({ category, query: query || undefined, weight: query ? 2 : 1 })
  }, [category, query])

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 lg:py-10">
      <section className={`overflow-hidden rounded-[28px] bg-gradient-to-br ${tone} p-5 text-white shadow-2xl shadow-zinc-950/15 sm:rounded-[36px] sm:p-10`}>
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-6xl">
            {categoryConfig?.title ?? meta?.title ?? category}
          </h1>
          <p className="mt-3 text-sm leading-6 text-white/85 sm:mt-5 sm:text-lg">
            {total > 0 ? `${total} объявлений` : "Объявлений пока нет"}
          </p>
        </div>
      </section>

      <section className="grid gap-6 py-6 lg:grid-cols-[280px_1fr] lg:py-10">
        <aside className="h-fit rounded-[28px] border border-zinc-200 bg-zinc-50 p-5 shadow-inner lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold text-zinc-950">Фильтры</h2>
          <div className="mt-5 space-y-5">
            <label className="block">
              <span className="text-sm font-medium text-zinc-600">Что ищем</span>
              <input value={query} onChange={(e) => setQuery(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]"
                placeholder="Название или описание" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-zinc-600">Цена до, ₽</span>
              <input value={priceMax} onChange={(e) => setPriceMax(e.target.value)} type="number"
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]"
                placeholder="100 000" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-zinc-600">Город</span>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none"
              >
                <option value="">Все города</option>
                {cityOptions.map((cityValue) => (
                  <option key={cityValue} value={cityValue}>
                    {cityValue}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-zinc-600">Сортировка</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none">
                {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <button type="button" onClick={() => { setQuery(""); setCity(""); setSort("newest"); setPriceMax("") }}
              className="w-full rounded-xl border border-zinc-200 py-2.5 text-sm text-zinc-500 hover:bg-white">
              Сбросить фильтры
            </button>
          </div>
        </aside>

        <section>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">Объявления</h2>
              <p className="mt-2 text-zinc-500">{loading ? "Загрузка…" : `${total} объявлений`}</p>
            </div>
            <Link href={`/create?category=${category}`}
              className="rounded-2xl bg-[hsl(var(--nashlo-orange))] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[hsl(var(--nashlo-orange)/0.9)]">
              + Подать объявление
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-48 rounded-2xl bg-zinc-100 animate-pulse" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center rounded-[28px] border border-zinc-200 bg-white py-20 text-center">
              <p className="text-4xl">📭</p>
              <p className="mt-4 text-lg font-semibold text-zinc-950">Пока нет объявлений</p>
              <p className="mt-2 text-sm text-zinc-500">Станьте первым продавцом в этой категории</p>
              <Link href={`/create?category=${category}`}
                className="mt-6 rounded-xl bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800">
                Подать объявление
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
              {items.map((item) => <ListingCard key={item.id} listing={item} />)}
            </div>
          )}
        </section>
      </section>
    </main>
  )
}
