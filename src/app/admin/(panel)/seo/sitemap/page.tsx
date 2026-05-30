"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader"
import { AdminPageShell } from "@/components/admin/layout/AdminPageShell"
import { AdminStatusBadge } from "@/components/admin/ui/AdminStatusBadge"

type Summary = {
  total: number
  indexable: number
  blocked: number
  byReason: { reason: string; count: number; label: string }[]
}

type Row = {
  id: string
  title: string
  status: string
  city: string | null
  categorySlug: string
  categoryName: string
  updatedAt: string
  indexable: boolean
  reason: string | null
  reasonLabel: string
  publicPath: string
}

type ApiResponse = {
  ok?: boolean
  error?: string
  summary?: Summary
  items?: Row[]
  page?: number
  total?: number
  totalPages?: number
}

export default function AdminSitemapIndexabilityPage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [items, setItems] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "indexable" | "blocked">("blocked")
  const [reason, setReason] = useState("")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({
      page: String(page),
      filter,
    })
    if (reason) params.set("reason", reason)
    if (search.trim()) params.set("search", search.trim())
    if (status) params.set("status", status)

    try {
      const res = await fetch(`/api/admin/seo/sitemap-indexability?${params}`)
      const data: ApiResponse = await res.json()
      if (!res.ok || data.error) {
        setError(data.error ?? "Не удалось загрузить отчёт")
        return
      }
      setSummary(data.summary ?? null)
      setItems(data.items ?? [])
      setTotalPages(data.totalPages ?? 1)
    } catch {
      setError("Ошибка сети")
    } finally {
      setLoading(false)
    }
  }, [filter, page, reason, search, status])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [filter, reason, search, status])

  return (
    <div className="min-h-full bg-zinc-50">
      <AdminPageShell>
        <AdminPageHeader
          title="SEO: объявления в sitemap"
          description={
            <>
              Почему объявление не попадает в{" "}
              <a
                href="/sitemap-listings.xml"
                className="text-[#FF4F12] hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                sitemap-listings.xml
              </a>
              . В карту попадают только ACTIVE с городом и описанием от 10 символов (или заполненными
              характеристиками).
            </>
          }
          actions={
            <a
              href="https://webmaster.yandex.ru/"
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-[#FF4F12] hover:underline"
            >
              Яндекс.Вебмастер →
            </a>
          }
        />

        {summary && (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[20px] border border-zinc-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Всего</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-950">{summary.total}</p>
            </div>
            <div className="rounded-[20px] border border-emerald-200 bg-emerald-50/60 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">В sitemap</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-900">{summary.indexable}</p>
            </div>
            <div className="rounded-[20px] border border-amber-200 bg-amber-50/60 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-800">Не в sitemap</p>
              <p className="mt-1 text-2xl font-semibold text-amber-950">{summary.blocked}</p>
            </div>
          </div>
        )}

        {summary && summary.byReason.length > 0 && (
          <div className="mt-4 rounded-[20px] border border-zinc-200 bg-white p-4">
            <p className="text-sm font-semibold text-zinc-900">Причины исключения</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {summary.byReason.map((row) => (
                <button
                  key={row.reason}
                  type="button"
                  onClick={() => {
                    setFilter("blocked")
                    setReason(reason === row.reason ? "" : row.reason)
                  }}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                    reason === row.reason
                      ? "border-zinc-950 bg-zinc-950 text-white"
                      : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300"
                  }`}
                >
                  {row.label} ({row.count})
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3 rounded-[20px] border border-zinc-200 bg-white p-4 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="flex min-w-[140px] flex-col gap-1 text-xs font-medium text-zinc-600">
            Показать
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            >
              <option value="blocked">Не в sitemap</option>
              <option value="indexable">В sitemap</option>
              <option value="all">Все</option>
            </select>
          </label>
          <label className="flex min-w-[140px] flex-col gap-1 text-xs font-medium text-zinc-600">
            Статус в БД
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            >
              <option value="">Любой</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="MODERATION">MODERATION</option>
              <option value="REJECTED">REJECTED</option>
              <option value="ARCHIVED">ARCHIVED</option>
              <option value="SOLD">SOLD</option>
            </select>
          </label>
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-medium text-zinc-600">
            Поиск
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void load()}
              placeholder="Название, id, город"
              className="rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Найти
          </button>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <div className="mt-4 overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
          {loading ? (
            <p className="p-8 text-center text-sm text-zinc-500">Загрузка…</p>
          ) : items.length === 0 ? (
            <p className="p-8 text-center text-sm text-zinc-500">Нет объявлений по фильтру</p>
          ) : (
            <>
            <div className="divide-y divide-zinc-100 lg:hidden">
                {items.map((row) => (
                  <article key={row.id} className="space-y-3 px-4 py-4">
                    <p className="font-medium text-zinc-950">{row.title}</p>
                    <p className="text-xs text-zinc-500">
                      {row.categoryName} · {row.city?.trim() || "без города"}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <AdminStatusBadge variant="listing" status={row.status} />
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          row.indexable
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-800"
                        }`}
                      >
                        {row.reasonLabel}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <Link
                        href={`/admin/listings/${row.id}`}
                        className="font-semibold text-[hsl(var(--nashlo-orange))] hover:underline"
                      >
                        В админке
                      </Link>
                      {row.indexable && (
                        <a
                          href={row.publicPath}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-zinc-600 hover:underline"
                        >
                          На сайте ↗
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>

              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-zinc-100 bg-zinc-50/80 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    <tr>
                      <th className="px-4 py-3">Объявление</th>
                      <th className="px-4 py-3">Статус</th>
                      <th className="px-4 py-3">Город</th>
                      <th className="px-4 py-3">Sitemap</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {items.map((row) => (
                      <tr key={row.id} className="hover:bg-zinc-50/50">
                        <td className="px-4 py-3">
                          <p className="line-clamp-2 font-medium text-zinc-950">{row.title}</p>
                          <p className="mt-0.5 text-xs text-zinc-500">
                            {row.categoryName} · {row.id.slice(0, 10)}…
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <AdminStatusBadge variant="listing" status={row.status} />
                        </td>
                        <td className="px-4 py-3 text-zinc-700">{row.city?.trim() || "—"}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-semibold ${
                              row.indexable
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-800"
                            }`}
                          >
                            {row.reasonLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/admin/listings/${row.id}`}
                            className="text-xs font-semibold text-[hsl(var(--nashlo-orange))] hover:underline"
                          >
                            В админке
                          </Link>
                          {row.indexable && (
                            <>
                              {" · "}
                              <a
                                href={row.publicPath}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-semibold text-zinc-600 hover:underline"
                              >
                                На сайте
                              </a>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Назад
            </button>
            <span className="text-sm text-zinc-600">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Вперёд
            </button>
          </div>
        )}
      </AdminPageShell>
    </div>
  )
}
