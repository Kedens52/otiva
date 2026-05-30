"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type SavedSearch = {
  id: string
  query: string
  category: string | null
  city: string | null
  priceMin: number | null
  priceMax: number | null
  createdAt: string
}

function buildSearchUrl(s: SavedSearch): string {
  const params = new URLSearchParams()
  if (s.query)    params.set("q", s.query)
  if (s.category) params.set("cat", s.category)
  if (s.city)     params.set("city", s.city)
  if (s.priceMin) params.set("priceMin", String(s.priceMin))
  if (s.priceMax) params.set("priceMax", String(s.priceMax))
  return "/search?" + params.toString()
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })
}

export default function SearchesPage() {
  const [searches, setSearches] = useState<SavedSearch[]>([])
  const [loading, setLoading]   = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/profile/searches")
      if (res.ok) {
        const d = await res.json()
        setSearches(d.searches ?? [])
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function deleteSearch(id: string) {
    setDeleting(id)
    try {
      await fetch(`/api/profile/searches/${id}`, { method: "DELETE" })
      setSearches(prev => prev.filter(s => s.id !== id))
    } catch {}
    setDeleting(null)
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1,2,3].map(i => <div key={i} className="h-16 rounded-2xl bg-white animate-pulse shadow-sm" />)}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h1 className="text-xl font-bold text-zinc-950">Сохранённые поиски</h1>
        <p className="mt-1 text-sm text-zinc-500">Быстрый доступ к вашим поисковым запросам</p>
      </div>

      {searches.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 shadow-sm text-center">
          <p className="text-2xl mb-3">🔍</p>
          <p className="text-base font-semibold text-zinc-950">Нет сохранённых поисков</p>
          <p className="mt-1 text-sm text-zinc-500">Используйте поиск и сохраняйте запросы для быстрого доступа</p>
          <Link href="/search"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white">
            Перейти к поиску
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl bg-white shadow-sm divide-y divide-zinc-100">
          {searches.map(s => (
            <div key={s.id} className="flex flex-col gap-3 px-4 py-4 hover:bg-zinc-50 transition min-[520px]:flex-row min-[520px]:items-center min-[520px]:px-5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <Link href={buildSearchUrl(s)} className="text-sm font-semibold text-zinc-950 hover:text-orange-600 transition truncate block">
                  {s.query || "Все объявления"}
                </Link>
                <div className="flex flex-wrap gap-2 mt-0.5">
                  {s.category && <span className="text-[11px] text-zinc-400">{s.category}</span>}
                  {s.city     && <span className="text-[11px] text-zinc-400">· {s.city}</span>}
                  {(s.priceMin || s.priceMax) && (
                    <span className="text-[11px] text-zinc-400">
                      · {s.priceMin ? s.priceMin.toLocaleString("ru-RU") + " ₽" : "от 0 ₽"} — {s.priceMax ? s.priceMax.toLocaleString("ru-RU") + " ₽" : "без ограничений"}
                    </span>
                  )}
                  <span className="text-[11px] text-zinc-400">· сохранён {formatDate(s.createdAt)}</span>
                </div>
              </div>
              <div className="grid grid-cols-[1fr_auto] items-center gap-2 min-[520px]:flex min-[520px]:shrink-0">
                <Link href={buildSearchUrl(s)}
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-center text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition min-[520px]:py-1.5">
                  Открыть
                </Link>
                <button
                  onClick={() => deleteSearch(s.id)}
                  disabled={deleting === s.id}
                  className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-400 hover:border-red-200 hover:text-red-500 transition disabled:opacity-50">
                  {deleting === s.id ? "..." : "✕"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
