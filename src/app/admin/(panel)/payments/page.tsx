"use client"

import { useEffect, useState } from "react"

type Payment = {
  id: string
  orderId: string
  serviceType: string
  amount: number
  status: string
  createdAt: string
  paidAt: string | null
  user: { id: string; name: string | null; phone: string | null }
  listing: { id: string; title: string } | null
}

const STATUS_LABEL: Record<string, string> = {
  pending:   "Ожидает",
  paid:      "Оплачен",
  failed:    "Ошибка",
  cancelled: "Отменён",
  refunded:  "Возврат",
}
const STATUS_COLOR: Record<string, string> = {
  pending:   "bg-amber-50 text-amber-700",
  paid:      "bg-emerald-50 text-emerald-700",
  failed:    "bg-red-50 text-red-600",
  cancelled: "bg-zinc-100 text-zinc-500",
  refunded:  "bg-blue-50 text-blue-700",
}

export default function AdminPaymentsPage() {
  const [items,   setItems]   = useState<Payment[]>([])
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [status,  setStatus]  = useState("")

  const totalPaid = items
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0)

  async function load(st = status) {
    setLoading(true)
    const res = await fetch(`/api/admin/payments${st ? `?status=${st}` : ""}`)
    if (res.ok) {
      const d = await res.json()
      setItems(d.items ?? [])
      setTotal(d.total ?? 0)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950">Платежи</h1>
          <p className="mt-2 text-zinc-500">
            Всего: {total} · Оплачено на странице:{" "}
            <span className="font-semibold text-emerald-600">
              {(totalPaid / 100).toLocaleString("ru-RU")} ₽
            </span>
          </p>
        </div>
      </div>

      {/* Фильтр статуса */}
      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {["", "pending", "paid", "failed", "cancelled"].map((st) => (
          <button
            key={st}
            onClick={() => { setStatus(st); load(st) }}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              status === st ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {st === "" ? "Все" : (STATUS_LABEL[st] ?? st)}
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-sm text-zinc-400">Загрузка…</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-400">Платежей не найдено</div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {items.map((p) => (
              <div key={p.id} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
                <div className="min-w-0">
                  <p className="font-semibold text-zinc-950">
                    {p.serviceType}
                    {p.listing && <span className="ml-2 text-sm font-normal text-zinc-400">· {p.listing.title}</span>}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {p.user.name ?? p.user.phone ?? p.user.id} · {p.orderId}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {new Date(p.createdAt).toLocaleString("ru-RU")}
                    {p.paidAt && ` · оплачен ${new Date(p.paidAt).toLocaleString("ru-RU")}`}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLOR[p.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                  {STATUS_LABEL[p.status] ?? p.status}
                </span>
                <span className="text-right text-base font-bold text-zinc-950">
                  {(p.amount / 100).toLocaleString("ru-RU")} ₽
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
