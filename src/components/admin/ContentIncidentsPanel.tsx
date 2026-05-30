"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { getAdminCsrfFromDocument } from "@/lib/admin/csrf-client"
import { moderationReasonByCode } from "@/lib/moderation-reasons"

type IncidentRow = {
  id: string
  source: "LISTING" | "WANT_TO_BUY" | "LISTING_UPLOAD"
  severity: "BLOCKED" | "FLAGGED"
  reasonCode: string
  summary: string
  status: string
  matchedRules: string[] | null
  payload: Record<string, unknown>
  createdAt: string
  user: {
    id: string
    name: string | null
    phone: string | null
    email: string | null
    trustTier: string
    isBanned: boolean
  }
  listing: { id: string; title: string; status: string } | null
  wantToBuy: { id: string; title: string; status: string } | null
}

const SOURCE_LABEL: Record<IncidentRow["source"], string> = {
  LISTING: "Объявление",
  WANT_TO_BUY: "Куплю",
  LISTING_UPLOAD: "Загрузка фото",
}

export function ContentIncidentsPanel() {
  const [items, setItems] = useState<IncidentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/content-incidents?status=pending&limit=80")
      if (res.ok) {
        const data = (await res.json()) as { items?: IncidentRow[] }
        setItems(data.items ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function resolve(id: string, status: "reviewed" | "dismissed", blockImageHash = false) {
    await fetch(`/api/admin/content-incidents/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": getAdminCsrfFromDocument(),
      },
      body: JSON.stringify({ status, blockImageHash }),
    })
    setItems((prev) => prev.filter((row) => row.id !== id))
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Загрузка инцидентов…</p>
  }

  if (!items.length) {
    return (
      <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-6 text-sm text-zinc-600">
        Нет новых автоматических блокировок. Срабатывания по запрещённому контенту, дублям текста и
        отклонённым фото появятся здесь.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((row) => {
        const reason = moderationReasonByCode(row.reasonCode)
        const payload = row.payload
        const expanded = expandedId === row.id

        return (
          <article key={row.id} className="rounded-xl border border-red-100 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                  {SOURCE_LABEL[row.source]} · {row.severity === "BLOCKED" ? "Блокировка" : "Флаг"}
                </p>
                <h3 className="mt-1 text-base font-semibold text-zinc-900">
                  {reason?.label ?? row.reasonCode}
                </h3>
                <p className="mt-1 text-sm text-zinc-600">{row.summary}</p>
                <p className="mt-2 text-xs text-zinc-500">
                  {new Date(row.createdAt).toLocaleString("ru-RU")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50"
                  onClick={() => setExpandedId(expanded ? null : row.id)}
                >
                  {expanded ? "Скрыть" : "Подробности"}
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
                  onClick={() => void resolve(row.id, "reviewed")}
                >
                  Проверено
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50"
                  onClick={() => void resolve(row.id, "dismissed")}
                >
                  Отклонить
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <Link href={`/admin/users/${row.user.id}`} className="font-medium text-[#FF5A00] hover:underline">
                {row.user.name ?? row.user.phone ?? row.user.email ?? row.user.id}
              </Link>
              {row.listing ? (
                <Link
                  href={`/admin/listings/${row.listing.id}`}
                  className="text-zinc-700 hover:underline"
                >
                  Объявление: {row.listing.title}
                </Link>
              ) : null}
              {row.wantToBuy ? (
                <Link href="/admin/want-to-buy" className="text-zinc-700 hover:underline">
                  Заявка: {row.wantToBuy.title}
                </Link>
              ) : null}
            </div>

            {expanded ? (
              <div className="mt-4 space-y-3 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-800">
                {row.matchedRules?.length ? (
                  <div>
                    <p className="font-semibold text-zinc-900">Сработавшие правила</p>
                    <ul className="mt-1 list-inside list-disc">
                      {row.matchedRules.map((rule) => (
                        <li key={rule}>{rule}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div>
                  <p className="font-semibold text-zinc-900">Полные данные</p>
                  <pre className="mt-1 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded border border-zinc-200 bg-white p-2">
                    {JSON.stringify(payload, null, 2)}
                  </pre>
                </div>
                {row.source === "LISTING_UPLOAD" && typeof payload.sha256 === "string" ? (
                  <button
                    type="button"
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
                    onClick={() => void resolve(row.id, "reviewed", true)}
                  >
                    Заблокировать хеш фото навсегда
                  </button>
                ) : null}
              </div>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}
