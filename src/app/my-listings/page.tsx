"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase"

type Listing = {
  id: string; title: string; price: number; category: string
  city: string; status: string; created_at: string
}

const STATUS_LABEL: Record<string, string> = {
  active: "Активно", inactive: "Снято", moderation: "На проверке",
}
const STATUS_COLOR: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  inactive: "bg-zinc-100 text-zinc-500",
  moderation: "bg-amber-50 text-amber-700",
}
const CATEGORY_LABEL: Record<string, string> = {
  cars: "Транспорт", "real-estate": "Недвижимость", electronics: "Электроника",
  home: "Дом и интерьер", fashion: "Одежда", kids: "Детям",
  sport: "Спорт", services: "Услуги", other: "Другое",
}

function loadLocal(): Listing[] {
  try { return JSON.parse(localStorage.getItem("nashlo-listings") || "[]") } catch { return [] }
}
function saveLocal(listings: Listing[]) {
  localStorage.setItem("nashlo-listings", JSON.stringify(listings))
}

export default function MyListingsPage() {
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [useLocal, setUseLocal] = useState(false)

  useEffect(() => {
    async function load() {
      if (isSupabaseConfigured()) {
        const supabase = getSupabase()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push("/login?from=/my-listings"); return }
        const { data } = await supabase
          .from("listings")
          .select("id,title,price,category,city,status,created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
        setListings(data || [])
      } else {
        // localStorage fallback
        const demoUser = localStorage.getItem("nashlo-demo-user")
        if (!demoUser) { router.push("/login?from=/my-listings"); return }
        setUseLocal(true)
        setListings(loadLocal())
      }
      setLoading(false)
    }
    load()
  }, [router])

  async function deactivate(id: string) {
    if (useLocal) {
      const updated = listings.map((l) => l.id === id ? { ...l, status: "inactive" } : l)
      setListings(updated); saveLocal(updated); return
    }
    const supabase = getSupabase()
    await supabase.from("listings").update({ status: "inactive" }).eq("id", id)
    setListings((prev) => prev.map((l) => l.id === id ? { ...l, status: "inactive" } : l))
  }

  async function activate(id: string) {
    if (useLocal) {
      const updated = listings.map((l) => l.id === id ? { ...l, status: "active" } : l)
      setListings(updated); saveLocal(updated); return
    }
    const supabase = getSupabase()
    await supabase.from("listings").update({ status: "active" }).eq("id", id)
    setListings((prev) => prev.map((l) => l.id === id ? { ...l, status: "active" } : l))
  }

  async function remove(id: string) {
    if (!confirm("Удалить объявление?")) return
    if (useLocal) {
      const updated = listings.filter((l) => l.id !== id)
      setListings(updated); saveLocal(updated); return
    }
    const supabase = getSupabase()
    await supabase.from("listings").delete().eq("id", id)
    setListings((prev) => prev.filter((l) => l.id !== id))
  }

  if (loading) return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="space-y-3">
        {[1,2,3].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-zinc-100" />)}
      </div>
    </main>
  )

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 pb-28 lg:pb-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Мои объявления</h1>
          <p className="mt-1 text-sm text-zinc-500">{listings.length} объявлений</p>
        </div>
        <Link
          href="/create"
          className="rounded-2xl bg-[hsl(var(--nashlo-orange))] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          + Разместить
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="mt-20 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-zinc-100 text-4xl">📋</div>
          <p className="mt-5 text-xl font-semibold text-zinc-950">Объявлений пока нет</p>
          <p className="mt-2 text-sm text-zinc-500">Разместите первое — это бесплатно</p>
          <Link href="/create" className="mt-6 inline-flex rounded-2xl bg-zinc-950 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800">
            Разместить объявление
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {listings.map((listing) => (
            <div key={listing.id} className="flex items-center gap-4 rounded-[20px] border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-2xl">
                📋
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-semibold text-zinc-950">{listing.title}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[listing.status] || "bg-zinc-100 text-zinc-500"}`}>
                    {STATUS_LABEL[listing.status] || listing.status}
                  </span>
                </div>
                <p className="mt-0.5 text-sm font-semibold text-zinc-950">
                  {listing.price === 0 ? "Бесплатно" : listing.price.toLocaleString("ru-RU") + " ₽"}
                </p>
                <p className="text-xs text-zinc-400">
                  {CATEGORY_LABEL[listing.category] || listing.category} · {listing.city} · {new Date(listing.created_at).toLocaleDateString("ru-RU")}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-1.5">
                <Link
                  href={`/listings/${listing.id}`}
                  className="rounded-xl border border-zinc-200 px-3 py-1.5 text-center text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Просмотр
                </Link>
                {listing.status === "active" ? (
                  <button
                    onClick={() => deactivate(listing.id)}
                    className="rounded-xl bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-200"
                  >
                    Снять
                  </button>
                ) : (
                  <button
                    onClick={() => activate(listing.id)}
                    className="rounded-xl bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800"
                  >
                    Активировать
                  </button>
                )}
                <button
                  onClick={() => remove(listing.id)}
                  className="rounded-xl px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50"
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
