"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ListingCard } from "@/components/marketplace/ListingCard"
import type { AppListing } from "@/lib/listing-types"

export default function FavoritesPage() {
  const router = useRouter()
  const [items, setItems] = useState<AppListing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/favorites")
      .then((r) => {
        if (r.status === 401) { router.push("/login?from=/favorites"); return null }
        return r.json()
      })
      .then((data) => { if (data) setItems(data.favorites || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [router])

  async function remove(listingId: string) {
    await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    })
    setItems((prev) => prev.filter((i) => i.id !== listingId))
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 pb-28 lg:pb-10">
        <div className="mb-6 h-8 w-40 animate-pulse rounded-xl bg-zinc-100" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map((i) => <div key={i} className="h-52 animate-pulse rounded-[20px] bg-zinc-100" />)}
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 pb-28 lg:pb-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Избранное</h1>
          <p className="mt-1 text-sm text-zinc-500">{items.length} объявлений</p>
        </div>
        {items.length > 0 && (
          <Link href="/search"
            className="rounded-2xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition">
            Смотреть все →
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mt-20 text-center">
          <p className="text-5xl">♡</p>
          <p className="mt-4 text-xl font-semibold text-zinc-950">Избранное пусто</p>
          <p className="mt-2 text-sm text-zinc-500">Нажмите ♡ на объявлении — оно сохранится здесь</p>
          <Link href="/" className="mt-6 inline-block rounded-2xl bg-zinc-950 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition">
            Смотреть объявления
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="relative">
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm text-red-400 shadow-sm backdrop-blur hover:bg-red-50 hover:text-red-600 transition"
                title="Убрать из избранного"
              >
                ✕
              </button>
              <ListingCard listing={item} compact />
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
