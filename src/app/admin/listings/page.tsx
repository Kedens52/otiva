"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { formatPrice } from "@/lib/listing-types"

type ListingItem = {
  id: string
  title: string
  price: number
  city: string | null
  status: string
  createdAt: string
  category: { slug: string; nameRu: string }
  seller: { id: string; name: string | null; phone: string }
}

const STATUS_LABEL: Record<string, string> = {
  MODERATION: "На проверке",
  ACTIVE:     "Активно",
  REJECTED:   "Отклонено",
  ARCHIVED:   "Архив",
  SOLD:       "Продано",
}

const STATUS_COLOR: Record<string, string> = {
  MODERATION: "bg-amber-50 text-amber-700",
  ACTIVE:     "bg-emerald-50 text-emerald-700",
  REJECTED:   "bg-red-50 text-red-600",
  ARCHIVED:   "bg-zinc-100 text-zinc-500",
  SOLD:       "bg-blue-50 text-blue-600",
}

export default function AdminListingsPage() {
  const [items, setItems]       = useState<ListingItem[]>([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [status, setStatus]     = useState("MODERATION")
  const [approving, setApproving] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/listings?status=${status}`)
        if (res.ok) {
          const data = await res.json()
          setItems(data.items ?? [])
          setTotal(data.total ?? 0)
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [status])

  async function moderate(listingId: string, action: "APPROVED" | "REJECTED") {
    const res = await fetch("/api/admin/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, action }),
    })
    if (res.ok) setItems((prev) => prev.filter((l) => l.id !== listingId))
  }

  async function approveAll() {
    if (!items.length) return
    setApproving(true)
    for (const item of items) {
      await fetch("/api/admin/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: item.id, action: "APPROVED" }),
      })
    }
    setItems([])
    setTotal(0)
    setApproving(false)
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950">Объявления</h1>
          <p className="mt-2 text-zinc-500">Управление объявлениями. Всего: {total}</p>
        </div>
        <div className="flex items-center gap-3">
          {status === "MODERATION" && items.length > 1 && (
            <button
              onClick={approveAll}
              disabled={approving}
              className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
            >
              {approving ? "Одобряем..." : `Одобрить все (${items.length})`}
            </button>
          )}
          <Link href="/admin/moderation" className="rounded-2xl bg-[hsl(var(--nashlo-orange))] px-5 py-3 text-sm font-semibold text-white shadow-sm">
            Панель модерации
          </Link>
        </div>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {Object.entries(STATUS_LABEL).map(([key, label]) => (
          <button key={key} onClick={() => setStatus(key)}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${status === key ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
            {label}
            {status === key && !loading && (
              <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${status === key ? "bg-white/20" : "bg-zinc-200"}`}>
                {items.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-sm text-zinc-400">Загрузка…</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-400">Нет объявлений со статусом «{STATUS_LABEL[status]}»</div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {items.map((item) => (
              <div key={item.id} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_auto_auto_auto] md:items-center">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-zinc-950">{item.title}</p>
                  <p className="text-sm text-zinc-500">{item.city ?? "—"} · {item.category.nameRu} · {item.seller.name ?? item.seller.phone}</p>
                  <p className="text-sm font-medium text-zinc-700">{formatPrice(item.price)}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLOR[item.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                  {STATUS_LABEL[item.status] ?? item.status}
                </span>
                <Link href={`/listings/${item.id}`} target="_blank"
                  className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
                  Открыть &#8599;
                </Link>
                {status === "MODERATION" && (
                  <div className="flex gap-2">
                    <button onClick={() => moderate(item.id, "APPROVED")}
                      className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800">
                      Одобрить
                    </button>
                    <button onClick={() => moderate(item.id, "REJECTED")}
                      className="rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100">
                      Отклонить
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
