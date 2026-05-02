"use client"

import { useEffect, useState } from "react"
import { ListingCard } from "@/components/marketplace/ListingCard"
import type { AppListing } from "@/lib/listing-types"

type Seller = {
  id: string; name: string | null; avatar: string | null
  city: string | null; isVerified: boolean; rating: number
  reviewCount: number; createdAt: string; listings: AppListing[]
}

export default function SellerPage({ params }: { params: { name: string } }) {
  const [seller, setSeller] = useState<Seller | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/profile/${params.name}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { setSeller(data?.seller ?? null); setLoading(false) })
      .catch(() => setLoading(false))
  }, [params.name])

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-20 text-center text-sm text-zinc-400">Загрузка…</div>
  if (!seller) return (
    <div className="mx-auto max-w-7xl px-4 py-20 text-center">
      <p className="text-xl font-semibold text-zinc-950">Продавец не найден</p>
    </div>
  )

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-950 text-2xl font-semibold text-white">
            {(seller.name ?? "П")[0]}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-zinc-950">{seller.name ?? "Продавец"}</h1>
            {seller.city && <p className="text-sm text-zinc-500">{seller.city}</p>}
            {seller.isVerified && <p className="mt-1 text-sm font-semibold text-emerald-600">✓ Проверенный</p>}
          </div>
        </div>
      </div>
      {seller.listings.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-zinc-950">Объявления</h2>
          <div className="mt-4 grid gap-4 grid-cols-2 sm:grid-cols-3">
            {seller.listings.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        </section>
      )}
    </main>
  )
}
