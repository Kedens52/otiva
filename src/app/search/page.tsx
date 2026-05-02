"use client"

import { useSearchParams } from "next/navigation"
import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ListingCard } from "@/components/marketplace/ListingCard"
import { type AppListing, CATEGORY_META } from "@/lib/listing-types"
import { trackUserInterest } from "@/lib/recommendations"
import {
  CATEGORY_FILTERS, GENERAL_FILTERS,
  type FilterField, type FilterState,
  emptyFilters,
} from "@/lib/filters"

type SortKey = "newest" | "price_asc" | "price_desc"

function FilterPanel({
  fields, state, priceMin, priceMax, onChange, onPriceMin, onPriceMax, onReset,
}: {
  fields: FilterField[]; state: FilterState; priceMin: string; priceMax: string
  onChange: (key: string, value: string | string[]) => void
  onPriceMin: (v: string) => void; onPriceMax: (v: string) => void; onReset: () => void
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-semibold text-zinc-950">Цена, ₽</p>
        <div className="flex gap-2">
          <input type="number" placeholder="от" value={priceMin} onChange={(e) => onPriceMin(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition focus:border-[hsl(var(--nashlo-orange))]" />
          <input type="number" placeholder="до" value={priceMax} onChange={(e) => onPriceMax(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition focus:border-[hsl(var(--nashlo-orange))]" />
        </div>
      </div>
      {fields.map((field) => {
        if (field.type === "select") return (
          <div key={field.key}>
            <p className="mb-2 text-sm font-semibold text-zinc-950">{field.label}</p>
            <select value={(state[field.key] as string) || ""} onChange={(e) => onChange(field.key, e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition focus:border-[hsl(var(--nashlo-orange))]">
              <option value="">Все</option>
              {field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        )
        if (field.type === "range") {
          return (
            <div key={field.key}>
              <p className="mb-2 text-sm font-semibold text-zinc-950">{field.label}{field.unit ? `, ${field.unit}` : ""}</p>
              <div className="flex gap-2">
                <input type="number" placeholder="от" value={(state[field.key + "_from"] as string) || ""}
                  onChange={(e) => onChange(field.key + "_from", e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition focus:border-[hsl(var(--nashlo-orange))]" />
                <input type="number" placeholder="до" value={(state[field.key + "_to"] as string) || ""}
                  onChange={(e) => onChange(field.key + "_to", e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition focus:border-[hsl(var(--nashlo-orange))]" />
              </div>
            </div>
          )
        }
        if (field.type === "multi") {
          const selected = (state[field.key] as string[]) || []
          return (
            <div key={field.key}>
              <p className="mb-2 text-sm font-semibold text-zinc-950">{field.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {field.options.map((o) => {
                  const active = selected.includes(o.value)
                  return (
                    <button key={o.value} type="button"
                      onClick={() => onChange(field.key, active ? selected.filter((v) => v !== o.value) : [...selected, o.value])}
                      className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${active ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
                      {o.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        }
        if (field.type === "toggle") {
          const active = state[field.key] === "1"
          return (
            <label key={field.key} className="flex cursor-pointer items-center justify-between gap-3">
              <span className="text-sm font-medium text-zinc-700">{field.label}</span>
              <button type="button" role="switch" aria-checked={active}
                onClick={() => onChange(field.key, active ? "" : "1")}
                className={`relative h-6 w-11 rounded-full transition-colors ${active ? "bg-zinc-950" : "bg-zinc-200"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${active ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </label>
          )
        }
        return null
      })}
      <button type="button" onClick={onReset}
        className="w-full rounded-xl border border-zinc-200 py-2.5 text-sm text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-950">
        Сбросить фильтры
      </button>
    </div>
  )
}

function SearchResults() {
  const params  = useSearchParams()
  const rawQ    = params.get("q")    ?? ""
  const rawCity = params.get("city") ?? ""
  const rawCat  = params.get("cat")  ?? ""

  const [sort, setSort]                 = useState<SortKey>("newest")
  const [selectedCategory, setSelectedCategory] = useState(rawCat)
  const [priceMin, setPriceMin]         = useState("")
  const [priceMax, setPriceMax]         = useState("")
  const [filters, setFilters]           = useState<FilterState>(emptyFilters())
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [results, setResults]           = useState<AppListing[]>([])
  const [total, setTotal]               = useState(0)
  const [loading, setLoading]           = useState(true)
  const abortRef = useRef<AbortController | null>(null)

  const activeFields = selectedCategory
    ? (CATEGORY_FILTERS[selectedCategory]?.fields ?? GENERAL_FILTERS)
    : GENERAL_FILTERS

  function updateFilter(key: string, value: string | string[]) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }
  function resetFilters() { setFilters(emptyFilters()); setPriceMin(""); setPriceMax("") }

  const fetchListings = useCallback(async () => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setLoading(true)

    const sp = new URLSearchParams()
    if (rawQ)             sp.set("q", rawQ)
    if (selectedCategory) sp.set("category", selectedCategory)
    const city = (filters["city"] as string) || rawCity
    if (city && city !== "Везде") sp.set("city", city)
    if (priceMin) sp.set("priceMin", priceMin)
    if (priceMax) sp.set("priceMax", priceMax)
    const sortMap: Record<SortKey, { by: string; order: string }> = {
      newest:     { by: "createdAt", order: "desc" },
      price_asc:  { by: "price",     order: "asc"  },
      price_desc: { by: "price",     order: "desc" },
    }
    sp.set("sortBy", sortMap[sort].by)
    sp.set("sortOrder", sortMap[sort].order)
    sp.set("pageSize", "60")

    try {
      const res = await fetch(`/api/listings?${sp.toString()}`, { signal: ctrl.signal })
      if (!res.ok) throw new Error("fetch failed")
      const data = await res.json()
      setResults(data.items ?? [])
      setTotal(data.total ?? 0)
    } catch (e: unknown) {
      if (!(e instanceof Error && e.name === "AbortError")) { setResults([]); setTotal(0) }
    } finally {
      setLoading(false)
    }
  }, [rawQ, rawCity, selectedCategory, priceMin, priceMax, filters, sort])

  useEffect(() => {
    const t = setTimeout(fetchListings, 300)
    return () => clearTimeout(t)
  }, [fetchListings])

  useEffect(() => {
    if (!rawQ && !selectedCategory) return
    trackUserInterest({ category: selectedCategory || undefined, query: rawQ || undefined, weight: rawQ ? 2 : 1 })
  }, [rawQ, selectedCategory])

  const activeCount = Object.values(filters).filter((v) => Array.isArray(v) ? v.length : v).length
    + (priceMin ? 1 : 0) + (priceMax ? 1 : 0)

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 pb-28 lg:pb-10 lg:py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
          {rawQ ? `Поиск: «${rawQ}»` : "Все объявления"}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {loading ? "Загрузка…" : total === 0 ? "Ничего не найдено" : `${total} ${plural(total)}`}
        </p>
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button onClick={() => { setSelectedCategory(""); resetFilters() }}
          className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${!selectedCategory ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
          Все
        </button>
        {CATEGORY_META.map((c) => (
          <button key={c.slug} onClick={() => { setSelectedCategory(c.slug); resetFilters() }}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${selectedCategory === c.slug ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
            {c.title}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-4 overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="mb-4 text-base font-semibold text-zinc-950">Фильтры</p>
            <FilterPanel fields={activeFields} state={filters} priceMin={priceMin} priceMax={priceMax}
              onChange={updateFilter} onPriceMin={setPriceMin} onPriceMax={setPriceMax} onReset={resetFilters} />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setMobileFiltersOpen(true)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition lg:hidden ${activeCount > 0 ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-700"}`}>
              ⊞ Фильтры{activeCount > 0 && ` · ${activeCount}`}
            </button>
            <span className="text-xs text-zinc-400">Сортировка:</span>
            {([ { key: "newest" as SortKey, label: "Новее" }, { key: "price_asc" as SortKey, label: "Дешевле" }, { key: "price_desc" as SortKey, label: "Дороже" } ]).map(({ key, label }) => (
              <button key={key} onClick={() => setSort(key)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${sort === key ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-52 rounded-2xl bg-zinc-100 animate-pulse" />)}
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-zinc-200 bg-white py-20 text-center">
              <div className="mb-4 text-5xl">🔍</div>
              <p className="text-lg font-semibold text-zinc-950">{rawQ ? `По запросу «${rawQ}» ничего не найдено` : "Объявлений пока нет"}</p>
              <p className="mt-2 max-w-xs text-sm text-zinc-500">Попробуйте изменить запрос или убрать фильтры</p>
              <Link href="/" className="mt-6 rounded-xl bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800">На главную</Link>
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((listing) => <ListingCard key={listing.id} listing={listing} compact />)}
            </div>
          )}
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[160] lg:hidden" onClick={() => setMobileFiltersOpen(false)}>
          <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm" />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pt-3"><div className="h-1 w-10 rounded-full bg-zinc-200" /></div>
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
              <p className="text-base font-semibold text-zinc-950">Фильтры</p>
              <button onClick={() => setMobileFiltersOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">×</button>
            </div>
            <div className="p-5">
              <FilterPanel fields={activeFields} state={filters} priceMin={priceMin} priceMax={priceMax}
                onChange={updateFilter} onPriceMin={setPriceMin} onPriceMax={setPriceMax} onReset={resetFilters} />
              <button onClick={() => setMobileFiltersOpen(false)}
                className="mt-4 h-12 w-full rounded-2xl bg-[hsl(var(--nashlo-orange))] text-sm font-semibold text-white">
                Показать {total} {plural(total)}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function plural(n: number) {
  const m10 = n % 10, m100 = n % 100
  if (m10 === 1 && m100 !== 11) return "объявление"
  if ([2, 3, 4].includes(m10) && ![12, 13, 14].includes(m100)) return "объявления"
  return "объявлений"
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-10 text-sm text-zinc-400">Загрузка…</div>}>
      <SearchResults />
    </Suspense>
  )
}
