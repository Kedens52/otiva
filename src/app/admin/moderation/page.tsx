"use client"

import { useEffect, useMemo, useState } from "react"
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton"
import { listings } from "@/lib/mock-marketplace"

type ModerationStatus = "На проверке" | "Одобрено" | "Отклонено" | "Автофильтр"
type ReportTab = "queue" | "reports"

type Report = {
  id: string
  listingId: string
  listingTitle: string
  reason: string
  comment: string
  ts: number
  status: "pending" | "resolved" | "dismissed"
}

const REASON_LABELS: Record<string, string> = {
  fraud: "Мошенничество или обман",
  prohibited: "Запрещённый товар",
  spam: "Спам или дубликат",
  wrong_category: "Не та категория",
  wrong_price: "Неверная цена",
  other: "Другое",
}

const RISK_COLOR: Record<string, string> = {
  "Высокий": "bg-red-50 text-red-600",
  "Средний": "bg-orange-50 text-orange-600",
  "Низкий": "bg-emerald-50 text-emerald-700",
}

const filters = [
  { id: "contacts",   title: "Контакты в описании",     desc: "Телефоны, мессенджеры и внешние ссылки",      level: "Высокий", enabled: true  },
  { id: "price",      title: "Подозрительная цена",      desc: "Цена сильно ниже рынка по категории",         level: "Средний", enabled: true  },
  { id: "duplicates", title: "Дубликаты объявлений",     desc: "Повтор названия, фото или описания",          level: "Высокий", enabled: true  },
  { id: "words",      title: "Стоп-слова",               desc: "Запрещенные товары, обещания и спам",         level: "Средний", enabled: false },
]

const plugins = [
  { id: "vision", title: "Проверка изображений", desc: "Находит водяные знаки, запрещённые товары и дубли", enabled: true  },
  { id: "risk",   title: "Риск продавца",         desc: "Считает риск по жалобам, скорости ответов и истории", enabled: true  },
  { id: "geo",    title: "Гео-антиспам",           desc: "Ловит массовые публикации из разных городов",      enabled: false },
]

export default function AdminModerationPage() {
  const [tab, setTab] = useState<ReportTab>("queue")
  const [reports, setReports] = useState<Report[]>([])
  const [reportStatuses, setReportStatuses] = useState<Record<string, Report["status"]>>({})
  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>(
    Object.fromEntries(filters.map((f) => [f.id, f.enabled]))
  )
  const [activePlugins, setActivePlugins] = useState<Record<string, boolean>>(
    Object.fromEntries(plugins.map((p) => [p.id, p.enabled]))
  )

  const queue = useMemo(
    () =>
      listings.slice(0, 6).map((listing, i) => ({
        ...listing,
        risk: i % 3 === 0 ? "Высокий" : i % 2 === 0 ? "Средний" : "Низкий",
        reason: i % 3 === 0 ? "Низкая цена и похожие фото" : i % 2 === 0 ? "Нужно проверить описание" : "Обычная проверка",
      })),
    []
  )

  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())
  const [statuses, setStatuses] = useState<Record<string, ModerationStatus>>(
    Object.fromEntries(queue.map((item, i) => [item.id, i === 1 ? "Автофильтр" : "На проверке"]))
  )

  // Load reports from localStorage
  useEffect(() => {
    try {
      const stored: Report[] = JSON.parse(localStorage.getItem("nashlo-reports") || "[]")
      setReports(stored)
      setReportStatuses(Object.fromEntries(stored.map((r) => [r.id, r.status])))
    } catch {}
  }, [])

  function resolveReport(id: string, _action: "resolved" | "dismissed") {
    setReports((prev) => prev.filter((r) => r.id !== id))
    try {
      const stored: Report[] = JSON.parse(localStorage.getItem("nashlo-reports") || "[]")
      localStorage.setItem("nashlo-reports", JSON.stringify(stored.filter((r) => r.id !== id)))
    } catch {}
  }

  const pendingCount = Object.values(statuses).filter(
    (s) => s === "На проверке" || s === "Автофильтр"
  ).length

  const pendingReports = reports.filter((r) => (reportStatuses[r.id] ?? r.status) === "pending").length

  function saveFilters() {
    localStorage.setItem("nashlo-admin-filters", JSON.stringify(activeFilters))
    localStorage.setItem("nashlo-admin-plugins", JSON.stringify(activePlugins))
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Панель модерации</h1>
          <p className="mt-1 text-sm text-zinc-500">Ручная проверка, автофильтры и жалобы пользователей.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={saveFilters}
            className="rounded-2xl bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Сохранить настройки
          </button>
          <AdminLogoutButton />
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { value: String(pendingCount), label: "В очереди" },
          { value: String(pendingReports), label: "Жалоб" },
          { value: "96%", label: "Авто-проверок" },
          { value: "7 мин", label: "Среднее решение" },
        ].map(({ value, label }) => (
          <div key={label} className="rounded-[24px] border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-2xl font-semibold text-zinc-950">{value}</p>
            <p className="mt-0.5 text-sm text-zinc-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-2">
        <button
          onClick={() => setTab("queue")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${tab === "queue" ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}
        >
          Очередь
          {pendingCount > 0 && (
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${tab === "queue" ? "bg-white text-zinc-950" : "bg-zinc-950 text-white"}`}>{pendingCount}</span>
          )}
        </button>
        <button
          onClick={() => setTab("reports")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${tab === "reports" ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}
        >
          Жалобы
          {pendingReports > 0 && (
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${tab === "reports" ? "bg-white text-zinc-950" : "bg-red-600 text-white"}`}>{pendingReports}</span>
          )}
        </button>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main content */}
        <div className="rounded-[28px] border border-zinc-200 bg-white shadow-sm overflow-hidden">
          {tab === "queue" ? (
            <>
              <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
                <h2 className="font-semibold text-zinc-950">Ручная очередь</h2>
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-600">{pendingCount} активных</span>
              </div>
              <div className="divide-y divide-zinc-100">
                {queue.filter((l) => !hiddenIds.has(l.id)).map((listing) => {
                  const status = statuses[listing.id]
                  const isDone = status === "Одобрено" || status === "Отклонено"
                  return (
                    <article key={listing.id} className="grid gap-4 px-5 py-4 xl:grid-cols-[80px_minmax(0,1fr)_160px] xl:items-center">
                      <div className={`h-20 overflow-hidden rounded-2xl bg-gradient-to-br ${listing.imageTone}`}>
                        <img src={`/listings/${listing.category}.svg`} alt="" className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold text-zinc-950">{listing.title}</p>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${RISK_COLOR[listing.risk]}`}>
                            {listing.risk} риск
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm text-zinc-500">{listing.city} · {listing.price.toLocaleString("ru-RU")} ₽</p>
                        <p className="mt-1 text-sm text-zinc-400">{listing.reason}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="rounded-xl bg-zinc-100 px-3 py-1.5 text-center text-xs font-semibold text-zinc-600">{status}</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            disabled={isDone}
                            onClick={() => { setStatuses((s) => ({ ...s, [listing.id]: "Одобрено" })); setTimeout(() => setHiddenIds((s) => new Set(Array.from(s).concat(listing.id))), 400) }}
                            className="rounded-xl bg-zinc-950 py-2 text-xs font-semibold text-white disabled:opacity-40"
                          >
                            Одобрить
                          </button>
                          <button
                            disabled={isDone}
                            onClick={() => { setStatuses((s) => ({ ...s, [listing.id]: "Отклонено" })); setTimeout(() => setHiddenIds((s) => new Set(Array.from(s).concat(listing.id))), 400) }}
                            className="rounded-xl bg-zinc-100 py-2 text-xs font-semibold text-zinc-700 disabled:opacity-40"
                          >
                            Отклонить
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
                <h2 className="font-semibold text-zinc-950">Жалобы пользователей</h2>
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-600">{reports.length} всего</span>
              </div>
              {reports.length === 0 ? (
                <div className="py-16 text-center text-zinc-400">
                  <p className="text-3xl mb-3">🛡️</p>
                  <p className="font-medium">Жалоб пока нет</p>
                  <p className="mt-1 text-sm">Они появятся, когда пользователи нажмут «Пожаловаться» на объявление</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {reports.map((report) => {
                    const status = reportStatuses[report.id] ?? report.status
                    const isDone = status !== "pending"
                    return (
                      <div key={report.id} className={`px-5 py-4 ${isDone ? "opacity-50" : ""}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-zinc-950">{report.listingTitle}</p>
                            <p className="mt-0.5 text-sm font-medium text-zinc-600">
                              {REASON_LABELS[report.reason] ?? report.reason}
                            </p>
                            {report.comment && (
                              <p className="mt-1 text-sm text-zinc-400">«{report.comment}»</p>
                            )}
                            <p className="mt-1 text-xs text-zinc-300">
                              {new Date(report.ts).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            {isDone ? (
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status === "resolved" ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
                                {status === "resolved" ? "Обработана" : "Отклонена"}
                              </span>
                            ) : (
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => resolveReport(report.id, "resolved")}
                                  className="rounded-xl bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-white"
                                >
                                  Удалить
                                </button>
                                <button
                                  onClick={() => resolveReport(report.id, "dismissed")}
                                  className="rounded-xl bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-600"
                                >
                                  Отклонить
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar — filters & plugins */}
        <aside className="space-y-5">
          <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-zinc-950">Автофильтры</h2>
            <div className="mt-4 space-y-2">
              {filters.map((f) => (
                <label key={f.id} className="flex cursor-pointer items-start gap-3 rounded-2xl bg-zinc-50 p-3">
                  <input
                    type="checkbox"
                    checked={activeFilters[f.id]}
                    onChange={(e) => setActiveFilters((s) => ({ ...s, [f.id]: e.target.checked }))}
                    className="mt-0.5 h-4 w-4 accent-zinc-950"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-zinc-950">{f.title}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{f.desc}</p>
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${f.level === "Высокий" ? "bg-red-50 text-red-500" : "bg-orange-50 text-orange-500"}`}>
                      {f.level}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-zinc-950">Плагины</h2>
            <div className="mt-4 space-y-2">
              {plugins.map((p) => (
                <label key={p.id} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-zinc-100 p-3">
                  <input
                    type="checkbox"
                    checked={activePlugins[p.id]}
                    onChange={(e) => setActivePlugins((s) => ({ ...s, [p.id]: e.target.checked }))}
                    className="mt-0.5 h-4 w-4 accent-zinc-950"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-zinc-950">{p.title}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{p.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  )
}
