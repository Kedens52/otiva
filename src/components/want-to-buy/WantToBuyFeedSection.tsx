"use client"

import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  WantToBuyCard,
  WantToBuyCardSkeleton,
  type WantToBuyCardLayout,
} from "@/components/want-to-buy/WantToBuyCard"
import { WantToBuyEmptyState } from "@/components/want-to-buy/WantToBuyEmptyState"
import { WantToBuyFilters } from "@/components/want-to-buy/WantToBuyFilters"
import type { WantToBuyCardItem, WantToBuyCategoryOption } from "@/lib/want-to-buy/client-types"
import type { WantToBuyFeedSort } from "@/lib/want-to-buy/feed"
import { getWantToBuyHubPath, getWantToBuySearchPath } from "@/lib/want-to-buy/routes"
import { cn } from "@/lib/utils"

type WantToBuyFeedSectionProps = {
  categories: WantToBuyCategoryOption[]
  title?: string
  showFilters?: boolean
  fixedCategorySlug?: string
  fixedSort?: WantToBuyFeedSort
  pageSize?: number
  viewAllHref?: string
  basePath?: string
  emptyVariant?: "feed" | "category"
  /** Скрыть выбор категории в фильтрах (страница раздела) */
  hideCategoryFilter?: boolean
  /** Переопределить вид карточек (на главной — list с деталями по категории) */
  cardLayout?: WantToBuyCardLayout
  /** Компактные карточки для /kyplu */
  compact?: boolean
}

export function WantToBuyFeedSection({
  categories,
  title,
  showFilters = false,
  fixedCategorySlug,
  fixedSort,
  pageSize = 12,
  viewAllHref,
  basePath = getWantToBuySearchPath(),
  emptyVariant = "feed",
  hideCategoryFilter = false,
  cardLayout: cardLayoutProp,
  compact = true,
}: WantToBuyFeedSectionProps) {
  const searchParams = useSearchParams()
  const [items, setItems] = useState<WantToBuyCardItem[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const queryKey = `${basePath}?${searchParams.toString()}&cat=${fixedCategorySlug ?? ""}&sort=${fixedSort ?? ""}&limit=${pageSize}`
  const searchPath = getWantToBuySearchPath()
  const hubPath = getWantToBuyHubPath()
  const isSearch = basePath === searchPath
  const cardLayout = cardLayoutProp ?? (isSearch || compact ? "list" : "grid")

  const fetchPage = useCallback(
    async (append: boolean, pageCursor?: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (fixedCategorySlug) params.set("category", fixedCategorySlug)
      if (fixedSort) params.set("sort", fixedSort)
      params.set("limit", String(pageSize))
      if (pageCursor) params.set("cursor", pageCursor)
      else params.delete("cursor")

      const res = await fetch(`/api/want-to-buy?${params.toString()}`)
      const data = (await res.json()) as {
        items?: WantToBuyCardItem[]
        nextCursor?: string | null
        error?: string
      }
      if (!res.ok) throw new Error(data.error ?? "Ошибка загрузки")
      return data
    },
    [searchParams, fixedCategorySlug, fixedSort, pageSize],
  )

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    void fetchPage(false, null)
      .then((data) => {
        if (cancelled) return
        setItems(data.items ?? [])
        setNextCursor(data.nextCursor ?? null)
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [queryKey, fetchPage])

  async function loadMore() {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const data = await fetchPage(true, nextCursor)
      setItems((prev) => [...prev, ...(data.items ?? [])])
      setNextCursor(data.nextCursor ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка")
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <section className="space-y-3">
      {title ? (
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-[#111827] sm:text-[17px]">{title}</h2>
          <Link
            href={
              viewAllHref ?? (basePath === hubPath ? searchPath : `${basePath}`)
            }
            className="text-sm font-medium text-[#FF5A00] hover:underline"
          >
            Смотреть все
          </Link>
        </div>
      ) : null}

      {showFilters ? (
        <WantToBuyFilters
          categories={categories}
          basePath={basePath}
          hideCategory={hideCategoryFilter || Boolean(fixedCategorySlug)}
        />
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <p className="text-xs text-[#6B7280] sm:text-sm">
          {items.length === 1 ? "1 заявка" : `${items.length} заявок`}
          {nextCursor ? "+" : ""}
        </p>
      ) : null}

      {loading ? (
        <div
          className={cn(
            "grid",
            compact ? "gap-2" : "gap-3",
            cardLayout === "grid" ? "sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1",
          )}
        >
          {Array.from({ length: isSearch ? 5 : 6 }).map((_, i) => (
            <WantToBuyCardSkeleton key={i} layout={cardLayout} compact={compact} />
          ))}
        </div>
      ) : error ? (
        <p className="text-center text-sm text-red-600">{error}</p>
      ) : items.length === 0 ? (
        <WantToBuyEmptyState variant={emptyVariant} />
      ) : (
        <>
          <div
            className={cn(
              "grid",
              compact ? "gap-2" : "gap-3",
              cardLayout === "grid" ? "sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1",
            )}
          >
            {items.map((item) => (
              <WantToBuyCard key={item.id} item={item} layout={cardLayout} compact={compact} />
            ))}
          </div>
          {nextCursor ? (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-xl border border-zinc-200 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
              >
                {loadingMore ? "Загрузка…" : "Показать ещё"}
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}
