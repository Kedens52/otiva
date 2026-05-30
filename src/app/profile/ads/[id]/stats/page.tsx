"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { CabinetPage } from "@/components/profile/CabinetPage"
type Stats = {
  summary: {
    impressions: number
    clicks: number
    ctr: number
    spent: number
    budget: number | null
    budgetRemaining: number | null
  }
  byDay: Array<{ date: string; impressions: number; clicks: number }>
  topCategories: Array<{ key: string; count: number }>
  topCities: Array<{ key: string; count: number }>
  topDevices: Array<{ key: string; count: number }>
  topPlacements: Array<{ key: string; count: number }>
}

export default function ProfileAdStatsPage() {
  const { id } = useParams<{ id: string }>()
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch(`/api/profile/ads/${id}/stats`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setStats)
  }, [id])

  const s = stats?.summary

  return (
    <CabinetPage
        title="Статистика"
        action={<Link href={`/profile/ads/${id}`} className="text-sm font-medium text-[hsl(var(--nashlo-orange))]">← К кампании</Link>}
      >
        {!s ? (
          <p className="text-sm text-zinc-500">Загрузка…</p>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                ["Показы", s.impressions],
                ["Клики", s.clicks],
                ["CTR", `${s.ctr}%`],
                ["Расход", `${s.spent.toLocaleString("ru-RU")} ₽`],
                ["Бюджет", s.budget != null ? `${s.budget.toLocaleString("ru-RU")} ₽` : "—"],
                ["Остаток", s.budgetRemaining != null ? `${s.budgetRemaining.toLocaleString("ru-RU")} ₽` : "—"],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-xl border border-zinc-200 p-3">
                  <p className="text-xs text-zinc-500">{label}</p>
                  <p className="text-lg font-semibold text-zinc-950">{value}</p>
                </div>
              ))}
            </div>

            {stats.byDay.length ? (
              <div>
                <h3 className="text-sm font-semibold">По дням</h3>
                <ul className="mt-2 space-y-1 text-sm text-zinc-600">
                  {stats.byDay.map((d) => (
                    <li key={d.date}>{d.date}: {d.impressions} показов, {d.clicks} кликов</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <StatList title="Лучшие категории" items={stats.topCategories} />
              <StatList title="Лучшие города" items={stats.topCities} />
              <StatList title="Устройства" items={stats.topDevices} />
              <StatList title="Размещения" items={stats.topPlacements} />
            </div>
          </div>
        )}
    </CabinetPage>
  )
}

function StatList({ title, items }: { title: string; items: Array<{ key: string; count: number }> }) {
  if (!items.length) return null
  return (
    <div className="rounded-xl border border-zinc-200 p-3">
      <p className="text-sm font-semibold text-zinc-900">{title}</p>
      <ul className="mt-2 space-y-1 text-xs text-zinc-600">
        {items.map((i) => (
          <li key={i.key}>{i.key}: {i.count}</li>
        ))}
      </ul>
    </div>
  )
}
