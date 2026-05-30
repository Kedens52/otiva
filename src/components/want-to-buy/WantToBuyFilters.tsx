"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { WantToBuyCityField } from "@/components/want-to-buy/WantToBuyCityField"
import type { WantToBuyCategoryOption } from "@/lib/want-to-buy/client-types"
import {
  getWantToBuyCategoryTitle,
  sortWantToBuyCategories,
} from "@/lib/want-to-buy/category-display"
import { getWantToBuySearchPath } from "@/lib/want-to-buy/routes"
import { getStoredCity, isCityFilterActive } from "@/lib/city-selection"

const SORT_OPTIONS = [
  { value: "newest", label: "Сначала новые" },
  { value: "offers", label: "Много откликов" },
  { value: "no_offers", label: "Без откликов" },
  { value: "price", label: "Большой бюджет" },
  { value: "expires", label: "Скоро истекают" },
] as const

const CONDITION_OPTIONS = [
  { value: "all", label: "Любое состояние" },
  { value: "NEW", label: "Новый" },
  { value: "USED", label: "Б/у" },
  { value: "ANY", label: "Не важно" },
] as const

type WantToBuyFiltersProps = {
  categories: WantToBuyCategoryOption[]
  basePath?: string
  /** На странице категории — фильтр раздела не нужен */
  hideCategory?: boolean
}

export function WantToBuyFilters({
  categories,
  basePath = getWantToBuySearchPath(),
  hideCategory = false,
}: WantToBuyFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [queryInput, setQueryInput] = useState(() => searchParams.get("q") ?? "")
  const [priceInput, setPriceInput] = useState(() => searchParams.get("priceMax") ?? "")

  const sortedCategories = useMemo(
    () => sortWantToBuyCategories(categories),
    [categories],
  )

  useEffect(() => {
    setQueryInput(searchParams.get("q") ?? "")
    setPriceInput(searchParams.get("priceMax") ?? "")
  }, [searchParams])

  const pushParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString())
      mutate(params)
      params.delete("cursor")
      startTransition(() => {
        const q = params.toString()
        router.push(q ? `${basePath}?${q}` : basePath)
      })
    },
    [router, searchParams, basePath, startTransition],
  )

  const update = useCallback(
    (key: string, value: string) => {
      pushParams((params) => {
        if (!value || value === "all") params.delete(key)
        else params.set(key, value)
      })
    },
    [pushParams],
  )

  function applyQuery() {
    update("q", queryInput.trim())
  }

  function applyPriceMax() {
    update("priceMax", priceInput.trim())
  }

  function resetFilters() {
    startTransition(() => {
      router.push(basePath)
    })
    setQueryInput("")
    setPriceInput("")
  }

  function applyMyCity() {
    const stored = getStoredCity()
    if (isCityFilterActive(stored)) update("city", stored)
  }

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string }[] = []
    const q = searchParams.get("q")?.trim()
    if (q) chips.push({ key: "q", label: `«${q}»` })

    const city = searchParams.get("city")?.trim()
    if (city) chips.push({ key: "city", label: city })

    const cat = searchParams.get("category")?.trim()
    if (cat && cat !== "all") {
      const row = categories.find((c) => c.slug === cat)
      chips.push({
        key: "category",
        label: row ? getWantToBuyCategoryTitle(row.slug, row.nameRu) : cat,
      })
    }

    const priceMax = searchParams.get("priceMax")?.trim()
    if (priceMax) chips.push({ key: "priceMax", label: `до ${Number(priceMax).toLocaleString("ru-RU")} ₽` })

    const condition = searchParams.get("condition")
    if (condition && condition !== "all") {
      const label = CONDITION_OPTIONS.find((o) => o.value === condition)?.label ?? condition
      chips.push({ key: "condition", label })
    }

    const sort = searchParams.get("sort")
    if (sort && sort !== "newest") {
      const label = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? sort
      chips.push({ key: "sort", label })
    }

    return chips
  }, [searchParams, categories])

  const cityValue = searchParams.get("city") ?? ""

  return (
    <div className={`space-y-3 ${pending ? "opacity-70" : ""}`}>
      <div className="rounded-[18px] border border-[rgba(15,23,42,0.06)] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyQuery()
              }}
              placeholder="Что ищут покупатели? iPhone, диван, авто…"
              className="pl-9"
              aria-label="Поиск по заявкам"
            />
          </div>
          <Button
            type="button"
            onClick={applyQuery}
            className="shrink-0 bg-[#FF5A00] hover:bg-[#E8470F]"
          >
            Найти
          </Button>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <WantToBuyCityField
            label=""
            allowAnywhere
            value={cityValue}
            onChange={(city) => update("city", city)}
            id="wtb-filter-city"
          />

          {!hideCategory ? (
            <Select
              value={searchParams.get("category") ?? "all"}
              onValueChange={(v) => update("category", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Категория" />
              </SelectTrigger>
              <SelectContent className="max-h-[min(320px,70vh)]">
                <SelectItem value="all">Все категории</SelectItem>
                {sortedCategories.map((c) => (
                  <SelectItem key={c.slug} value={c.slug}>
                    {getWantToBuyCategoryTitle(c.slug, c.nameRu)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          <Input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Бюджет до, ₽"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyPriceMax()
            }}
            onBlur={applyPriceMax}
          />

          <Select
            value={searchParams.get("condition") ?? "all"}
            onValueChange={(v) => update("condition", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Состояние" />
            </SelectTrigger>
            <SelectContent>
              {CONDITION_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Select
            value={searchParams.get("sort") ?? "newest"}
            onValueChange={(v) => update("sort", v)}
          >
            <SelectTrigger className="h-9 w-[min(100%,220px)] text-sm">
              <SelectValue placeholder="Сортировка" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button type="button" variant="outline" size="sm" onClick={applyMyCity}>
            Мой город
          </Button>

          {activeChips.length > 0 ? (
            <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
              Сбросить всё
            </Button>
          ) : null}
        </div>
      </div>

      {activeChips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => update(chip.key, "")}
              className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 transition hover:border-[#FF5A00]/40 hover:text-[#FF5A00]"
            >
              {chip.label}
              <X className="h-3 w-3 opacity-60" aria-hidden />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
