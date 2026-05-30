"use client"

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ClientMap } from "@/components/map/ClientMap"
import { CategoryActiveFilters } from "@/components/marketplace/CategoryActiveFilters"
import { EmptyState } from "@/components/marketplace/EmptyState"
import { CategoryFiltersSidebar } from "@/components/marketplace/CategoryFiltersSidebar"
import { CategoryHero } from "@/components/marketplace/CategoryHero"
import { MixedFeedGrid } from "@/components/ads/MixedFeedGrid"
import { ListingCard } from "@/components/marketplace/ListingCard"
import { LISTING_GRID_CLASS } from "@/lib/listings/listing-grid"
import { ListingBreadcrumbs } from "@/components/listings/ListingBreadcrumbs"
import { useFeedAds } from "@/hooks/useFeedAds"
import {
  getStoredCity,
  isCityFilterActive,
  NASHLO_CITY_CHANGE_EVENT,
} from "@/lib/city-selection"
import { type AppListing, CATEGORY_META, listingHref } from "@/lib/listing-types"
import { rankListingsForUser, trackUserInterest } from "@/lib/recommendations"
import type { BreadcrumbItem } from "@/lib/categories/listing-breadcrumbs"
import { buildCategoryPageBreadcrumbs } from "@/lib/categories/listing-breadcrumbs"
import { normalizeListingsSearchParams } from "@/lib/listings/filters"
import { parseUiSortFromSearchParams, uiSortToApiParams } from "@/lib/listings/sort-url"
import { emptyFilters, parseFiltersFromSearchParams, type FilterState } from "@/lib/filters"
import { filterFieldsForCategory, labelForFilterField } from "@/config/category-filters"
import { fieldsWithDynamicSelectOptions } from "@/lib/listings/merge-dynamic-select-options"
import { getCategoryConfig } from "@/config/marketplace-categories"
import { WantToBuyCategoryCta } from "@/components/want-to-buy/WantToBuyCategoryCta"
import { PAGE_CONTAINER_WIDE_CLASS } from "@/components/layout/PageContainer"

type CategoryPageProps = {
  category: string
  title?: string
  links?: Array<{ label: string; href: string }>
  fixedParams?: Record<string, string>
  initialQuery?: string
  initialCity?: string
  initialSort?: string
  initialPriceMax?: string
  hideCityFilter?: boolean
  breadcrumbs?: BreadcrumbItem[]
  scopeLabel?: string
  quickLinks?: Array<{ label: string; href: string }>
  activeQuickLinkHref?: string
}

const sortOptions = [
  { value: "default",    label: "По умолчанию" },
  { value: "popular",    label: "Популярные" },
  { value: "newest",     label: "Сначала новые" },
  { value: "price_asc",  label: "Дешевле" },
  { value: "price_desc", label: "Дороже" },
]

function CategoryPageContent({
  category,
  title,
  links,
  fixedParams,
  initialQuery = "",
  initialCity = "",
  initialSort = "default",
  initialPriceMax = "",
  hideCityFilter = false,
  breadcrumbs,
  scopeLabel,
  quickLinks,
  activeQuickLinkHref,
}: CategoryPageProps) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const meta     = CATEGORY_META.find((c) => c.slug === category)
  const categoryConfig = getCategoryConfig(category)

  const [items, setItems]   = useState<AppListing[]>([])
  const [total, setTotal]   = useState(0)
  const [page, setPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [query, setQuery]   = useState(() => {
    const normalized = normalizeListingsSearchParams(new URLSearchParams(params.toString()))
    return normalized.get("q") ?? initialQuery
  })
  const [priceMin, setPriceMin] = useState(() => {
    const normalized = normalizeListingsSearchParams(new URLSearchParams(params.toString()))
    return normalized.get("priceMin") ?? ""
  })
  const [priceMax, setPriceMax] = useState(() => {
    const normalized = normalizeListingsSearchParams(new URLSearchParams(params.toString()))
    return normalized.get("priceMax") ?? initialPriceMax
  })
  const [filters, setFilters] = useState<FilterState>(() => {
    const normalized = normalizeListingsSearchParams(new URLSearchParams(params.toString()))
    const parsed = parseFiltersFromSearchParams(normalized)
    for (const key of Object.keys(fixedParams ?? {})) {
      delete parsed[key]
    }
    if (initialCity && !parsed.city) parsed.city = initialCity
    return parsed
  })
  const [nearCoords, setNearCoords] = useState<{ lat: number; lng: number } | null>(() => {
    const normalized = normalizeListingsSearchParams(new URLSearchParams(params.toString()))
    const lat = Number.parseFloat(normalized.get("lat") ?? "")
    const lng = Number.parseFloat(normalized.get("lng") ?? "")
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
  })
  const [geoError, setGeoError] = useState("")
  const [sort, setSort]     = useState(() => parseUiSortFromSearchParams(params, initialSort as "default" | "popular" | "newest" | "price_asc" | "price_desc"))
  const [viewMode, setViewMode] = useState<"list" | "map">("list")
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [dynamicFilterOptions, setDynamicFilterOptions] = useState<Record<string, string[]>>({})
  const abortRef = useRef<AbortController | null>(null)

  const panelFields = useMemo(() => {
    const baseFields = filterFieldsForCategory(category).filter((field) =>
      (hideCityFilter ? field.key !== "city" : true) &&
      !(fixedParams && field.key in fixedParams),
    )
    return fieldsWithDynamicSelectOptions(baseFields, dynamicFilterOptions).map((field) =>
      field.key === "radius"
        ? {
            ...field,
            disabled: !nearCoords,
            helperText: !nearCoords
              ? "Радиус поиска будет доступен после определения координат. Пока: В разработке."
              : undefined,
          }
        : field,
    )
  }, [category, dynamicFilterOptions, fixedParams, hideCityFilter, nearCoords])

  const fetchItems = useCallback(async (targetPage = 1, append = false) => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    if (append) setLoadingMore(true)
    else setLoading(true)

    const sp = new URLSearchParams()
    sp.set("category", category)
    sp.set("pageSize", "60")
    sp.set("page", String(targetPage))
    for (const [key, value] of Object.entries(fixedParams ?? {})) {
      if (value) sp.set(key, value)
    }
    if (query) sp.set("q", query)
    if (priceMin) sp.set("priceMin", priceMin)
    if (priceMax) sp.set("priceMax", priceMax)
    if (nearCoords) {
      sp.set("lat", String(nearCoords.lat))
      sp.set("lng", String(nearCoords.lng))
    }
    for (const [key, value] of Object.entries(filters)) {
      if (fixedParams && key in fixedParams) continue
      if (key === "city" && !isCityFilterActive(Array.isArray(value) ? value[0] : String(value))) {
        continue
      }
      if (Array.isArray(value)) {
        if (value.length) sp.set(key, value.join(","))
      } else if (value) {
        sp.set(key, value)
      }
    }
    const mapped = uiSortToApiParams(sort as "default" | "popular" | "newest" | "price_asc" | "price_desc")
    sp.set("sortBy", mapped.sortBy)
    sp.set("sortOrder", mapped.sortOrder)

    try {
      const res = await fetch(`/api/listings?${sp.toString()}`, { signal: ctrl.signal })
      if (!res.ok) return
      const data = await res.json()
      let nextItems: AppListing[] = data.items ?? []
      const cityVal = (filters["city"] as string) || ""
      if (sort === "default") {
        nextItems = rankListingsForUser(nextItems, {
          preferredCity: isCityFilterActive(cityVal) ? cityVal : undefined,
        })
      }
      setTotal(data.total ?? 0)
      setPage(targetPage)
      setItems((prev) => (append ? [...prev, ...nextItems] : nextItems))
      setDynamicFilterOptions(
        data.availableFilterOptions && typeof data.availableFilterOptions === "object"
          ? data.availableFilterOptions
          : {},
      )
    } catch (e: unknown) {
      if (!(e instanceof Error && e.name === "AbortError")) {
        if (!append) {
          setItems([])
          setTotal(0)
        }
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [category, fixedParams, filters, nearCoords, priceMax, priceMin, query, sort])

  useEffect(() => {
    setPage(1)
    const t = setTimeout(() => void fetchItems(1, false), 300)
    return () => clearTimeout(t)
  }, [fetchItems])

  const canLoadMore = items.length < total && !loading && !loadingMore

  useEffect(() => {
    if (hideCityFilter) return

    function applyStoredCity(stored: string) {
      setFilters((prev) => {
        const next = { ...prev }
        if (isCityFilterActive(stored)) next.city = stored
        else delete next.city
        return next
      })
    }

    const normalized = normalizeListingsSearchParams(new URLSearchParams(params.toString()))
    if (!normalized.get("city") && !initialCity) {
      applyStoredCity(getStoredCity())
    }

    const onCityChange = () => applyStoredCity(getStoredCity())
    window.addEventListener(NASHLO_CITY_CHANGE_EVENT, onCityChange)
    return () => window.removeEventListener(NASHLO_CITY_CHANGE_EVENT, onCityChange)
  }, [hideCityFilter, initialCity, params])

  useEffect(() => {
    trackUserInterest({ category, query: query || undefined, weight: query ? 2 : 1 })
  }, [category, query])

  useEffect(() => {
    const sp = new URLSearchParams()
    if (query) sp.set("q", query)
    if (priceMin) sp.set("priceMin", priceMin)
    if (priceMax) sp.set("priceMax", priceMax)
    if (sort) sp.set("sort", sort)
    if (nearCoords) {
      sp.set("lat", String(nearCoords.lat))
      sp.set("lng", String(nearCoords.lng))
    }
    for (const [key, value] of Object.entries(filters)) {
      if (fixedParams && key in fixedParams) continue
      if (key === "city" && !isCityFilterActive(Array.isArray(value) ? value[0] : String(value))) {
        continue
      }
      if (Array.isArray(value)) {
        if (value.length) sp.set(key, value.join(","))
      } else if (value) {
        sp.set(key, value)
      }
    }
    router.replace(sp.toString() ? `${pathname}?${sp.toString()}` : pathname, { scroll: false })
  }, [filters, fixedParams, nearCoords, pathname, priceMax, priceMin, query, router, sort])

  const requestNearbySearch = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError("Не удалось получить геолокацию. Выберите город или район вручную.")
      return
    }
    setGeoError("")
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNearCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setFilters((prev) => ({ ...prev, radius: (prev.radius as string) || "5" }))
      },
      () => {
        setGeoError("Не удалось получить геолокацию. Выберите город или район вручную.")
      },
      { maximumAge: 600_000, timeout: 12_000, enableHighAccuracy: false },
    )
  }, [])

  function clearGeoSearch() {
    setNearCoords(null)
    setGeoError("")
    setFilters((prev) => ({ ...prev, radius: "" }))
  }

  function updateFilter(key: string, value: string | string[]) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function resetFilters() {
    const next = emptyFilters()
    if (initialCity && !hideCityFilter) {
      next.city = initialCity
    }
    setFilters(next)
    setPriceMin("")
    setPriceMax(initialPriceMax)
  }

  const cityForAds = isCityFilterActive((filters.city as string) || initialCity)
    ? String((filters.city as string) || initialCity)
    : undefined

  const { items: feedItems, sessionId } = useFeedAds({
    listings: items,
    placement: "CATEGORY_FEED_INLINE",
    enabled: !loading && items.length > 0 && viewMode === "list",
    categoryId: category,
    cityId: cityForAds,
    query: query.trim() || undefined,
  })
  const mapListings = useMemo(
    () =>
      items.map((listing) => ({
        id: listing.id,
        title: listing.title,
        price: listing.price,
        city: listing.city ?? null,
        district: listing.district ?? null,
        address: listing.location ?? null,
        latitude: listing.lat ?? null,
        longitude: listing.lng ?? null,
        imageUrl: listing.images?.[0] ?? null,
        href: listingHref(listing),
        showExactAddress: listing.showExactAddress ?? false,
      })),
    [items],
  )

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (query.trim()) count += 1
    if (priceMin) count += 1
    if (priceMax) count += 1
    if (nearCoords) count += 1
    for (const value of Object.values(filters)) {
      if (Array.isArray(value)) {
        if (value.length) count += 1
      } else if (value) {
        count += 1
      }
    }
    return count
  }, [filters, nearCoords, priceMax, priceMin, query])

  const activeFilterChips = useMemo(() => {
    const fieldsByKey = new Map(panelFields.map((field) => [field.key, field]))
    const chips: Array<{ key: string; label: string; value: string }> = []
    if (query.trim()) {
      chips.push({
        key: "q",
        label: "Поиск",
        value: query.trim().length > 28 ? `${query.trim().slice(0, 28)}…` : query.trim(),
      })
    }
    if (priceMin) {
      chips.push({ key: "priceMin", label: "Цена от", value: priceMin })
    }
    if (priceMax) {
      chips.push({ key: "priceMax", label: "Цена до", value: priceMax })
    }
    for (const [key, value] of Object.entries(filters)) {
      if (fixedParams && key in fixedParams) continue
      if (!value || (Array.isArray(value) && value.length === 0)) continue
      const rangeMatch = key.match(/^(.*)_(from|to)$/)
      const baseKey = rangeMatch ? rangeMatch[1]! : key
      const field = fieldsByKey.get(baseKey)
      const label = rangeMatch
        ? `${labelForFilterField(category, baseKey)} ${rangeMatch[2] === "from" ? "от" : "до"}`
        : labelForFilterField(category, key)

      const display = Array.isArray(value)
        ? value
            .map((entry) => {
              if (field?.type === "select" || field?.type === "multi") {
                return field.options.find((option) => option.value === entry)?.label ?? entry
              }
              return entry
            })
            .join(", ")
        : field?.type === "select" || field?.type === "multi"
          ? field.options.find((option) => option.value === String(value))?.label ?? String(value)
          : field?.type === "toggle"
            ? "Да"
            : String(value)
      chips.push({
        key,
        label,
        value: display.length > 30 ? `${display.slice(0, 30)}…` : display,
      })
    }
    if (nearCoords) {
      chips.push({ key: "nearby", label: "Геопоиск", value: "Рядом со мной" })
    }
    return chips
  }, [category, filters, fixedParams, nearCoords, panelFields, priceMax, priceMin, query])

  function clearAllFilters() {
    setQuery(initialQuery)
    setNearCoords(null)
    setGeoError("")
    setSort(initialSort)
    resetFilters()
  }

  function removeChip(key: string) {
    if (key === "q") {
      setQuery("")
      return
    }
    if (key === "priceMin") {
      setPriceMin("")
      return
    }
    if (key === "priceMax") {
      setPriceMax("")
      return
    }
    if (key === "nearby") {
      clearGeoSearch()
      return
    }
    setFilters((prev) => ({
      ...prev,
      [key]: Array.isArray(prev[key]) ? [] : "",
    }))
  }

  const resolvedBreadcrumbs =
    breadcrumbs?.length ? breadcrumbs : buildCategoryPageBreadcrumbs(category)

  return (
    <>
      <ListingBreadcrumbs crumbs={resolvedBreadcrumbs} />
      <main className={`${PAGE_CONTAINER_WIDE_CLASS} py-5 pb-8 sm:py-6 lg:py-8 lg:pb-10`}>
        <CategoryHero
          title={title ?? categoryConfig?.title ?? meta?.title ?? category}
          scopeLabel={scopeLabel}
          total={total}
          loading={loading}
          quickLinks={quickLinks ?? links}
          activeQuickLinkHref={activeQuickLinkHref}
        />

        <section className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start">
          <aside className="hidden w-[304px] shrink-0 lg:block xl:w-[320px]">
            <div className="sticky top-24">
              <div className="mb-4 flex items-center justify-between px-1">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-950">Фильтры</h2>
                </div>
                {activeFilterCount > 0 ? (
                  <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-600 shadow-sm">
                    {activeFilterCount}
                  </span>
                ) : null}
              </div>
              <CategoryFiltersSidebar
                category={category}
                query={query}
                onQueryChange={setQuery}
                fields={panelFields}
                state={filters}
                priceMin={priceMin}
                priceMax={priceMax}
                onChange={updateFilter}
                onPriceMin={setPriceMin}
                onPriceMax={setPriceMax}
                onReset={clearAllFilters}
                onRequestNearby={requestNearbySearch}
                onClearGeo={clearGeoSearch}
                geoError={geoError}
                nearCoords={Boolean(nearCoords)}
              />
            </div>
          </aside>

          <section className="min-w-0 flex-1 space-y-4">
            <div className="rounded-[24px] border border-zinc-200/90 bg-white px-4 py-4 shadow-[0_14px_38px_rgba(15,23,42,0.05)] sm:px-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">Объявления</h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    {loading ? "Загрузка..." : `${total.toLocaleString("ru-RU")} объявлений в разделе`}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMobileFiltersOpen(true)}
                    className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold shadow-sm transition active:scale-[0.98] lg:hidden ${
                      activeFilterCount > 0 ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    ⊞ Фильтры{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ""}
                  </button>

                  <div className="flex items-center rounded-full bg-zinc-100 p-1">
                    {([
                      { key: "list" as const, label: "Список" },
                      { key: "map" as const, label: "Карта" },
                    ]).map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setViewMode(key)}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                          viewMode === key ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-600"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <label className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 shadow-sm transition focus-within:border-zinc-300 focus-within:ring-4 focus-within:ring-zinc-950/5">
                    <span className="text-xs font-medium text-zinc-500">Сортировка</span>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                      className="bg-transparent text-sm font-medium text-zinc-900 outline-none"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <Link
                    href={`/create?category=${category}`}
                    className="rounded-2xl bg-[hsl(var(--nashlo-orange))] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[hsl(var(--nashlo-orange)/0.2)] transition hover:-translate-y-0.5 hover:bg-[hsl(var(--nashlo-orange)/0.9)]"
                  >
                    + Подать объявление
                  </Link>
                </div>
              </div>
            </div>

            <CategoryActiveFilters
              chips={activeFilterChips}
              onRemove={removeChip}
              onClearAll={clearAllFilters}
            />

            {(geoError || filters["radius"] || filters["address"] || filters["district"]) ? (
              <div className="rounded-[24px] border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600 shadow-sm">
                {geoError ||
                  (!nearCoords
                    ? "Радиус поиска пока недоступен: В разработке до появления координат."
                    : "Координаты найдены. Используйте город, район и радиус, чтобы точнее сузить выдачу.")}
              </div>
            ) : null}

            {loading ? (
              <div className={LISTING_GRID_CLASS}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex h-full flex-col overflow-hidden rounded-[16px] border border-zinc-200 bg-white shadow-sm"
                  >
                    <div className="aspect-[4/3] animate-pulse bg-zinc-100" />
                    <div className="space-y-2 p-3">
                      <div className="h-5 w-24 animate-pulse rounded-lg bg-zinc-200" />
                      <div className="h-4 w-full animate-pulse rounded-lg bg-zinc-100" />
                      <div className="h-4 w-4/5 animate-pulse rounded-lg bg-zinc-100" />
                      <div className="h-3 w-2/3 animate-pulse rounded-lg bg-zinc-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="space-y-4">
                <EmptyState
                  title="Пока нет объявлений"
                  description="Попробуйте изменить фильтры, выбрать другую подкатегорию или сбросить геопоиск."
                  actionLabel="Подать объявление"
                  actionHref={`/create?category=${category}`}
                />
                <WantToBuyCategoryCta categorySlug={category} />
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
                  >
                    Сбросить фильтры
                  </button>
                </div>
              </div>
            ) : viewMode === "map" ? (
              <div className="space-y-4">
                <ClientMap listings={mapListings} className="min-h-[520px]" />
                <div className={LISTING_GRID_CLASS}>
                  {items.slice(0, 6).map((item) => (
                    <ListingCard key={item.id} listing={item} />
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className={LISTING_GRID_CLASS}>
                  <MixedFeedGrid
                    items={feedItems}
                    placement="CATEGORY_FEED_INLINE"
                    compact
                    sessionId={sessionId}
                    categoryId={category}
                    cityId={cityForAds}
                  />
                </div>
                {canLoadMore ? (
                  <div className="mt-8 flex justify-center">
                    <button
                      type="button"
                      disabled={loadingMore}
                      onClick={() => void fetchItems(page + 1, true)}
                      className="rounded-xl border border-zinc-200 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50 disabled:opacity-50"
                    >
                      {loadingMore ? "Загрузка…" : "Показать ещё"}
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </section>
        </section>

        {mobileFiltersOpen ? (
          <div className="fixed inset-0 z-[160] lg:hidden" role="presentation">
            <button
              type="button"
              className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm"
              aria-label="Закрыть фильтры"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="category-mobile-filters-title"
              className="absolute inset-x-0 bottom-0 flex max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-bottom)-0.5rem))] flex-col rounded-t-[28px] border-t border-zinc-200 bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex shrink-0 justify-center pt-3">
                <div className="h-1 w-10 rounded-full bg-zinc-200" aria-hidden />
              </div>
              <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 bg-white px-5 py-4">
                <div>
                  <p id="category-mobile-filters-title" className="text-base font-semibold text-zinc-950">
                    Фильтры
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">Настройте выдачу под себя</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-lg leading-none text-zinc-500 transition hover:bg-zinc-200"
                >
                  ×
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-zinc-50/70 px-5 py-4 [-webkit-overflow-scrolling:touch]">
                <CategoryFiltersSidebar
                  category={category}
                  query={query}
                  onQueryChange={setQuery}
                  fields={panelFields}
                  state={filters}
                  priceMin={priceMin}
                  priceMax={priceMax}
                  onChange={updateFilter}
                  onPriceMin={setPriceMin}
                  onPriceMax={setPriceMax}
                  onReset={clearAllFilters}
                  onRequestNearby={requestNearbySearch}
                  onClearGeo={clearGeoSearch}
                  geoError={geoError}
                  nearCoords={Boolean(nearCoords)}
                />
              </div>
              <div className="shrink-0 border-t border-zinc-100 bg-white px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_30px_rgba(15,23,42,0.06)]">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="h-12 w-full rounded-2xl bg-[hsl(var(--nashlo-orange))] text-base font-semibold text-white shadow-sm shadow-[hsl(var(--nashlo-orange)/0.22)] transition hover:opacity-95 active:opacity-90"
                >
                  Показать {total.toLocaleString("ru-RU")} объявлений
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </>
  )
}

function CategoryPageFallback() {
  return (
    <main className={`${PAGE_CONTAINER_WIDE_CLASS} py-10`}>
      <div className="h-48 animate-pulse rounded-2xl bg-zinc-100" />
    </main>
  )
}

export function CategoryPage(props: CategoryPageProps) {
  return (
    <Suspense fallback={<CategoryPageFallback />}>
      <CategoryPageContent {...props} />
    </Suspense>
  )
}
