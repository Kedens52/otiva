"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getSupabase } from "@/lib/supabase"

type Listing = { id: string; title: string; price: number; city: string; category: string }

export default function FavoritesPage() {
  const router = useRouter()
  const [items, setItems] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login?from=/favorites"); return }
      const { data } = await supabase
        .from("favorites")
        .select("listing_id, listings(id,title,price,city,category)")
        .eq("user_id", user.id)
      const listings = (data || []).map((row: any) => row.listings).filter(Boolean)
      setItems(listings)
      setLoading(false)
    }
    load()
  }, [router])

  async function remove(listingId: string) {
    const supabase = getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from("favorites").delete().eq("user_id", user.id).eq("listing_id", listingId)
    setItems((prev) => prev.filter((i) => i.id !== listingId))
  }

  if (loading) return <main className="mx-auto max-w-3xl px-4 py-10"><div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-zinc-100" />)}</div></main>

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 pb-28 lg:pb-10">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Избранное</h1>
      <p className="mt-1 text-sm text-zinc-500">{items.length} объявлений</p>

      {items.length === 0 ? (
        <div className="mt-20 text-center">
          <p className="text-4xl">♡</p>
          <p className="mt-4 text-lg font-semibold text-zinc-950">Избранное пусто</p>
          <p className="mt-2 text-sm text-zinc-500">Сохраняйте понравившиеся объявления</p>
          <Link href="/" className="mt-6 inline-block rounded-2xl bg-zinc-950 px-6 py-3 text-sm font-semibold text-white">
            Смотреть объявления
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.id} className="relative rounded-[20px] border border-zinc-200 bg-white p-4 shadow-sm">
              <button onClick={() => remove(item.id)}
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-xs text-zinc-500 hover:bg-red-50 hover:text-red-500">
                ✕
              </button>
              <Link href={`/listings/${item.id}`}>
                <p className="pr-8 font-semibold text-zinc-950 hover:text-zinc-700">{item.title}</p>
                <p className="mt-1 text-sm font-semibold text-[hsl(var(--nashlo-orange))]">{item.price.toLocaleString("ru-RU")} ₽</p>
                <p className="mt-0.5 text-xs text-zinc-400">{item.city}</p>
              </Link>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
