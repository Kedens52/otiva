"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Suspense, useMemo, useState } from "react"
import Link from "next/link"
import { listings, marketplaceCategories, type ListingCategory } from "@/lib/mock-marketplace"
import { ListingCard } from "@/components/marketplace/ListingCard"
import {
  CATEGORY_FILTERS, GENERAL_FILTERS,
  type FilterField, type FilterState,
  emptyFilters, hasActiveFilters,
} from "@/lib/filters"

type SortKey = "relevance" | "price_asc" | "price_desc" | "newest"

// ── Filter panel component ───────────────────────────────────────────────────

function FilterPanel({
  fields,
  state,
  priceMin,
  priceMax,
  onChange,
  onPriceMin,
  onPriceMax,
  onReset,
}: {
  fields: FilterField[]
  state: FilterState
  priceMin: string
  priceMax: string
  onChange: (key: string, value: string | string[]) => void
  onPriceMin: (v: string) => void
  onPriceMax: (v: string) => void
  onReset: () => void
}) {
  return (
    <div className="space-y-5">
      {/* Price range — always shown */}
      <div>
        <p className="mb-2 text-sm font-semibold text-zinc-950">Цена, ₽</p>
        <div className="flex gap-2">
          <input
            type="number" placeholder="от" value={priceMin}
            onChange={(e) => onPriceMin(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition focus:border-[hsl(var(--nashlo-orange))]"
          />
          <input
            type="number" placeholder="до" value={priceMax}
            onChange={(e) => onPriceMax(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition focus:border-[hsl(var(--nashlo-orange))]"
          />
        </div>
      </div>

      {/* Category-specific fields */}
      {fields.map((field) => {
        if (field.type === "select") {
          return (
            <div key={field.key}>
              <p className="mb-2 text-sm font-semibold text-zinc-950">{field.label}</p>
              <select
                value={(state[field.key] as string) || ""}
                onChange={(e) => onChange(field.key, e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition focus:border-[hsl(var(--nashlo-orange))]"
              >
                <option value="">Все</option>
                {field.options.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )
        }

        if (field.type === "range") {
          const fromVal = (state[field.key + "_from"] as string) || ""
          const toVal   = (state[field.key + "_to"]   as string) || ""
          return (
            <div key={field.key}>
              <p className="mb-2 text-sm font-semibold text-zinc-950">
                {field.label}{field.unit ? `, ${field.unit}` : ""}
              </p>
              <div className="flex gap-2">
                <input
                  type="number" placeholder="от" value={fromVal}
                  onChange={(e) => onChange(field.key + "_from", e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition focus:border-[hsl(var(--nashlo-orange))]"
                />
                <input
                  type="number" placeholder="до" value={toVal}
                  onChange={(e) => onChange(field.key + "_to", e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition focus:border-[hsl(var(--nashlo-orange))]"
                />
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
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => {
                        onChange(
                          field.key,
                          active ? selected.filter((v) => v !== o.value) : [...selected, o.value]
                        )
                      }}
                      className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                        active
                          ? "bg-zinc-950 text-white"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      }`}
                    >
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
              <button
                type="button"
                role="switch"
                aria-checked={active}
                onClick={() => onChange(field.key, active ? "" : "1")}
                className={`relative h-6 w-11 rounded-full transition-colors ${active ? "bg-zinc-950" : "bg-zinc-200"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${active ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </label>
          )
        }

        return null
      })}

      {/* Reset */}
      <button
        type="button"
        onClick={onReset}
        className="w-full rounded-xl border border-zinc-200 py-2.5 text-sm text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-950"
      >
        Сбросить фильтры
      </button>
    </div>
  )
}

// ── Main search component ────────────────────────────────────────────────────

function SearchResults() {
  const params = useSearchParams()
  const router = useRouter()
  const rawQ    = params.get("q")    ?? ""
  const rawCity = params.get("city") ?? ""
  const rawCat  = (params.get("cat") ?? "") as ListingCategory | ""

  const [sort, setSort]               = useState<SortKey>("relevance")
  const [selectedCategory, setSelectedCategory] = useState<ListingCategory | "">(rawCat)
  const [priceMin, setPriceMin]       = useState("")
  const [priceMax, setPriceMax]       = useState("")
  const [filters, setFilters]         = useState<FilterState>(emptyFilters())
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const activeFields = selectedCategory
    ? (CATEGORY_FILTERS[selectedCategory]?.fields ?? GENERAL_FILTERS)
    : GENERAL_FILTERS

  function updateFilter(key: string, value: string | string[]) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function resetFilters() {
    setFilters(emptyFilters())
    setPriceMin("")
    setPriceMax("")
  }

  const results = useMemo(() => {
    const q    = rawQ.toLowerCase().trim()
    const city = (filters["city"] as string) || rawCity.trim()

    let filtered = listings.filter((l) => {
      if (q) {
        const haystack = [l.title, l.subtitle, l.description, ...l.tags, l.city, l.district ?? ""]
          .join(" ").toLowerCase()
        if (!haystack.includes(q)) return false
      }
      if (city && city !== "Везде" && l.city !== city) return false
      if (selectedCategory && l.category !== selectedCategory) return false

      const min = priceMin ? parseInt(priceMin, 10) : null
      const max = priceMax ? parseInt(priceMax, 10) : null
      if (min !== null && l.price < min) return false
      if (max !== null && l.price > max) return false

      // Condition
      const cond = filters["condition"] as string
      if (cond && (l as Record<string, unknown>)["condition"] !== cond) { /* pass for now */ }

      return true
    })

    if (sort === "price_asc")  filtered = [...filtered].sort((a, b) => a.price - b.price)
    if (sort === "price_desc") filtered = [...filtered].sort((a, b) => b.price - a.price)

    return filtered
  }, [rawQ, rawCity, selectedCategory, priceMin, priceMax, filters, sort])

  const titleParts: string[] = []
  if (rawQ) titleParts.push(`«${rawQ}»`)
  if (rawCity && rawCity !== "Везде") titleParts.push(`в ${rawCity}`)
  const activeCount = Object.values(filters).filter((v) => Array.isArray(v) ? v.length : v).length
    + (priceMin ? 1 : 0) + (priceMax ? 1 : 0)

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 pb-28 lg:pb-10 lg:py-10">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
          {titleParts.length > 0 ? `Поиск: ${titleParts.join(" ")}` : "Все объявления"}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {results.length === 0
            ? "Ничего не найдено"
            : `${results.length} ${plural(results.length)}`}
        </p>
      </div>

      {/* ── Category tabs ─────────────────────────────────────────────────── */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => { setSelectedCategory(""); resetFilters() }}
          className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${
            selectedCategory === "" ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          Все
        </button>
        {marketplaceCategories.map((c) => (
          <button
            key={c.slug}
            onClick={() => { setSelectedCategory(c.slug as ListingCategory); resetFilters() }}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              selectedCategory === c.slug ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {c.title}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

        {/* ── Sidebar (desktop) ─────────────────────────────────────────── */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-4 overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="mb-4 text-base font-semibold text-zinc-950">Фильтры</p>
            <FilterPanel
              fields={activeFields}
              state={filters}
              priceMin={priceMin}
              priceMax={priceMax}
              onChange={updateFilter}
              onPriceMin={setPriceMin}
              onPriceMax={setPriceMax}
              onReset={resetFilters}
            />
          </div>
        </aside>

        {/* ── Results ──────────────────────────────────────────────────── */}
        <div className="min-w-0 flex-1">

          {/* Sort + mobile filter button */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {/* Mobile filter toggle */}
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition lg:hidden ${
                activeCount > 0 ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-700"
              }`}
            >
              ⊞ Фильтры{activeCount > 0 && ` · ${activeCount}`}
            </button>

            <span className="text-xs text-zinc-400">Сортировка:</span>
            {(
              [
                { key: "relevance", label: "Релевантность" },
                { key: "newest",    label: "Новее" },
                { key: "price_asc", label: "Дешевле" },
                { key: "price_desc",label: "Дороже" },
              ] as { key: SortKey; label: string }[]
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSort(key)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  sort === key ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {results.length === 0 ? (
            <EmptyState q={rawQ} />
          ) : (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((listing) => (
                <ListingCard key={listing.id} listing={listing} compact />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile filter sheet ──────────────────────────────────────────── */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[160] lg:hidden" onClick={() => setMobileFiltersOpen(false)}>
          <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm" />
          <div
            className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3"><div className="h-1 w-10 rounded-full bg-zinc-200" /></div>
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
              <p className="text-base font-semibold text-zinc-950">Фильтры</p>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500"
              >×</button>
            </div>
            <div className="p-5">
              <FilterPanel
                fields={activeFields}
                state={filters}
                priceMin={priceMin}
                priceMax={priceMax}
                onChange={updateFilter}
                onPriceMin={setPriceMin}
                onPriceMax={setPriceMax}
                onReset={resetFilters}
              />
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="mt-4 h-12 w-full rounded-2xl bg-[hsl(var(--nashlo-orange))] text-sm font-semibold text-white"
              >
                Показать {results.length} {plural(results.length)}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function EmptyState({ q }: { q: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-zinc-200 bg-white py-20 text-center">
      <div className="mb-4 text-5xl">🔍</div>
      <p className="text-lg font-semibold text-zinc-950">
        {q ? `По запросу «${q}» ничего не найдено` : "Ничего не найдено"}
      </p>
      <p className="mt-2 max-w-xs text-sm text-zinc-500">
        Попробуйте изменить запрос или убрать фильтры
      </p>
      <Link href="/" className="mt-6 rounded-xl bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800">
        На главную
      </Link>
    </div>
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
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-10 text-sm text-zinc-400">Загрузка...</div>}>
      <SearchResults />
    </Suspense>
  )
}
