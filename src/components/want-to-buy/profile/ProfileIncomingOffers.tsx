"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CabinetPage } from "@/components/profile/CabinetPage"
import { EmptyState } from "@/components/profile/EmptyState"
import { Button } from "@/components/ui/button"
import { OfferCard, type OfferCardData } from "@/components/want-to-buy/OfferCard"
import { WantToBuyOfferSortBar } from "@/components/want-to-buy/WantToBuyOfferSortBar"
import { parseWantToBuyOfferSort, type WantToBuyOfferSortKey } from "@/lib/want-to-buy/offer-sort"

type IncomingOffer = OfferCardData & {
  wantToBuy: { id: string; title: string; path: string }
}

export function ProfileIncomingOffers() {
  const router = useRouter()
  const [items, setItems] = useState<IncomingOffer[]>([])
  const [sort, setSort] = useState<WantToBuyOfferSortKey>("price_desc")
  const [loading, setLoading] = useState(true)
  const [pendingOfferId, setPendingOfferId] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    void fetch(`/api/want-to-buy/incoming-offers?sort=${sort}`)
      .then(async (res) => {
        if (res.status === 401) {
          router.replace("/login?return=/profile/want-to-buy/offers")
          return null
        }
        return res.json()
      })
      .then((data) => {
        if (data?.items) {
          setItems(data.items)
          setSort(parseWantToBuyOfferSort(data.sort ?? sort))
        }
      })
      .finally(() => setLoading(false))
  }, [router, sort])

  async function patchOffer(offerId: string, wantToBuyId: string, action: "accept" | "decline") {
    setPendingOfferId(offerId)
    const res = await fetch(`/api/want-to-buy/${wantToBuyId}/offers/${offerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    })
    setPendingOfferId(null)
    if (res.ok) {
      setItems((prev) =>
        prev.map((o) =>
          o.id === offerId
            ? { ...o, status: action === "accept" ? "ACCEPTED" : "DECLINED" }
            : o,
        ),
      )
    }
  }

  const pricesByRequest = new Map<string, number>()
  for (const offer of items) {
    const prev = pricesByRequest.get(offer.wantToBuy.id)
    if (prev == null || offer.price > prev) pricesByRequest.set(offer.wantToBuy.id, offer.price)
  }

  return (
    <CabinetPage
      title="Отклики продавцов"
      subtitle="Все предложения по вашим заявкам «Куплю»"
      action={
        <Button variant="outline" size="sm" asChild>
          <Link href="/profile/want-to-buy">Мои заявки</Link>
        </Button>
      }
    >
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-zinc-100" />
          ))}
        </div>
      ) : !items.length ? (
        <EmptyState
          icon="📬"
          title="Пока нет откликов"
          description="Когда продавцы предложат товар по вашим заявкам, отклики появятся здесь."
          actionLabel="Мои заявки"
          actionHref="/profile/want-to-buy"
        />
      ) : (
        <>
          <WantToBuyOfferSortBar value={sort} onChange={setSort} className="mb-5" />
          <ul className="space-y-4">
            {items.map((offer) => {
              const isTopPrice =
                sort === "price_desc" && offer.price === pricesByRequest.get(offer.wantToBuy.id)

              return (
                <li key={offer.id} className="space-y-2">
                  <p className="text-xs font-medium text-zinc-500">
                    По заявке:{" "}
                    <Link
                      href={offer.wantToBuy.path}
                      className="text-[hsl(var(--nashlo-orange))] hover:underline"
                    >
                      {offer.wantToBuy.title}
                    </Link>
                  </p>
                  <OfferCard offer={offer} highlight={isTopPrice ? "top_price" : null} />
                  {(offer.status === "PENDING" || offer.status === "VIEWED") && (
                    <div className="flex flex-wrap gap-2 px-1">
                      <Button
                        size="sm"
                        disabled={pendingOfferId === offer.id}
                        onClick={() => void patchOffer(offer.id, offer.wantToBuy.id, "accept")}
                      >
                        Принять
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pendingOfferId === offer.id}
                        onClick={() => void patchOffer(offer.id, offer.wantToBuy.id, "decline")}
                      >
                        Отклонить
                      </Button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      )}
    </CabinetPage>
  )
}
