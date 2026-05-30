"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import { SlidersHorizontal, X } from "lucide-react"
import { MixedFeedGrid } from "@/components/ads/MixedFeedGrid"
import { useFeedAds } from "@/hooks/useFeedAds"
import { CategoryFiltersSidebar } from "@/components/marketplace/CategoryFiltersSidebar"
import { EmptyState } from "@/components/marketplace/EmptyState"
import { WantToBuyPromoBlock } from "@/components/want-to-buy/WantToBuyPromoBlock"
import { PAGE_CONTAINER_WIDE_CLASS } from "@/components/layout/PageContainer"
import { type AppListing, CATEGORY_META } from "@/lib/listing-types"
import { rankListingsForUser, trackUserInterest } from "@/lib/recommendations"
import {
  filterFieldsForCategory,
  type FilterState,
  emptyFilters,
  parseFiltersFromSearchParams,
} from "@/lib/filters"
import { parseUiSortFromSearchParams, uiSortToApiParams, type UiSortKey } from "@/lib/listings/sort-url"
import {
  getStoredCity,
  isCityFilterActive,
  NASHLO_CITY_CHANGE_EVENT,
} from "@/lib/city-selection"
import { LISTING_GRID_CLASS } from "@/lib/listings/listing-grid"

type SortKey = UiSortKey

function plural(n: number) {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return "объявление"
  if ([2, 3, 4].includes(m10) && ![12, 13, 14].includes(m100)) return "объявления"
  return "объявлений"
}

/** Строит URLSearchParams из состояния фильтров для передачи в API */
function buildApiParams(
  q: string,
  city: string,
  category: string,
  priceMin: string,
  priceMax: string,
  filters: FilterState,
  sort: SortKey,
  page = 1,
): URLSearchParams {
  const sp = new URLSearchParams()
  sp.set("page", String(page))
  if (q) sp.set("q", q)
  if (category) sp.set("category", category)

  const cityVal = (filters["city"] as string) || city
  if (isCityFilterActive(cityVal)) sp.set("city", cityVal)

  if (priceMin) sp.set("priceMin", priceMin)
  if (priceMax) sp.set("priceMax", priceMax)

  // Передаём все остальные фильтры
  for (const [key, value] of Object.entries(filters)) {
    if (!value || key === "city") continue
    if (Array.isArray(value)) {
      if (value.length > 0) sp.set(key, value.join(","))
    } else if (typeof value === "string" && value.trim()) {
      sp.set(key, value.trim())
    }
  }

  const mapped = uiSortToApiParams(sort)
  sp.set("sortBy", mapped.sortBy)
  sp.set("sortOrder", mapped.sortOrder)
  sp.set("pageSize", "60")
  return sp
}

function SearchResults() {
  const router = useRouter()
  const params = useSearchParams()

  const rawQ    = params.get("q")    ?? ""
  const rawCity = params.get("city") ?? ""
  const rawCat  = params.get("cat") ?? params.get("category") ?? ""

  const [sort, setSort] = useState<SortKey>(() => parseUiSortFromSearchParams(params, "default"))
  const [page, setPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(rawCat)
  const [query, setQuery] = useState(rawQ)
  const [priceMin, setPriceMin] = useState(params.get("priceMin") ?? "")
  const [priceMax, setPriceMax] = useState(params.get("priceMax") ?? "")
  const [filters, setFilters] = useState<FilterState>(() =>
    parseFiltersFromSearchParams(params),
  )
  const [nearCoords, setNearCoords] = useState(false)
  const [geoError, setGeoError] = useState<string>()
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [results, setResults] = useState<AppListing[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const activeFields = filterFieldsForCategory(selectedCategory || null)

  function updateFilter(key: string, value: string | string[]) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function resetFilters() {
    setFilters(emptyFilters())
    setPriceMin("")
    setPriceMax("")
  }

  const cityFilter = (filters["city"] as string) || rawCity
  const cityIdForAds = isCityFilterActive(cityFilter) ? cityFilter : undefined

  const { items: feedItems, sessionId } = useFeedAds({
    listings: results,
    placement: "SEARCH_FEED_INLINE",
    enabled: !loading && results.length > 0,
    categoryId: selectedCategory || undefined,
    cityId: cityIdForAds,
    query: query.trim() || undefined,
  })

  useEffect(() => {
    setQuery(params.get("q") ?? "")
    setSelectedCategory(params.get("cat") ?? params.get("category") ?? "")
    setPriceMin(params.get("priceMin") ?? "")
    setPriceMax(params.get("priceMax") ?? "")
    setFilters(parseFiltersFromSearchParams(params))
    setSort(parseUiSortFromSearchParams(params, "default"))
    setPage(1)
  }, [params])

  useEffect(() => {
    if (rawCity) return
    const stored = getStoredCity()
    if (!isCityFilterActive(stored)) return
    setFilters((prev) => (prev.city ? prev : { ...prev, city: stored }))
  }, [rawCity])

  useEffect(() => {
    function onCityChange() {
      const stored = getStoredCity()
      setFilters((prev) => {
        const next = { ...prev }
        if (isCityFilterActive(stored)) next.city = stored
        else delete next.city
        return next
      })
    }
    window.addEventListener(NASHLO_CITY_CHANGE_EVENT, onCityChange)
    return () => window.removeEventListener(NASHLO_CITY_CHANGE_EVENT, onCityChange)
  }, [])

  function handleRequestNearby() {
    if (!navigator.geolocation) {
      setGeoError("Геолокация не поддерживается браузером")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFilters((prev) => ({
          ...prev,
          lat: String(pos.coords.latitude),
          lng: String(pos.coords.longitude),
        }))
        setNearCoords(true)
        setGeoError(undefined)
      },
      () => setGeoError("Не удалось получить геопозицию"),
    )
  }

  function handleClearGeo() {
    setFilters((prev) => {
      const next = { ...prev }
      delete next["lat"]
      delete next["lng"]
      delete next["radius"]
      return next
    })
    setNearCoords(false)
    setGeoError(undefined)
  }

  const fetchListings = useCallback(
    async (targetPage = 1, append = false) => {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      if (append) setLoadingMore(true)
      else setLoading(true)
      setFetchError(false)

      const sp = buildApiParams(
        query,
        cityFilter,
        selectedCategory,
        priceMin,
        priceMax,
        filters,
        sort,
        targetPage,
      )

      try {
        const res = await fetch(`/api/listings?${sp.toString()}`, { signal: ctrl.signal })
        if (!res.ok) throw new Error("fetch failed")
        const data = await res.json()
        let items: AppListing[] = data.items ?? []
        if (sort === "default") {
          items = rankListingsForUser(items, {
            preferredCity: isCityFilterActive(cityFilter) ? cityFilter : undefined,
          })
        }
        setTotal(data.total ?? 0)
        setPage(targetPage)
        setResults((prev) => (append ? [...prev, ...items] : items))
      } catch (e: unknown) {
        if (!(e instanceof Error && e.name === "AbortError")) {
          if (!append) {
            setResults([])
            setTotal(0)
          }
          setFetchError(true)
        }
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [query, cityFilter, selectedCategory, priceMin, priceMax, filters, sort],
  )

  useEffect(() => {
    setPage(1)
    const t = setTimeout(() => void fetchListings(1, false), 300)
    return () => clearTimeout(t)
  }, [fetchListings])

  const canLoadMore = results.length < total && !loading && !loadingMore

  useEffect(() => {
    const sp = new URLSearchParams()
    const trimmedQuery = query.trim()
    if (trimmedQuery) sp.set("q", trimmedQuery)
    if (selectedCategory) sp.set("cat", selectedCategory)
    if (isCityFilterActive(cityFilter)) sp.set("city", cityFilter)
    if (priceMin) sp.set("priceMin", priceMin)
    if (priceMax) sp.set("priceMax", priceMax)
    if (sort !== "default") sp.set("sort", sort)
    for (const [key, value] of Object.entries(filters)) {
      if (!value || key === "city") continue
      if (Array.isArray(value)) {
        if (value.length > 0) sp.set(key, value.join(","))
      } else if (typeof value === "string" && value.trim()) {
        sp.set(key, value.trim())
      }
    }
    const next = sp.toString()
    const current = params.toString()
    if (next !== current) {
      router.replace(next ? `/search?${next}` : "/search", { scroll: false })
    }
  }, [cityFilter, filters, params, priceMax, priceMin, query, router, selectedCategory, sort])

  useEffect(() => {
    const trimmedQuery = query.trim()
    if (!trimmedQuery && !selectedCategory) return
    trackUserInterest({
      category: selectedCategory || undefined,
      query: trimmedQuery || undefined,
      weight: trimmedQuery ? 2 : 1,
    })
  }, [query, selectedCategory])

  // Считаем активные фильтры (кроме гео и city)
  const activeCount =
    Object.entries(filters).filter(([k, v]) => {
      if (["lat", "lng", "city"].includes(k)) return false
      return Array.isArray(v) ? v.length > 0 : Boolean(v)
    }).length +
    (priceMin ? 1 : 0) +
    (priceMax ? 1 : 0)

  const sidebarProps = {
    category: selectedCategory,
    query,
    onQueryChange: setQuery,
    fields: activeFields,
    state: filters,
    priceMin,
    priceMax,
    onChange: updateFilter,
    onPriceMin: setPriceMin,
    onPriceMax: setPriceMax,
    onReset: resetFilters,
    onRequestNearby: handleRequestNearby,
    onClearGeo: handleClearGeo,
    geoError,
    nearCoords,
  }

  return (
    <main className={`${PAGE_CONTAINER_WIDE_CLASS} py-5 pb-8 lg:py-8 lg:pb-10`}>
      {/* Заголовок */}
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-[#111827] sm:text-[1.75rem]">
          {query.trim() ? `Поиск: «${query.trim()}»` : selectedCategory
            ? (CATEGORY_META.find((c) => c.slug === selectedCategory)?.title ?? "Объявления")
            : "Все объявления"}
        </h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          {loading ? "Загрузка…" : total === 0 ? "Ничего не найдено" : `${total.toLocaleString("ru-RU")} ${plural(total)}`}
        </p>
      </div>

      {/* Табы категорий */}
      <div className="mb-5 -mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-2 sm:-mx-5 sm:px-5 lg:mx-0 lg:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => { setSelectedCategory(""); resetFilters() }}
          className={`shrink-0 snap-start rounded-xl px-4 py-2 text-sm font-semibold transition ${
            !selectedCategory
              ? "bg-[hsl(var(--nashlo-orange))] text-white"
              : "bg-white text-zinc-600 shadow-[0_1px_3px_rgba(15,23,42,0.05)] hover:bg-zinc-50"
          }`}
        >
          Все
        </button>
        {CATEGORY_META.map((c) => (
          <button
            key={c.slug}
            onClick={() => { setSelectedCategory(c.slug); resetFilters() }}
            className={`shrink-0 snap-start rounded-xl px-4 py-2 text-sm font-semibold transition ${
              selectedCategory === c.slug
                ? "bg-[hsl(var(--nashlo-orange))] text-white"
                : "bg-white text-zinc-600 shadow-[0_1px_3px_rgba(15,23,42,0.05)] hover:bg-zinc-50"
            }`}
          >
            {c.title}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Сайдбар — desktop */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24">
            <CategoryFiltersSidebar {...sidebarProps} />
          </div>
        </aside>

        {/* Контент */}
        <div className="min-w-0 flex-1">
          {/* Toolbar */}
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-[20px] border border-zinc-200/90 bg-white px-3 py-3 shadow-sm sm:px-4">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition lg:hidden ${
                activeCount > 0
                  ? "bg-[hsl(var(--nashlo-orange))] text-white"
                  : "bg-zinc-100 text-zinc-700"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Фильтры{activeCount > 0 && ` · ${activeCount}`}
            </button>

            <span className="text-xs text-zinc-400">Сортировка:</span>
            {(
              [
                { key: "newest" as SortKey, label: "Новее" },
                { key: "price_asc" as SortKey, label: "Дешевле" },
                { key: "price_desc" as SortKey, label: "Дороже" },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSort(key)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  sort === key
                    ? "bg-[hsl(var(--nashlo-orange))] text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Активные фильтры-чипы */}
          {activeCount > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {priceMin && (
                <span className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700">
                  от {Number(priceMin).toLocaleString("ru-RU")} ₽
                  <button onClick={() => setPriceMin("")} className="ml-1 text-zinc-400 hover:text-zinc-700"><X className="h-3 w-3" /></button>
                </span>
              )}
              {priceMax && (
                <span className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700">
                  до {Number(priceMax).toLocaleString("ru-RU")} ₽
                  <button onClick={() => setPriceMax("")} className="ml-1 text-zinc-400 hover:text-zinc-700"><X className="h-3 w-3" /></button>
                </span>
              )}
              {Object.entries(filters)
                .filter(([k, v]) => {
                  if (["lat", "lng", "city", "dateRange"].includes(k)) return false
                  return Array.isArray(v) ? v.length > 0 : Boolean(v)
                })
                .map(([k, v]) => {
                  const label = Array.isArray(v) ? v.join(", ") : String(v)
                  const field = activeFields.find((f) => f.key === k)
                  return (
                    <span key={k} className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700">
                      {field?.label ?? k}: {label}
                      <button onClick={() => updateFilter(k, "")} className="ml-1 text-zinc-400 hover:text-zinc-700"><X className="h-3 w-3" /></button>
                    </span>
                  )
                })}
              <button onClick={resetFilters} className="text-xs font-medium text-zinc-400 hover:text-zinc-700 underline underline-offset-2">
                Сбросить все
              </button>
            </div>
          )}

          {/* Результаты */}
          {loading ? (
            <div className={LISTING_GRID_CLASS}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] animate-pulse rounded-[20px] bg-zinc-100" />
              ))}
            </div>
          ) : fetchError ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-8 text-center">
              <p className="text-base font-semibold text-zinc-950">Не удалось загрузить результаты</p>
              <p className="mt-2 text-sm text-zinc-600">Попробуйте обновить страницу или повторить поиск чуть позже.</p>
              <button
                type="button"
                onClick={() => fetchListings()}
                className="mt-5 rounded-xl bg-[hsl(var(--nashlo-orange))] px-5 py-2.5 text-sm font-semibold text-white"
              >
                Повторить
              </button>
            </div>
          ) : results.length === 0 ? (
            <div>
              <EmptyState
                title={query.trim() ? `По запросу «${query.trim()}» ничего не найдено` : "Объявлений пока нет"}
                description="Попробуйте изменить запрос, убрать часть фильтров или перейти на главную доски объявлений."
                actionLabel={activeCount > 0 ? "Сбросить фильтры" : "На главную"}
                actionHref={activeCount > 0 ? undefined : "/"}
                compact
              />
              {activeCount > 0 && (
                <div className="-mt-16 flex justify-center">
                  <button onClick={resetFilters} className="rounded-xl bg-[hsl(var(--nashlo-orange))] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(var(--nashlo-orange)/0.92)]">
                    Сбросить фильтры
                  </button>
                </div>
              )}
              <div className="mx-auto mt-4 max-w-3xl">
                <WantToBuyPromoBlock compact />
              </div>
            </div>
          ) : (
            <>
              <div className={LISTING_GRID_CLASS}>
                <MixedFeedGrid
                  items={feedItems}
                  placement="SEARCH_FEED_INLINE"
                  compact
                  sessionId={sessionId}
                  categoryId={selectedCategory || undefined}
                  cityId={cityIdForAds}
                />
              </div>
              {canLoadMore ? (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    disabled={loadingMore}
                    onClick={() => void fetchListings(page + 1, true)}
                    className="rounded-xl border border-zinc-200 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50 disabled:opacity-50"
                  >
                    {loadingMore ? "Загрузка…" : "Показать ещё"}
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      {/* Mobile filters drawer */}
      {mobileFiltersOpen && (
        <div
          className="fixed inset-0 z-[160] lg:hidden"
          onClick={() => setMobileFiltersOpen(false)}
        >
          <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm" />
          <div
            className="absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-3xl bg-[#F7F8FA] pb-[env(safe-area-inset-bottom)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3">
              <div className="h-1 w-10 rounded-full bg-zinc-300" />
            </div>
            <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-4">
              <p className="text-base font-semibold text-[#111827]">Фильтры</p>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4">
              <CategoryFiltersSidebar {...sidebarProps} />
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="mt-4 h-12 w-full rounded-2xl bg-[hsl(var(--nashlo-orange))] text-sm font-semibold text-white transition hover:bg-[hsl(var(--nashlo-orange)/0.92)]"
              >
                Показать {total > 0 ? `${total.toLocaleString("ru-RU")} ${plural(total)}` : "результаты"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className={`${PAGE_CONTAINER_WIDE_CLASS} py-10 text-sm text-zinc-400`}>
          Загрузка…
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  )
}
