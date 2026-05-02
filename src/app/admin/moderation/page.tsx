"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton"
import { formatPrice } from "@/lib/listing-types"

type QueueItem = {
  id: string
  title: string
  price: number
  city: string | null
  images: string[]
  category: { slug: string; nameRu: string }
  seller: { id: string; name: string | null; phone: string }
  createdAt: string
}

type Report = {
  id: string
  listingId: string
  listing: { id: string; title: string } | null
  reason: string
  comment: string
  status: string
  createdAt: string
}

type ReportTab = "queue" | "reports"

const REASON_LABELS: Record<string, string> = {
  fraud: "Мошенничество или обман",
  prohibited: "Запрещённый товар",
  spam: "Спам или дубликат",
  wrong_category: "Не та категория",
  wrong_price: "Неверная цена",
  other: "Другое",
}

const autoFilters = [
  { id: "contacts",   title: "Контакты в описании",  desc: "Телефоны, мессенджеры и внешние ссылки", level: "Высокий" },
  { id: "price",      title: "Подозрительная цена",   desc: "Цена сильно ниже рынка по категории",    level: "Средний" },
  { id: "duplicates", title: "Дубликаты объявлений",  desc: "Повтор названия, фото или описания",     level: "Высокий" },
  { id: "words",      title: "Стоп-слова",            desc: "Запрещённые товары, обещания и спам",    level: "Средний" },
]

export default function AdminModerationPage() {
  const [tab, setTab]       = useState<ReportTab>("queue")
  const [queue, setQueue]   = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<Report[]>([])
  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>(
    Object.fromEntries(autoFilters.map((f) => [f.id, true]))
  )

  async function loadQueue() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/listings?status=MODERATION")
      if (res.ok) {
        const data = await res.json()
        setQueue(data.items ?? [])
      }
    } catch {}
    setLoading(false)
  }

  async function loadReports() {
    try {
      const res = await fetch("/api/admin/reports")
      if (res.ok) {
        const data = await res.json()
        setReports(data.reports ?? [])
      }
    } catch {}
  }

  useEffect(() => {
    loadQueue()
    loadReports()
  }, [])

  async function moderate(listingId: string, action: "APPROVED" | "REJECTED") {
    const res = await fetch("/api/admin/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, action }),
    })
    if (res.ok) {
      setQueue((prev) => prev.filter((l) => l.id !== listingId))
    }
  }

  async function resolveReport(id: string) {
    setReports((prev) => prev.filter((r) => r.id !== id))
    try {
      await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "resolved" }),
      })
    } catch {}
  }

  const pendingReports = reports.filter((r) => r.status === "pending").length

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Панель модерации</h1>
          <p className="mt-1 text-sm text-zinc-500">Ручная проверка, автофильтры и жалобы пользователей.</p>
        </div>
        <AdminLogoutButton />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { value: String(queue.length), label: "В очереди" },
          { value: String(pendingReports), label: "Жалоб" },
        ].map(({ value, label }) => (
          <div key={label} className="rounded-[24px] border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-2xl font-semibold text-zinc-950">{value}</p>
            <p className="mt-0.5 text-sm text-zinc-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-2">
        <button onClick={() => setTab("queue")}
          className={"flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition " + (tab === "queue" ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200")}>
          Очередь
          {queue.length > 0 && <span className={"rounded-full px-1.5 py-0.5 text-[10px] font-bold " + (tab === "queue" ? "bg-white text-zinc-950" : "bg-zinc-950 text-white")}>{queue.length}</span>}
        </button>
        <button onClick={() => setTab("reports")}
          className={"flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition " + (tab === "reports" ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200")}>
          Жалобы
          {pendingReports > 0 && <span className={"rounded-full px-1.5 py-0.5 text-[10px] font-bold " + (tab === "reports" ? "bg-white text-zinc-950" : "bg-red-600 text-white")}>{pendingReports}</span>}
        </button>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="rounded-[28px] border border-zinc-200 bg-white shadow-sm overflow-hidden">
          {tab === "queue" ? (
            <>
              <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
                <h2 className="font-semibold text-zinc-950">Очередь на проверку</h2>
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-600">{queue.length} объявлений</span>
              </div>
              {loading ? (
                <div className="py-12 text-center text-sm text-zinc-400">Загрузка...</div>
              ) : queue.length === 0 ? (
                <div className="py-16 text-center text-zinc-400">
                  <p className="text-3xl mb-3">&#9989;</p>
                  <p className="font-medium">Очередь пуста</p>
                  <p className="mt-1 text-sm">Новые объявления появятся здесь автоматически</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {queue.map((item) => (
                    <article key={item.id} className="grid gap-4 px-5 py-4 xl:grid-cols-[80px_minmax(0,1fr)_200px] xl:items-center">
                      <div className="h-20 overflow-hidden rounded-2xl bg-zinc-100">
                        {item.images[0] ? (
                          <img src={item.images[0]} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-zinc-400 text-xs">Нет фото</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold text-zinc-950">{item.title}</p>
                          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">{item.category.nameRu}</span>
                        </div>
                        <p className="mt-0.5 text-sm text-zinc-500">{item.city} · {formatPrice(item.price)}</p>
                        <p className="mt-0.5 text-xs text-zinc-400">{item.seller.name ?? item.seller.phone}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Link href={"/listings/" + item.id} target="_blank"
                          className="rounded-xl border border-zinc-200 py-2 text-center text-xs font-semibold text-zinc-600 hover:bg-zinc-50">
                          Открыть
                        </Link>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button onClick={() => moderate(item.id, "APPROVED")}
                            className="rounded-xl bg-zinc-950 py-2 text-xs font-semibold text-white hover:bg-zinc-800">
                            Одобрить
                          </button>
                          <button onClick={() => moderate(item.id, "REJECTED")}
                            className="rounded-xl bg-red-50 py-2 text-xs font-semibold text-red-600 hover:bg-red-100">
                            Отклонить
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
                <h2 className="font-semibold text-zinc-950">Жалобы пользователей</h2>
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-600">{reports.length} всего</span>
              </div>
              {reports.length === 0 ? (
                <div className="py-16 text-center text-zinc-400">
                  <p className="text-3xl mb-3">&#128737;</p>
                  <p className="font-medium">Жалоб пока нет</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {reports.map((report) => (
                    <div key={report.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-zinc-950">
                            {report.listing?.title ?? report.listingId}
                          </p>
                          <p className="mt-0.5 text-sm font-medium text-zinc-600">{REASON_LABELS[report.reason] ?? report.reason}</p>
                          {report.comment && <p className="mt-1 text-sm text-zinc-400">&#171;{report.comment}&#187;</p>}
                          <p className="mt-0.5 text-xs text-zinc-400">
                            {new Date(report.createdAt).toLocaleDateString("ru-RU")}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {report.listing && (
                            <Link href={"/listings/" + report.listing.id} target="_blank"
                              className="rounded-xl border border-zinc-200 px-3 py-1.5 text-center text-xs font-semibold text-zinc-600 hover:bg-zinc-50">
                              Открыть
                            </Link>
                          )}
                          <button onClick={() => resolveReport(report.id)}
                            className="shrink-0 rounded-xl bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-white">
                            Обработать
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <aside className="space-y-5">
          <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-zinc-950">Автофильтры</h2>
            <div className="mt-4 space-y-2">
              {autoFilters.map((f) => (
                <label key={f.id} className="flex cursor-pointer items-start gap-3 rounded-2xl bg-zinc-50 p-3">
                  <input type="checkbox" checked={activeFilters[f.id]}
                    onChange={(e) => setActiveFilters((s) => ({ ...s, [f.id]: e.target.checked }))}
                    className="mt-0.5 h-4 w-4 accent-zinc-950"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-zinc-950">{f.title}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{f.desc}</p>
                    <span className={"mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold " + (f.level === "Высокий" ? "bg-red-50 text-red-500" : "bg-orange-50 text-orange-500")}>
                      {f.level}
                    </span>
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
