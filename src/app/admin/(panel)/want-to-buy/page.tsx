"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getAdminCsrfFromDocument } from "@/lib/admin/csrf-client"
import {
  formatWantToBuyPriceMax,
  wantToBuyConditionLabel,
  wantToBuyStatusLabel,
} from "@/lib/want-to-buy/labels"
import { getWantToBuyDetailPath, getWantToBuyHubPath } from "@/lib/want-to-buy/routes"
import { WantToBuyStatusBadge } from "@/components/want-to-buy/WantToBuyStatusBadge"
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader"
import { AdminPageShell } from "@/components/admin/layout/AdminPageShell"

type WantToBuyItem = {
  id: string
  title: string
  description: string
  city: string | null
  priceMax: number | null
  condition: string
  status: string
  createdAt: string
  expiresAt: string
  rejectionReason: string | null
  moderationReasonCode: string | null
  autoApproved: boolean
  views: number
  user: { id: string; name: string | null; phone: string; city: string | null }
  category: { slug: string; nameRu: string }
  _count: { offers: number }
}

type Stats = {
  moderation: number
  active: number
  rejected: number
  expired: number
  closed: number
  offersWeek: number
  createdWeek: number
}

const STATUS_TABS = ["MODERATION", "ACTIVE", "REJECTED", "CLOSED", "EXPIRED"] as const

async function adminPost(body: object): Promise<Response> {
  return fetch("/api/admin/want-to-buy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": getAdminCsrfFromDocument(),
    },
    body: JSON.stringify(body),
  })
}

function RejectModal({
  title,
  onConfirm,
  onCancel,
}: {
  title: string
  onConfirm: (reason: string) => void
  onCancel: () => void
}) {
  const [reason, setReason] = useState("")
  const quick = [
    "Запрещённый товар или услуга",
    "Контакты в описании",
    "Спам или дубль",
    "Некорректное описание",
    "Неправильная категория",
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-zinc-950">Причина отклонения</h2>
        <p className="mt-1 truncate text-sm text-zinc-500">«{title}»</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {quick.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setReason(q)}
              className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                reason === q
                  ? "border-zinc-950 bg-zinc-950 text-white"
                  : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300"
              }`}
            >
              {q}
            </button>
          ))}
        </div>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Причина для покупателя…"
          rows={3}
          maxLength={500}
          className="mt-4 w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-zinc-400"
        />
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-600 hover:bg-zinc-50"
          >
            Отмена
          </button>
          <button
            type="button"
            disabled={!reason.trim()}
            onClick={() => onConfirm(reason.trim())}
            className="flex-1 rounded-2xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            Отклонить
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminWantToBuyPage() {
  const [items, setItems] = useState<WantToBuyItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<(typeof STATUS_TABS)[number]>("MODERATION")
  const [stats, setStats] = useState<Stats | null>(null)
  const [rejectTarget, setRejectTarget] = useState<WantToBuyItem | null>(null)
  const [actionError, setActionError] = useState("")

  useEffect(() => {
    fetch("/api/admin/want-to-buy?stats=1")
      .then((r) => r.json())
      .then((d) => {
        if (d.stats) setStats(d.stats)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/want-to-buy?status=${status}`)
        if (res.ok) {
          const data = await res.json()
          setItems(data.items ?? [])
          setTotal(data.total ?? 0)
        }
      } catch {
        /* ignore */
      }
      setLoading(false)
    }
    load()
  }, [status])

  async function moderate(
    wantToBuyId: string,
    action: "APPROVED" | "REJECTED" | "CLOSED",
    reason?: string,
  ) {
    setActionError("")
    const res = await adminPost({ wantToBuyId, action, reason })
    if (res.ok) {
      setItems((prev) => prev.filter((x) => x.id !== wantToBuyId))
      setTotal((t) => Math.max(0, t - 1))
      setRejectTarget(null)
      fetch("/api/admin/want-to-buy?stats=1")
        .then((r) => r.json())
        .then((d) => {
          if (d.stats) setStats(d.stats)
        })
        .catch(() => {})
      return
    }
    const data = await res.json().catch(() => null)
    setActionError(data?.error ?? "Не удалось выполнить действие")
  }

  return (
    <>
      {rejectTarget && (
        <RejectModal
          title={rejectTarget.title}
          onConfirm={(reason) => moderate(rejectTarget.id, "REJECTED", reason)}
          onCancel={() => setRejectTarget(null)}
        />
      )}

      <AdminPageShell className="py-8">
        <AdminPageHeader
          title="Куплю"
          description="Заявки покупателей и отклики продавцов"
          actions={
            <Link
              href={getWantToBuyHubPath()}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
            >
              Открыть на сайте
            </Link>
          }
        />

        {stats && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-800">На модерации</p>
              <p className="mt-1 text-2xl font-bold text-amber-950">{stats.moderation}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">Активные</p>
              <p className="mt-1 text-2xl font-bold text-emerald-950">{stats.active}</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Откликов за 7 дней</p>
              <p className="mt-1 text-2xl font-bold text-zinc-950">{stats.offersWeek}</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Новых заявок за 7 дней</p>
              <p className="mt-1 text-2xl font-bold text-zinc-950">{stats.createdWeek}</p>
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
          {STATUS_TABS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatus(key)}
              className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                status === key ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {wantToBuyStatusLabel(key)}
              {status === key && !loading && (
                <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">{total}</span>
              )}
            </button>
          ))}
        </div>

        {actionError && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {actionError}
          </div>
        )}

        {loading ? (
          <p className="mt-8 text-zinc-500">Загрузка…</p>
        ) : items.length === 0 ? (
          <p className="mt-8 text-zinc-500">Нет заявок в этом статусе</p>
        ) : (
          <ul className="mt-6 space-y-4">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <WantToBuyStatusBadge status={item.status} />
                      <span className="text-xs text-zinc-500">{item.category.nameRu}</span>
                      {item.autoApproved && (
                        <span className="text-xs text-emerald-600">авто</span>
                      )}
                    </div>
                    <h2 className="mt-2 text-lg font-semibold text-zinc-950">{item.title}</h2>
                    <p className="mt-1 line-clamp-3 text-sm text-zinc-600">{item.description}</p>
                    <p className="mt-2 text-sm text-zinc-500">
                      {formatWantToBuyPriceMax(item.priceMax)} · {wantToBuyConditionLabel(item.condition)}
                      {item.city ? ` · ${item.city}` : ""} · откликов: {item._count.offers} · просмотров:{" "}
                      {item.views}
                    </p>
                    <p className="mt-2 text-xs text-zinc-400">
                      Покупатель:{" "}
                      <Link href={`/admin/users/${item.user.id}`} className="text-orange-600 hover:underline">
                        {item.user.name || item.user.phone}
                      </Link>
                      {" · "}
                      до {new Date(item.expiresAt).toLocaleDateString("ru-RU")}
                    </p>
                    {item.rejectionReason && (
                      <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                        {item.rejectionReason}
                      </p>
                    )}
                  </div>

                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
                    <Link
                      href={getWantToBuyDetailPath({
                        id: item.id,
                        categorySlug: item.category.slug,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-2xl border border-zinc-200 px-4 py-2.5 text-center text-sm font-semibold text-zinc-700 hover:bg-zinc-50 sm:text-left"
                    >
                      На сайте
                    </Link>
                    {item.status === "MODERATION" && (
                      <>
                        <button
                          type="button"
                          onClick={() => moderate(item.id, "APPROVED")}
                          className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                        >
                          Одобрить
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejectTarget(item)}
                          className="rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                        >
                          Отклонить
                        </button>
                      </>
                    )}
                    {item.status === "ACTIVE" && (
                      <button
                        type="button"
                        onClick={() => moderate(item.id, "CLOSED")}
                        className="rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                      >
                        Закрыть
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminPageShell>
    </>
  )
}
