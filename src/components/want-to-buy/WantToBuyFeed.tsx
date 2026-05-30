"use client"

import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WantToBuyCard, WantToBuyCardSkeleton } from "@/components/want-to-buy/WantToBuyCard"
import { WantToBuyEmptyState } from "@/components/want-to-buy/WantToBuyEmptyState"
import { WantToBuyFilters } from "@/components/want-to-buy/WantToBuyFilters"
import type { WantToBuyCardItem, WantToBuyCategoryOption } from "@/lib/want-to-buy/client-types"
import { getWantToBuyCreatePath } from "@/lib/want-to-buy/routes"

type WantToBuyFeedProps = {
  categories: WantToBuyCategoryOption[]
}

export function WantToBuyFeed({ categories }: WantToBuyFeedProps) {
  const searchParams = useSearchParams()
  const [items, setItems] = useState<WantToBuyCardItem[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const queryKey = searchParams.toString()

  const fetchPage = useCallback(
    async (append: boolean, pageCursor?: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (pageCursor) params.set("cursor", pageCursor)
      else params.delete("cursor")

      const res = await fetch(`/api/want-to-buy?${params.toString()}`)
      const data = (await res.json()) as {
        items?: WantToBuyCardItem[]
        nextCursor?: string | null
        error?: string
      }
      if (!res.ok) {
        throw new Error(data.error ?? "Ошибка загрузки")
      }
      return data
    },
    [searchParams],
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#000000] sm:text-4xl">Куплю</h1>
          <p className="mt-2 max-w-2xl text-base text-[#4B4B4B]">
            Заявки покупателей — предложите свой товар, если нашли подходящий запрос.
          </p>
        </div>
        <Button asChild size="lg" className="shrink-0">
          <Link href={getWantToBuyCreatePath()}>
            <Plus className="mr-2 h-4 w-4" />
            Разместить заявку
          </Link>
        </Button>
      </div>

      <WantToBuyFilters categories={categories} />

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <WantToBuyCardSkeleton key={i} layout="grid" />
          ))}
        </div>
      ) : error ? (
        <p className="text-center text-sm text-red-600">{error}</p>
      ) : items.length === 0 ? (
        <WantToBuyEmptyState />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <WantToBuyCard key={item.id} item={item} />
            ))}
          </div>
          {nextCursor ? (
            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={() => void loadMore()} disabled={loadingMore}>
                {loadingMore ? "Загрузка…" : "Показать ещё"}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
