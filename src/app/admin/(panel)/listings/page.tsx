"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { formatPrice } from "@/lib/listing-types"
import { getAdminCsrfFromDocument } from "@/lib/admin/csrf-client"

type ListingItem = {
  id: string
  title: string
  price: number
  city: string | null
  status: string
  createdAt: string
  rejectionReason: string | null
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

async function adminPost(body: object): Promise<Response> {
  return fetch("/api/admin/listings", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": getAdminCsrfFromDocument() },
    body: JSON.stringify(body),
  })
}

// ── Rejection reason modal ────────────────────────────────────────────────────
function RejectModal({
  listingTitle,
  onConfirm,
  onCancel,
}: {
  listingTitle: string
  onConfirm: (reason: string) => void
  onCancel: () => void
}) {
  const [reason, setReason] = useState("")
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const QUICK = [
    "Запрещённый товар или услуга",
    "Спам или дублирующее объявление",
    "Некорректные фото или описание",
    "Неправильная категория",
    "Контактные данные в описании",
    "Недостоверная цена или информация",
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-zinc-950">Причина отклонения</h2>
        <p className="mt-1 text-sm text-zinc-500 truncate">«{listingTitle}»</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {QUICK.map((q) => (
            <button key={q} onClick={() => setReason(q)}
              className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${reason === q ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100"}`}>
              {q}
            </button>
          ))}
        </div>

        <textarea
          ref={inputRef}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Или напишите свою причину…"
          rows={3}
          maxLength={500}
          className="mt-4 w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-400"
        />
        <p className="mt-1 text-right text-xs text-zinc-400">{reason.length}/500</p>

        <div className="mt-4 flex gap-3">
          <button onClick={onCancel}
            className="flex-1 rounded-2xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 transition">
            Отмена
          </button>
          <button onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim()}
            className="flex-1 rounded-2xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 transition disabled:cursor-not-allowed disabled:opacity-50">
            Отклонить
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminListingsPage() {
  const [items, setItems]       = useState<ListingItem[]>([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [status, setStatus]     = useState("MODERATION")
  const [approving, setApproving] = useState(false)
  const [actionError, setActionError] = useState("")

  // Rejection modal state
  const [rejectTarget, setRejectTarget] = useState<ListingItem | null>(null)

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

  async function moderate(listingId: string, action: "APPROVED" | "REJECTED", reason?: string) {
    setActionError("")
    const res = await adminPost({ listingId, action, reason })
    if (res.ok) {
      setItems((prev) => prev.filter((l) => l.id !== listingId))
      setRejectTarget(null)
      return
    }
    const data = await res.json().catch(() => null)
    setActionError(data?.error ?? "Не удалось выполнить действие. Проверьте права и сессию администратора.")
  }

  async function approveAll() {
    if (!items.length) return
    setApproving(true)
    setActionError("")
    for (const item of items) {
      const res = await adminPost({ listingId: item.id, action: "APPROVED" })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setActionError(data?.error ?? "Не удалось одобрить часть объявлений.")
        setApproving(false)
        return
      }
    }
    setItems([])
    setTotal(0)
    setApproving(false)
  }

  return (
    <>
      {rejectTarget && (
        <RejectModal
          listingTitle={rejectTarget.title}
          onConfirm={(reason) => moderate(rejectTarget.id, "REJECTED", reason)}
          onCancel={() => setRejectTarget(null)}
        />
      )}

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
                <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                  {items.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {actionError && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {actionError}
          </div>
        )}

        <div className="mt-6 overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
          {loading ? (
            <div className="py-12 text-center text-sm text-zinc-400">Загрузка…</div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-400">
              Нет объявлений со статусом «{STATUS_LABEL[status]}»
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {items.map((item) => (
                <div key={item.id} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_auto_auto_auto] md:items-center">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-zinc-950">{item.title}</p>
                    <p className="text-sm text-zinc-500">
                      {item.city ?? "—"} · {item.category.nameRu} ·{" "}
                      <Link href={`/admin/users/${item.seller.id}`}
                        className="font-medium text-zinc-700 hover:text-[hsl(var(--nashlo-orange))] hover:underline transition">
                        {item.seller.name ?? item.seller.phone}
                      </Link>
                    </p>
                    <p className="text-sm font-medium text-zinc-700">{formatPrice(item.price)}</p>
                    {item.rejectionReason && (
                      <p className="mt-1 text-xs text-red-500">
                        Причина: {item.rejectionReason}
                      </p>
                    )}
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLOR[item.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                    {STATUS_LABEL[item.status] ?? item.status}
                  </span>
                  <Link href={`/admin/listings/${item.id}`}
                    className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
                    Детали
                  </Link>
                  {status === "MODERATION" && (
                    <div className="flex gap-2">
                      <button onClick={() => moderate(item.id, "APPROVED")}
                        className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 transition">
                        Одобрить
                      </button>
                      <button onClick={() => setRejectTarget(item)}
                        className="rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 transition">
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
    </>
  )
}
