"use client"

import { useEffect, useState } from "react"

type Analytics = {
  users: { total: number; newLast30Days: number }
  listings: { total: number; active: number; pendingModeration: number; sold: number }
  byCategory: { category: string; count: number }[]
  byCity: { city: string; count: number }[]
}

const ACTION_COLOR: Record<string, string> = {
  "Одобрено":  "bg-[hsl(var(--nashlo-mint)/0.15)] text-[hsl(var(--nashlo-mint))]",
  "Отклонено": "bg-red-50 text-red-600",
  "Бан":       "bg-zinc-950 text-white",
}

function fmt(n: number) {
  return n.toLocaleString("ru-RU")
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="h-9 w-48 animate-pulse rounded-xl bg-zinc-100" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1,2,3,4,5,6].map((i) => <div key={i} className="h-24 animate-pulse rounded-[24px] bg-zinc-100" />)}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-sm text-zinc-500">Ошибка загрузки аналитики</p>
      </div>
    )
  }

  const stats = [
    {
      value: fmt(data.users.total),
      label: "Пользователей",
      sub: `+${fmt(data.users.newLast30Days)} за 30 дней`,
      color: "bg-[hsl(var(--nashlo-blue)/0.10)]",
    },
    {
      value: fmt(data.listings.active),
      label: "Активных объявлений",
      sub: `${fmt(data.listings.pendingModeration)} на модерации`,
      color: "bg-[hsl(var(--nashlo-orange)/0.10)]",
    },
    {
      value: fmt(data.listings.sold),
      label: "Продано",
      sub: `всего объявлений: ${fmt(data.listings.total)}`,
      color: "bg-[hsl(var(--nashlo-mint)/0.12)]",
    },
  ]

  const totalCat = data.byCategory.reduce((s, r) => s + r.count, 0) || 1

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Аналитика</h1>
        <p className="mt-1 text-sm text-zinc-500">Реальная статистика платформы.</p>
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-[24px] p-5 ${s.color}`}>
            <p className="text-3xl font-semibold text-zinc-950">{s.value}</p>
            <p className="mt-1 font-medium text-zinc-700">{s.label}</p>
            <p className="mt-1 text-sm text-zinc-500">{s.sub}</p>
          </div>
        ))}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* By category */}
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

        {/* By city */}
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
    </div>
  )
}
