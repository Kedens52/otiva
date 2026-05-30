"use client"

import { useEffect, useState } from "react"
import { cookieConsentChoiceLabel } from "@/lib/cookie-consent"
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader"
import { AdminPageShell } from "@/components/admin/layout/AdminPageShell"

type Analytics = {
  users: { total: number; newLast30Days: number; newLast7Days: number; newToday: number }
  listings: { total: number; active: number; pendingModeration: number; sold: number; newToday: number; newLast7Days: number }
  byCategory: { category: string; count: number }[]
  byCity: { city: string; count: number }[]
  traffic?: {
    pageViewsToday: number
    pageViews7Days: number
    pageViews30Days: number
    uniqueVisitorsToday: number
    uniqueVisitors7Days: number
    uniqueVisitors30Days: number
    registrationsToday: number
    registrations7Days: number
    loginsToday?: number
    logins7Days?: number
  }
  topPaths?: { path: string; count: number }[]
  recentVisits?: {
    id: string
    type: string
    path: string
    referrer: string | null
    createdAt: string
    userLabel: string | null
  }[]
  cookieConsent?: {
    acceptedToday: number
    accepted7Days: number
    rejectedToday: number
    rejected7Days: number
    accepted30Days: number
    rejected30Days: number
    acceptanceRate7Days: number | null
    recent: {
      id: string
      choice: string
      source: string
      createdAt: string
      userLabel: string | null
    }[]
  }
}

function fmt(n: number) {
  return n.toLocaleString("ru-RU")
}

function visitTypeLabel(type: string) {
  if (type === "REGISTRATION") return "Регистрация"
  if (type === "LOGIN") return "Вход"
  return "Просмотр"
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((d) => {
        if (d && !d.error && typeof d.users === "object") setData(d)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-full bg-zinc-50">
        <AdminPageShell>
          <div className="h-9 w-48 animate-pulse rounded-xl bg-zinc-200" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-[24px] bg-zinc-200" />
            ))}
          </div>
        </AdminPageShell>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-full bg-zinc-50">
        <AdminPageShell>
          <AdminPageHeader title="Аналитика" description="Ошибка загрузки данных." />
        </AdminPageShell>
      </div>
    )
  }

  const traffic = data.traffic ?? {
    pageViewsToday: 0,
    pageViews7Days: 0,
    pageViews30Days: 0,
    uniqueVisitorsToday: 0,
    uniqueVisitors7Days: 0,
    uniqueVisitors30Days: 0,
    registrationsToday: 0,
    registrations7Days: 0,
    loginsToday: 0,
    logins7Days: 0,
  }

  const stats = [
    {
      value: fmt(data.users.total),
      label: "Пользователей",
      sub: `+${fmt(data.users.newLast30Days)} за 30 дней`,
      color: "border border-sky-100 bg-sky-50",
    },
    {
      value: fmt(data.listings.active),
      label: "Активных объявлений",
      sub: `${fmt(data.listings.pendingModeration)} на модерации`,
      color: "border border-orange-100 bg-orange-50",
    },
    {
      value: fmt(traffic.pageViews7Days),
      label: "Просмотры за 7 дней",
      sub: `${fmt(traffic.uniqueVisitors7Days)} уникальных`,
      color: "border border-emerald-100 bg-emerald-50",
    },
  ]

  const todayStats = [
    { label: "Новых пользователей сегодня", value: data.users.newToday, sub: `за 7 дней: +${fmt(data.users.newLast7Days)}` },
    { label: "Новых объявлений сегодня", value: data.listings.newToday, sub: `за 7 дней: +${fmt(data.listings.newLast7Days)}` },
    { label: "Просмотров сегодня", value: traffic.pageViewsToday, sub: `${fmt(traffic.uniqueVisitorsToday)} уникальных` },
    { label: "Регистраций (лог)", value: traffic.registrationsToday, sub: `за 7 дней: ${fmt(traffic.registrations7Days)}` },
    { label: "Входов (лог)", value: traffic.loginsToday ?? 0, sub: `за 7 дней: ${fmt(traffic.logins7Days ?? 0)}` },
  ]

  const totalCat = data.byCategory.reduce((s, r) => s + r.count, 0) || 1

  return (
    <div className="min-h-full bg-zinc-50">
      <AdminPageShell>
        <AdminPageHeader
          title="Аналитика"
          description="Пользователи, объявления и посещаемость сайта."
        />

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-[24px] p-5 ${s.color}`}>
            <p className="text-3xl font-semibold text-zinc-950">{s.value}</p>
            <p className="mt-1 font-medium text-zinc-700">{s.label}</p>
            <p className="mt-1 text-sm text-zinc-500">{s.sub}</p>
          </div>
        ))}
      </section>

      <section className="mt-4 grid gap-4 sm:grid-cols-2">
        {todayStats.map((s) => (
          <div key={s.label} className="flex items-center justify-between rounded-[20px] border border-zinc-200 bg-white px-5 py-4 shadow-sm">
            <div>
              <p className="text-sm font-medium text-zinc-600">{s.label}</p>
              <p className="mt-0.5 text-xs text-zinc-400">{s.sub}</p>
            </div>
            <p className="text-3xl font-semibold text-zinc-950">{s.value > 0 ? `+${fmt(s.value)}` : fmt(s.value)}</p>
          </div>
        ))}
      </section>

      {data.cookieConsent ? (
        <section className="mt-8 rounded-[24px] border border-zinc-200 bg-white p-6">
          <h2 className="text-base font-semibold text-zinc-950">Согласие на cookie</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Выборы в баннере и настройках. Аналитика посещений учитывается только после «Принять все».
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
              <p className="text-2xl font-semibold text-zinc-950">{fmt(data.cookieConsent.accepted7Days)}</p>
              <p className="text-xs font-medium text-emerald-800">Приняли аналитику (7 дн.)</p>
              <p className="mt-0.5 text-xs text-zinc-500">сегодня: {fmt(data.cookieConsent.acceptedToday)}</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <p className="text-2xl font-semibold text-zinc-950">{fmt(data.cookieConsent.rejected7Days)}</p>
              <p className="text-xs font-medium text-zinc-700">Только необходимые (7 дн.)</p>
              <p className="mt-0.5 text-xs text-zinc-500">сегодня: {fmt(data.cookieConsent.rejectedToday)}</p>
            </div>
            <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 sm:col-span-2 lg:col-span-2">
              <p className="text-2xl font-semibold text-zinc-950">
                {data.cookieConsent.acceptanceRate7Days != null
                  ? `${data.cookieConsent.acceptanceRate7Days}%`
                  : "—"}
              </p>
              <p className="text-xs font-medium text-orange-900">Доля согласия на аналитику (7 дн.)</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                за 30 дней: {fmt(data.cookieConsent.accepted30Days)} приняли /{" "}
                {fmt(data.cookieConsent.rejected30Days)} отказали
              </p>
            </div>
          </div>
          {(data.cookieConsent.recent ?? []).length > 0 ? (
            <div className="mt-4 max-h-[220px] space-y-2 overflow-y-auto">
              {data.cookieConsent.recent.slice(0, 15).map((row) => (
                <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-zinc-100 px-4 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-zinc-800">{cookieConsentChoiceLabel(row.choice)}</p>
                    <p className="text-xs text-zinc-500">
                      {row.source}
                      {row.userLabel ? ` · ${row.userLabel}` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-400">
                    {new Date(row.createdAt).toLocaleString("ru-RU")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-zinc-400">Пока нет записей о выборе cookie</p>
          )}
        </section>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-[24px] border border-zinc-200 bg-white p-6">
          <h2 className="text-base font-semibold text-zinc-950">Топ страниц (7 дней)</h2>
          {(data.topPaths ?? []).length === 0 ? (
            <p className="mt-4 text-sm text-zinc-400">Пока нет данных о посещениях</p>
          ) : (
            <div className="mt-4 space-y-2">
              {(data.topPaths ?? []).map((row) => (
                <div key={row.path} className="flex items-center justify-between gap-3 rounded-2xl bg-zinc-50 px-4 py-3">
                  <span className="min-w-0 truncate text-sm font-medium text-zinc-800">{row.path}</span>
                  <span className="shrink-0 text-sm font-semibold text-zinc-950">{fmt(row.count)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[24px] border border-zinc-200 bg-white p-6">
          <h2 className="text-base font-semibold text-zinc-950">Последние визиты</h2>
          {(data.recentVisits ?? []).length === 0 ? (
            <p className="mt-4 text-sm text-zinc-400">Визиты появятся после просмотров на сайте</p>
          ) : (
            <div className="mt-4 max-h-[320px] space-y-2 overflow-y-auto">
              {(data.recentVisits ?? []).slice(0, 20).map((visit) => (
                <div key={visit.id} className="rounded-2xl border border-zinc-100 px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-zinc-900">{visit.path}</span>
                    <span className="shrink-0 text-xs text-zinc-400">
                      {new Date(visit.createdAt).toLocaleString("ru-RU")}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    {visitTypeLabel(visit.type)}
                    {visit.userLabel ? ` · ${visit.userLabel}` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-[24px] border border-zinc-200 bg-white p-6">
          <h2 className="text-base font-semibold text-zinc-950">По категориям</h2>
          {data.byCategory.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-400">Нет данных</p>
          ) : (
            <div className="mt-4 space-y-3">
              {data.byCategory.map((row) => (
                <div key={row.category}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-zinc-700">{row.category}</span>
                    <span className="text-zinc-500">{fmt(row.count)}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-[hsl(var(--nashlo-orange))]"
                      style={{ width: `${Math.round((row.count / totalCat) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[24px] border border-zinc-200 bg-white p-6">
          <h2 className="text-base font-semibold text-zinc-950">По городам</h2>
          {data.byCity.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-400">Нет данных</p>
          ) : (
            <div className="mt-4 space-y-3">
              {data.byCity.map((row) => (
                <div key={row.city} className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3">
                  <span className="text-sm font-medium text-zinc-950">{row.city}</span>
                  <span className="text-sm font-semibold text-zinc-950">{fmt(row.count)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      </AdminPageShell>
    </div>
  )
}
