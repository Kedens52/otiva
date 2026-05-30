"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import type {
  ActivityTab,
  DashboardRegistrationRow,
  DashboardStaffLoginRow,
  DashboardUserLoginRow,
  DashboardVisitRow,
} from "@/lib/admin/dashboard-activity"
import { authSourceBadgeClass } from "@/lib/admin/user-auth-source"

type Props = {
  showSensitive: boolean
  canViewUsers: boolean
}

type ActivityPayload = {
  tab: ActivityTab
  items: DashboardVisitRow[] | DashboardRegistrationRow[] | DashboardUserLoginRow[] | DashboardStaffLoginRow[]
  nextCursor: string | null
}

const TAB_LABELS: Record<ActivityTab, string> = {
  visits: "Визиты",
  registrations: "Регистрации",
  logins: "Входы пользователей",
  staff: "Входы в админку",
}

function fmt(iso: string) {
  try {
    return new Date(iso).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

function shortUa(ua: string | null) {
  if (!ua) return null
  if (ua.length <= 72) return ua
  return `${ua.slice(0, 72)}…`
}

function staffActionLabel(action: string) {
  if (action === "ADMIN_LOGIN_SUCCESS") return "Вход в админку"
  if (action === "ADMIN_LOGIN_FAILED") return "Неудачный вход"
  if (action === "ADMIN_LOGOUT") return "Выход"
  return action
}

export function AdminDashboardActivity({ showSensitive, canViewUsers }: Props) {
  const [tab, setTab] = useState<ActivityTab>("visits")
  const [days, setDays] = useState(7)
  const [q, setQ] = useState("")
  const [search, setSearch] = useState("")
  const [guestOnly, setGuestOnly] = useState(false)
  const [authOnly, setAuthOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [data, setData] = useState<ActivityPayload | null>(null)
  const [cursorStack, setCursorStack] = useState<string[]>([])

  const load = useCallback(
    async (cursor?: string) => {
      setLoading(true)
      const params = new URLSearchParams({
        tab,
        days: String(days),
        limit: "50",
      })
      if (search) params.set("q", search)
      if (tab === "visits" && guestOnly) params.set("guestOnly", "1")
      if (tab === "visits" && authOnly) params.set("authOnly", "1")
      if (cursor) params.set("cursor", cursor)

      const res = await fetch(`/api/admin/dashboard/activity?${params}`)
      if (res.ok) {
        const json = await res.json()
        setData({ tab: json.tab, items: json.items, nextCursor: json.nextCursor ?? null })
      }
      setLoading(false)
    },
    [tab, days, search, guestOnly, authOnly],
  )

  useEffect(() => {
    setCursorStack([])
    load()
  }, [tab, days, search, guestOnly, authOnly, refreshKey, load])

  const exportUrl = useMemo(() => {
    const params = new URLSearchParams({
      tab,
      days: String(days),
      format: "csv",
      limit: "100",
    })
    if (search) params.set("q", search)
    if (tab === "visits" && guestOnly) params.set("guestOnly", "1")
    if (tab === "visits" && authOnly) params.set("authOnly", "1")
    return `/api/admin/dashboard/activity?${params}`
  }, [tab, days, search, guestOnly, authOnly])

  function applySearch() {
    setSearch(q.trim())
    setCursorStack([])
  }

  function nextPage() {
    if (!data?.nextCursor) return
    setCursorStack((s) => [...s, data.nextCursor!])
    load(data.nextCursor)
  }

  function prevPage() {
    if (cursorStack.length === 0) return
    const next = [...cursorStack]
    next.pop()
    const prevCursor = next[next.length - 1]
    setCursorStack(next)
    load(prevCursor)
  }

  const items = data?.items ?? []

  return (
    <section className="mt-8" aria-label="Активность на сайте">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-800">Активность и регистрации</h2>
          <p className="mt-0.5 text-sm text-zinc-500">
            Заходы, регистрации, входы и события админки.
            {!showSensitive && " IP и браузер скрыты без права на чувствительные данные."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="rounded-xl bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-200"
          >
            Обновить
          </button>
          <a
            href={exportUrl}
            className="rounded-xl bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-200"
          >
            CSV
          </a>
          <Link
            href="/admin/audit"
            className="rounded-xl px-3 py-2 text-sm font-semibold text-[hsl(var(--nashlo-orange))] hover:underline"
          >
            Журнал аудита →
          </Link>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm"
        >
          <option value={1}>За сутки</option>
          <option value={7}>7 дней</option>
          <option value={30}>30 дней</option>
          <option value={0}>Всё время</option>
        </select>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applySearch()}
          placeholder="IP, путь, пользователь…"
          className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-orange-400 sm:min-w-[180px] sm:flex-1"
        />
        <button
          type="button"
          onClick={applySearch}
          className="h-10 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white"
        >
          Найти
        </button>
        {tab === "visits" && (
          <>
            <label className="flex items-center gap-1.5 text-sm text-zinc-600">
              <input type="checkbox" checked={guestOnly} onChange={(e) => setGuestOnly(e.target.checked)} />
              Только гости
            </label>
            <label className="flex items-center gap-1.5 text-sm text-zinc-600">
              <input type="checkbox" checked={authOnly} onChange={(e) => setAuthOnly(e.target.checked)} />
              Только авториз.
            </label>
          </>
        )}
      </div>

      <div className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
        <div className="flex gap-2 overflow-x-auto border-b border-zinc-100 px-3 py-3 sm:px-4">
          {(Object.keys(TAB_LABELS) as ActivityTab[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`shrink-0 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                tab === key ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {TAB_LABELS[key]}
            </button>
          ))}
        </div>

        <div className="max-h-[min(70vh,520px)] overflow-y-auto divide-y divide-zinc-100">
          {loading ? (
            <EmptyRow text="Загрузка…" />
          ) : tab === "visits" ? (
            (items as DashboardVisitRow[]).length === 0 ? (
              <EmptyRow text="Визитов не найдено" />
            ) : (
              (items as DashboardVisitRow[]).map((v) => (
                <article key={v.id} className="px-4 py-3.5 sm:px-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-mono text-sm font-semibold text-zinc-950">{v.path}</p>
                    <time className="shrink-0 text-xs text-zinc-400">{fmt(v.at)}</time>
                  </div>
                  {v.user && canViewUsers ? (
                    <p className="mt-1 text-sm">
                      <Link
                        href={`/admin/users/${v.user.id}`}
                        className="font-semibold text-[hsl(var(--nashlo-orange))] hover:underline"
                      >
                        {v.user.name ?? v.user.phone ?? v.user.id.slice(0, 8)}
                      </Link>
                      <span className="text-zinc-400"> · авторизован</span>
                    </p>
                  ) : v.user ? (
                    <p className="mt-1 text-sm text-zinc-500">Авторизованный пользователь</p>
                  ) : (
                    <p className="mt-1 text-sm text-zinc-500">Гость · visitor {v.visitorId.slice(0, 10)}…</p>
                  )}
                  {v.referrer && <p className="mt-1 text-xs text-zinc-500">Откуда: {v.referrer}</p>}
                  {(v.device || v.ip || v.userAgent) && (
                    <p className="mt-1 break-all text-xs text-zinc-400">
                      {v.device && <>{v.device}</>}
                      {showSensitive && v.ip && <> · IP {v.ip}</>}
                      {showSensitive && v.userAgent && <> · {shortUa(v.userAgent)}</>}
                    </p>
                  )}
                </article>
              ))
            )
          ) : tab === "registrations" ? (
            (items as DashboardRegistrationRow[]).length === 0 ? (
              <EmptyRow text="Регистраций не найдено" />
            ) : (
              (items as DashboardRegistrationRow[]).map((r) => (
                <article key={r.id} className="px-4 py-3.5 sm:px-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {canViewUsers ? (
                        <Link
                          href={`/admin/users/${r.user.id}`}
                          className="text-sm font-semibold text-zinc-950 hover:text-[hsl(var(--nashlo-orange))]"
                        >
                          {r.user.name ?? r.user.phone ?? r.user.email ?? "Без имени"}
                        </Link>
                      ) : (
                        <span className="text-sm font-semibold text-zinc-950">Новый пользователь</span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${authSourceBadgeClass(r.authSource)}`}
                      >
                        {r.authSource}
                      </span>
                    </div>
                    <time className="shrink-0 text-xs text-zinc-400">{fmt(r.at)}</time>
                  </div>
                  {canViewUsers && (
                    <p className="mt-1 text-xs text-zinc-500">
                      {[r.user.phone, r.user.email, r.user.city].filter(Boolean).join(" · ") || "Контакты не указаны"}
                    </p>
                  )}
                  {showSensitive && r.ip && <p className="mt-0.5 text-xs text-zinc-400">IP: {r.ip}</p>}
                </article>
              ))
            )
          ) : tab === "logins" ? (
            (items as DashboardUserLoginRow[]).length === 0 ? (
              <EmptyRow text="Входов не найдено" />
            ) : (
              (items as DashboardUserLoginRow[]).map((s) => (
                <article key={s.id} className="px-4 py-3.5 sm:px-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    {canViewUsers ? (
                      <Link
                        href={`/admin/users/${s.user.id}`}
                        className="text-sm font-semibold text-zinc-950 hover:text-[hsl(var(--nashlo-orange))]"
                      >
                        {s.user.name ?? s.user.phone ?? s.user.id.slice(0, 8)}
                      </Link>
                    ) : (
                      <span className="text-sm font-semibold text-zinc-950">Пользователь</span>
                    )}
                    <time className="shrink-0 text-xs text-zinc-400">{fmt(s.at)}</time>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    {s.authSource}
                    {s.device ? ` · ${s.device}` : ""}
                    {s.source === "session" ? " · из сессии" : ""}
                  </p>
                  {showSensitive && (s.ip || s.userAgent) && (
                    <p className="mt-1 break-all text-xs text-zinc-400">
                      {s.ip && <>IP {s.ip}</>}
                      {s.ip && s.userAgent && " · "}
                      {s.userAgent && shortUa(s.userAgent)}
                    </p>
                  )}
                </article>
              ))
            )
          ) : (items as DashboardStaffLoginRow[]).length === 0 ? (
            <EmptyRow text="Событий входа сотрудников нет" />
          ) : (
            (items as DashboardStaffLoginRow[]).map((log) => (
              <article key={log.id} className="px-4 py-3.5 sm:px-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-zinc-950">
                    {staffActionLabel(log.action)}
                    <span className="ml-2 font-normal text-zinc-600">
                      {log.staffName ?? log.staffLogin ?? "—"}
                    </span>
                  </p>
                  <time className="shrink-0 text-xs text-zinc-400">{fmt(log.at)}</time>
                </div>
                {log.device && <p className="mt-0.5 text-xs text-zinc-500">{log.device}</p>}
                {showSensitive && log.ip && <p className="mt-0.5 text-xs text-zinc-400">IP {log.ip}</p>}
              </article>
            ))
          )}
        </div>

        {(cursorStack.length > 0 || data?.nextCursor) && (
          <div className="flex justify-between border-t border-zinc-100 px-4 py-3">
            <button
              type="button"
              disabled={cursorStack.length === 0 || loading}
              onClick={prevPage}
              className="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold disabled:opacity-40"
            >
              ← Назад
            </button>
            <button
              type="button"
              disabled={!data?.nextCursor || loading}
              onClick={nextPage}
              className="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold disabled:opacity-40"
            >
              Далее →
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

function EmptyRow({ text }: { text: string }) {
  return <p className="px-5 py-12 text-center text-sm text-zinc-400">{text}</p>
}
