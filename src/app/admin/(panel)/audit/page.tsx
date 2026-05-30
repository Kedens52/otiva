"use client"

import { useEffect, useState } from "react"
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader"
import { AdminPageShell } from "@/components/admin/layout/AdminPageShell"
import { AUDIT_ACTION_OPTIONS, auditActionLabel } from "@/lib/admin/audit-labels"

type AuditEntry = {
  id: string
  actorId: string | null
  action: string
  targetType: string | null
  targetId: string | null
  metadata: Record<string, unknown> | null
  ip: string | null
  createdAt: string
}

const ACTION_COLOR: Record<string, string> = {
  ADMIN_LOGIN_SUCCESS: "bg-emerald-50 text-emerald-700",
  ADMIN_LOGIN_FAILED: "bg-red-50 text-red-600",
  ADMIN_LOGOUT: "bg-zinc-100 text-zinc-500",
  ADMIN_STAFF_CREATED: "bg-blue-50 text-blue-700",
  ADMIN_STAFF_ROLE_CHANGED: "bg-purple-50 text-purple-700",
  ADMIN_STAFF_SUSPENDED: "bg-amber-50 text-amber-700",
  ADMIN_STAFF_REVOKED: "bg-red-50 text-red-600",
  ADMIN_PERMISSION_DENIED: "bg-orange-50 text-orange-700",
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString("ru-RU")
}

export default function AdminAuditPage() {
  const [items, setItems] = useState<AuditEntry[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [nextCursor, setNextCursor] = useState<string | null>(null)

  async function load(opts?: { cursor?: string; reset?: boolean }) {
    setLoading(true)
    const params = new URLSearchParams({ limit: "50" })
    if (action) params.set("action", action)
    if (from) params.set("from", new Date(from).toISOString())
    if (to) params.set("to", new Date(to + "T23:59:59").toISOString())
    if (opts?.cursor) params.set("cursor", opts.cursor)

    const res = await fetch(`/api/admin/audit?${params}`)
    if (res.ok) {
      const d = await res.json()
      setTotal(d.total ?? 0)
      setNextCursor(d.nextCursor ?? null)
      setItems((prev) => (opts?.reset ? d.items ?? [] : [...prev, ...(d.items ?? [])]))
    }
    setLoading(false)
  }

  useEffect(() => {
    load({ reset: true })
  }, [])

  function applyFilters() {
    load({ reset: true })
  }

  function exportCsv() {
    const params = new URLSearchParams({ limit: "100", format: "csv" })
    if (action) params.set("action", action)
    if (from) params.set("from", new Date(from).toISOString())
    if (to) params.set("to", new Date(to + "T23:59:59").toISOString())
    window.open(`/api/admin/audit/export?${params}`, "_blank")
  }

  return (
    <AdminPageShell className="py-8">
      <AdminPageHeader
        title="Журнал аудита"
        description={`Действия сотрудников. Записей: ${total.toLocaleString("ru")}`}
      />

      <div className="mt-6 flex flex-wrap gap-3">
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-orange-400 sm:min-w-[200px] sm:w-auto"
        >
          <option value="">Все действия</option>
          {AUDIT_ACTION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="h-11 rounded-2xl border border-zinc-200 bg-white px-3 text-sm"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="h-11 rounded-2xl border border-zinc-200 bg-white px-3 text-sm"
        />
        <button
          onClick={applyFilters}
          className="rounded-2xl bg-zinc-950 px-5 text-sm font-semibold text-white"
        >
          Применить
        </button>
        <button
          onClick={() => {
            setAction("")
            setFrom("")
            setTo("")
            setTimeout(() => load({ reset: true }), 0)
          }}
          className="rounded-2xl bg-zinc-100 px-4 text-sm text-zinc-500 hover:bg-zinc-200"
        >
          Сброс
        </button>
        <button
          onClick={exportCsv}
          className="rounded-2xl bg-zinc-100 px-4 text-sm font-semibold hover:bg-zinc-200"
        >
          CSV
        </button>
      </div>

      {/* Mobile cards */}
      <div className="mt-6 space-y-3 lg:hidden">
        {loading && items.length === 0 ? (
          <div className="rounded-[28px] border border-zinc-200 bg-white py-12 text-center text-sm text-zinc-400">
            Загрузка…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-[28px] border border-zinc-200 bg-white py-12 text-center text-sm text-zinc-400">
            Записей не найдено
          </div>
        ) : (
          items.map((entry) => (
            <article
              key={entry.id}
              className="rounded-[20px] border border-zinc-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    ACTION_COLOR[entry.action] ?? "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {auditActionLabel(entry.action)}
                </span>
                <time className="shrink-0 text-xs text-zinc-400">{fmt(entry.createdAt)}</time>
              </div>
              <p className="mt-2 text-sm text-zinc-600">
                {entry.targetType && entry.targetId
                  ? `${entry.targetType}: ${entry.targetId}`
                  : entry.actorId ?? "система"}
              </p>
              {entry.ip && <p className="mt-1 text-xs text-zinc-400">IP {entry.ip}</p>}
            </article>
          ))
        )}
      </div>

      {/* Desktop list */}
      <div className="mt-6 hidden overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm lg:block">
        {loading && items.length === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-400">Загрузка…</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-400">Записей не найдено</div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {items.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-start sm:gap-4"
              >
                <span
                  className={`shrink-0 self-start rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    ACTION_COLOR[entry.action] ?? "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {auditActionLabel(entry.action)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-zinc-600 break-words">
                    {entry.targetType && entry.targetId
                      ? `${entry.targetType}: ${entry.targetId}`
                      : entry.actorId ?? "система"}
                    {entry.ip && <span className="ml-2 text-zinc-400">{entry.ip}</span>}
                  </p>
                  {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                    <p className="mt-0.5 break-all text-xs font-mono text-zinc-400">
                      {JSON.stringify(entry.metadata)}
                    </p>
                  )}
                </div>
                <time className="shrink-0 text-xs text-zinc-400 sm:text-right">
                  {fmt(entry.createdAt)}
                </time>
              </div>
            ))}
          </div>
        )}
      </div>

      {nextCursor && (
        <div className="mt-4 text-center">
          <button
            disabled={loading}
            onClick={() => load({ cursor: nextCursor })}
            className="rounded-2xl bg-zinc-100 px-6 py-2.5 text-sm font-semibold hover:bg-zinc-200 disabled:opacity-50"
          >
            {loading ? "Загрузка…" : "Загрузить ещё"}
          </button>
        </div>
      )}
    </AdminPageShell>
  )
}
