"use client"

import { useEffect, useState } from "react"
import type { PaymentStatus } from "@prisma/client"
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader"
import { AdminPageShell } from "@/components/admin/layout/AdminPageShell"
import { AdminStatusBadge } from "@/components/admin/ui/AdminStatusBadge"

type Payment = {
  id: string
  orderId: string
  serviceType: string
  amount: number
  status: PaymentStatus
  createdAt: string
  paidAt: string | null
  canceledAt: string | null
  refundedAt: string | null
  user: { id: string; name: string | null; phone: string | null }
  listing: { id: string; title: string } | null
}

const FILTER_STATUSES: Array<{ value: string; label: string }> = [
  { value: "", label: "Все" },
  { value: "PENDING", label: "Ожидает" },
  { value: "SUCCEEDED", label: "Оплачен" },
  { value: "FAILED", label: "Ошибка" },
  { value: "CANCELED", label: "Отменён" },
  { value: "REFUNDED", label: "Возврат" },
  { value: "PARTIAL_REFUNDED", label: "Частичный возврат" },
]

export default function AdminPaymentsPage() {
  const [items, setItems] = useState<Payment[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState("")

  const totalPaid = items
    .filter((p) => p.status === "SUCCEEDED")
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

  useEffect(() => {
    load()
  }, [])

  return (
    <AdminPageShell className="py-8">
      <AdminPageHeader
        title="Платежи"
        description={
          <>
            Всего: {total} · Оплачено на странице:{" "}
            <span className="font-semibold text-emerald-600">
              {(totalPaid / 100).toLocaleString("ru-RU")} ₽
            </span>
          </>
        }
      />

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {FILTER_STATUSES.map((st) => (
          <button
            key={st.value}
            type="button"
            onClick={() => {
              setStatus(st.value)
              load(st.value)
            }}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              status === st.value ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-sm text-zinc-400">Загрузка…</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-400">Платежей не найдено</div>
        ) : (
          <>
          <div className="divide-y divide-zinc-100 lg:hidden">
            {items.map((p) => (
              <article key={p.id} className="space-y-2 px-4 py-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-zinc-950">{p.serviceType}</p>
                  <span className="shrink-0 text-base font-bold text-zinc-950">
                    {(p.amount / 100).toLocaleString("ru-RU")} ₽
                  </span>
                </div>
                {p.listing && <p className="text-sm text-zinc-500">{p.listing.title}</p>}
                <p className="text-sm text-zinc-500">{p.user.name ?? p.user.phone ?? p.user.id}</p>
                <p className="font-mono text-xs text-zinc-400">{p.orderId}</p>
                <p className="text-xs text-zinc-400">
                  {new Date(p.createdAt).toLocaleString("ru-RU")}
                  {p.paidAt && ` · оплачен ${new Date(p.paidAt).toLocaleString("ru-RU")}`}
                </p>
                <AdminStatusBadge variant="payment" status={p.status} />
              </article>
            ))}
          </div>

          <div className="hidden divide-y divide-zinc-100 lg:block">
            {items.map((p) => (
              <div
                key={p.id}
                className="grid gap-3 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-zinc-950">
                    {p.serviceType}
                    {p.listing && (
                      <span className="ml-2 text-sm font-normal text-zinc-400">· {p.listing.title}</span>
                    )}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {p.user.name ?? p.user.phone ?? p.user.id} · {p.orderId}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {new Date(p.createdAt).toLocaleString("ru-RU")}
                    {p.paidAt && ` · оплачен ${new Date(p.paidAt).toLocaleString("ru-RU")}`}
                    {p.refundedAt && ` · возврат ${new Date(p.refundedAt).toLocaleString("ru-RU")}`}
                  </p>
                </div>
                <AdminStatusBadge variant="payment" status={p.status} />
                <span className="text-right text-base font-bold text-zinc-950">
                  {(p.amount / 100).toLocaleString("ru-RU")} ₽
                </span>
              </div>
            ))}
          </div>
          </>
        )}
      </div>
    </AdminPageShell>
  )
}
