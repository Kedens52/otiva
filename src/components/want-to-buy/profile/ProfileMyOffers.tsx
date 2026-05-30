"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CabinetPage } from "@/components/profile/CabinetPage"
import { EmptyState } from "@/components/profile/EmptyState"
import { Button } from "@/components/ui/button"
import { OfferStatusBadge } from "@/components/want-to-buy/OfferStatusBadge"
import { formatPrice } from "@/lib/listing-types"
import { getWantToBuyCreatePath, getWantToBuyHubPath } from "@/lib/want-to-buy/routes"

type MyOfferItem = {
  id: string
  status: string
  price: number
  message: string
  createdAt: string
  listingId: string | null
  listingPath: string | null
  wantToBuy: {
    id: string
    title: string
    status: string
    city: string | null
    priceMax: number | null
  }
}

export function ProfileMyOffers() {
  const [items, setItems] = useState<MyOfferItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/want-to-buy/my-offers")
      .then((r) => r.json())
      .then((d: { items?: MyOfferItem[] }) => {
        setItems(d.items ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <CabinetPage
      title="Мои отклики"
      subtitle="Предложения, которые вы отправили продавцами по заявкам покупателей"
      action={
        <Button variant="outline" size="sm" asChild>
          <Link href={getWantToBuyHubPath()}>Лента заявок</Link>
        </Button>
      }
    >
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-zinc-100" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon="📦"
          title="Вы ещё не откликались"
          description="Найдите заявку в ленте и предложите свой товар."
          actionLabel="Куплю"
          actionHref={getWantToBuyHubPath()}
        />
      ) : (
        <ul className="space-y-3">
          {items.map((offer) => (
            <li
              key={offer.id}
              className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    href={offer.wantToBuy.path ?? `/want-to-buy`}
                    className="font-semibold text-zinc-950 hover:text-[hsl(var(--nashlo-orange))]"
                  >
                    {offer.wantToBuy.title}
                  </Link>
                  <p className="mt-1 text-sm text-zinc-500 line-clamp-2">{offer.message}</p>
                </div>
                <OfferStatusBadge status={offer.status} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                <span className="font-bold text-zinc-950">{formatPrice(offer.price)}</span>
                {offer.listingPath ? (
                  <Link
                    href={offer.listingPath}
                    className="text-[hsl(var(--nashlo-orange))] hover:underline"
                  >
                    Ваше объявление
                  </Link>
                ) : null}
                <span className="text-zinc-400">
                  {new Date(offer.createdAt).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
              <div className="mt-3">
                <Button variant="outline" size="sm" asChild>
                  <Link href={offer.wantToBuy.path ?? getWantToBuyHubPath()}>К заявке</Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </CabinetPage>
  )
}
