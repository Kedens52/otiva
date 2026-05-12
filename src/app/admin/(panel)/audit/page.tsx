"use client"

import { useEffect, useState } from "react"

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
  ADMIN_LOGIN_FAILED:  "bg-red-50 text-red-600",
  ADMIN_LOGOUT:        "bg-zinc-100 text-zinc-500",
  STAFF_CREATED:       "bg-blue-50 text-blue-700",
  STAFF_ROLE_CHANGED:  "bg-purple-50 text-purple-700",
  STAFF_SUSPENDED:     "bg-amber-50 text-amber-700",
  STAFF_REVOKED:       "bg-red-50 text-red-600",
  PERMISSION_DENIED:   "bg-orange-50 text-orange-700",
}

export default function AdminAuditPage() {
  const [items,   setItems]   = useState<AuditEntry[]>([])
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [action,  setAction]  = useState("")

  async function load(act = action) {
    setLoading(true)
    const params = new URLSearchParams({ limit: "50" })
    if (act) params.set("action", act)
    const res = await fetch(`/api/admin/audit?${params}`)
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
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950">Журнал аудита</h1>
          <p className="mt-2 text-zinc-500">Все действия сотрудников. Записей: {total}</p>
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        <input
          value={action}
          onChange={(e) => setAction(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(action)}
          placeholder="Фильтр по действию (ADMIN_LOGIN_SUCCESS...)"
          className="h-11 w-full max-w-sm rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-orange-400"
        />
        <button
          onClick={() => load(action)}
          className="rounded-2xl bg-zinc-100 px-5 text-sm font-semibold hover:bg-zinc-200"
        >
          Найти
        </button>
        {action && (
          <button
            onClick={() => { setAction(""); load("") }}
            className="rounded-2xl bg-zinc-100 px-4 text-sm text-zinc-500 hover:bg-zinc-200"
          >
            Сброс
          </button>
        )}
      </div>

      <div className="mt-6 overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-sm text-zinc-400">Загрузка…</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-400">Записей не найдено</div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {items.map((entry) => (
              <div key={entry.id} className="flex items-start gap-4 px-5 py-3.5">
                <span className={`mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  ACTION_COLOR[entry.action] ?? "bg-zinc-100 text-zinc-600"
                }`}>
                  {entry.action}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-zinc-600">
                    {entry.targetType && entry.targetId
                      ? `${entry.targetType}: ${entry.targetId}`
                      : entry.actorId ?? "система"}
                    {entry.ip && <span className="ml-2 text-zinc-400">{entry.ip}</span>}
                  </p>
                  {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                    <p className="mt-0.5 truncate text-xs text-zinc-400 font-mono">
                      {JSON.stringify(entry.metadata)}
                    </p>
                  )}
                </div>
                <time className="shrink-0 text-xs text-zinc-400">
                  {new Date(entry.createdAt).toLocaleString("ru-RU")}
                </time>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
