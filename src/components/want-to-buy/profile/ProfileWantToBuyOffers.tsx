"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CabinetPage } from "@/components/profile/CabinetPage"
import { EmptyState } from "@/components/profile/EmptyState"
import { Button } from "@/components/ui/button"
import { OfferCard, type OfferCardData } from "@/components/want-to-buy/OfferCard"
import { WantToBuyOfferSortBar } from "@/components/want-to-buy/WantToBuyOfferSortBar"
import {
  getTopOfferPrice,
  parseWantToBuyOfferSort,
  type WantToBuyOfferSortKey,
} from "@/lib/want-to-buy/offer-sort"
import { formatPrice } from "@/lib/listing-types"

type OffersResponse = {
  wantToBuyId: string
  title: string
  sort?: string
  items: OfferCardData[]
}

export function ProfileWantToBuyOffers({ wantToBuyId }: { wantToBuyId: string }) {
  const router = useRouter()
  const [data, setData] = useState<OffersResponse | null>(null)
  const [sort, setSort] = useState<WantToBuyOfferSortKey>("price_desc")
  const [loading, setLoading] = useState(true)
  const [pendingOfferId, setPendingOfferId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (sortKey: WantToBuyOfferSortKey) => {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/want-to-buy/${wantToBuyId}/offers?sort=${sortKey}`)
      if (res.status === 401) {
        router.replace(`/login?return=${encodeURIComponent(`/profile/want-to-buy/${wantToBuyId}/offers`)}`)
        return
      }
      if (!res.ok) {
        setError("Не удалось загрузить отклики")
        setLoading(false)
        return
      }
      const json = (await res.json()) as OffersResponse
      setData(json)
      setSort(parseWantToBuyOfferSort(json.sort ?? sortKey))
      setLoading(false)
    },
    [wantToBuyId, router],
  )

  useEffect(() => {
    void load(sort)
  }, [load, sort])

  async function patchOffer(offerId: string, action: "accept" | "decline") {
    setPendingOfferId(offerId)
    setError(null)
    const res = await fetch(`/api/want-to-buy/${wantToBuyId}/offers/${offerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    })
    const json = (await res.json()) as { error?: string }
    if (!res.ok) {
      setError(json.error ?? "Не удалось обновить отклик")
      setPendingOfferId(null)
      return
    }
    await load(sort)
    setPendingOfferId(null)
  }

  const topPrice = data?.items.length ? getTopOfferPrice(data.items) : null
  const topOfferId =
    sort === "price_desc" && data?.items.length
      ? data.items.find((o) => o.price === topPrice)?.id
      : undefined

  return (
    <CabinetPage
      title="Отклики продавцов"
      subtitle={data?.title ?? "Загрузка…"}
      action={
        <Button variant="outline" size="sm" asChild>
          <Link href="/profile/want-to-buy">← Мои заявки</Link>
        </Button>
      }
    >
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-zinc-100" />
          ))}
        </div>
      ) : error && !data?.items.length ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : !data?.items.length ? (
        <EmptyState
          icon="💬"
          title="Пока нет откликов"
          description="Когда продавцы предложат товар, они появятся здесь."
          actionLabel="К заявке"
          actionHref={`/want-to-buy/${wantToBuyId}`}
        />
      ) : (
        <>
          <WantToBuyOfferSortBar value={sort} onChange={setSort} className="mb-5" />

          {topPrice != null && sort === "price_desc" ? (
            <p className="mb-4 rounded-xl border border-[hsl(var(--nashlo-orange)/0.2)] bg-[#FFFBF8] px-4 py-3 text-sm text-zinc-700">
              Самое высокое предложение:{" "}
              <span className="font-bold text-[hsl(var(--nashlo-orange))]">
                {formatPrice(topPrice)}
              </span>
              {data.items.length > 1 ? (
                <span className="text-zinc-500">
                  {" "}
                  · всего {data.items.length} откл.
                </span>
              ) : null}
            </p>
          ) : null}

          <ul className="space-y-4">
            {data.items.map((offer) => (
              <li key={offer.id} className="space-y-3">
                <OfferCard
                  offer={offer}
                  highlight={offer.id === topOfferId ? "top_price" : null}
                />
                {(offer.status === "PENDING" || offer.status === "VIEWED") && (
                  <div className="flex flex-wrap gap-2 px-1">
                    <Button
                      size="sm"
                      disabled={pendingOfferId === offer.id}
                      onClick={() => void patchOffer(offer.id, "accept")}
                    >
                      Принять
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pendingOfferId === offer.id}
                      onClick={() => void patchOffer(offer.id, "decline")}
                    >
                      Отклонить
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
      {error && data?.items.length ? (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      ) : null}
    </CabinetPage>
  )
}
