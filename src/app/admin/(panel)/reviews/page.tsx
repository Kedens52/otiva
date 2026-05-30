"use client"

import { useEffect, useState, useCallback } from "react"
import { ChevronDown, Search, Star, AlertTriangle, Eye, EyeOff, Trash2, RotateCcw, CheckCircle } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader"
import { AdminPageShell } from "@/components/admin/layout/AdminPageShell"

type AdminReview = {
  id: string
  rating: number
  text: string | null
  tags: string[]
  reviewModerationState: string
  isHidden: boolean
  isDeleted: boolean
  reportCount: number
  riskScore: number
  moderationNote: string | null
  createdAt: string
  author: { id: string; name: string | null; avatar: string | null }
  targetUser: { id: string; name: string | null; avatar: string | null }
  listing: { id: string; title: string } | null
  reports: Array<{
    reason: string
    comment: string | null
    createdAt: string
    reporter: { id: string; name: string | null }
  }>
}

const TABS = [
  { key: "PENDING", label: "На модерации" },
  { key: "PUBLISHED", label: "Опубликованные" },
  { key: "REPORTED", label: "С жалобами" },
  { key: "HIDDEN", label: "Скрытые" },
  { key: "REJECTED", label: "Отклонённые" },
]

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <Star key={s} className={`h-3 w-3 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-zinc-200 fill-zinc-200"}`} />
      ))}
    </span>
  )
}

function ModerationNoteModal({
  reviewId,
  action,
  onDone,
  onClose,
}: {
  reviewId: string
  action: string
  onDone: (id: string) => void
  onClose: () => void
}) {
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, moderationNote: note.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Ошибка"); return }
      onDone(reviewId)
      onClose()
    } catch { setError("Ошибка сети") }
    finally { setLoading(false) }
  }

  const actionLabel: Record<string, string> = {
    publish: "Опубликовать", hide: "Скрыть", reject: "Отклонить",
    delete: "Удалить", restore: "Восстановить",
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-zinc-950 mb-3">{actionLabel[action] ?? action}</h3>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Причина (необязательно)"
          rows={3}
          maxLength={500}
          className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-zinc-400"
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        <div className="mt-3 flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="rounded-xl px-3 py-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition">Отмена</button>
          <button type="button" onClick={submit} disabled={loading} className="rounded-xl bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 transition disabled:opacity-50">
            {loading ? "..." : "Подтвердить"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminReviewsPage() {
  const [tab, setTab] = useState("PENDING")
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [expanded, setExpanded] = useState<string | null>(null)
  const [modal, setModal] = useState<{ reviewId: string; action: string } | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ status: tab, page: String(page), limit: "30" })
    if (search) params.set("search", search)
    fetch(`/api/admin/reviews?${params}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.reviews) { setReviews(d.reviews); setTotal(d.total ?? 0) }
      })
      .finally(() => setLoading(false))
  }, [tab, page, search])

  useEffect(() => { setPage(1) }, [tab, search])
  useEffect(() => { load() }, [load])

  function handleDone(id: string) {
    setReviews((prev) => prev.filter((r) => r.id !== id))
  }

  function fmt(iso: string) {
    try { return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" }) }
    catch { return "" }
  }

  return (
    <AdminPageShell className="py-8">
      <AdminPageHeader
        title="Модерация отзывов"
        description={
          <>
            Управление отзывами пользователей · всего в категории:{" "}
            <span className="font-semibold text-zinc-700">{total}</span>
          </>
        }
      />

      <div className="mt-6 space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                tab === t.key
                  ? "bg-zinc-950 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); setSearch(searchInput) }}
          className="flex flex-col gap-2 sm:flex-row sm:items-center"
        >
          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Поиск по автору, получателю или тексту"
              className="h-11 w-full rounded-2xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-[hsl(var(--nashlo-orange))]"
            />
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="submit"
              className="h-11 rounded-2xl bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Найти
            </button>
            {search ? (
              <button
                type="button"
                onClick={() => { setSearch(""); setSearchInput("") }}
                className="h-11 rounded-2xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-200"
              >
                Сбросить
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <div className="mt-6 overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
        {loading ? (
          <div className="divide-y divide-zinc-100">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse bg-zinc-50" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-6 py-16 text-center">
            <p className="text-sm font-medium text-zinc-500">Нет отзывов в этой категории</p>
            <p className="mt-1 text-xs text-zinc-400">
              Выберите другой фильтр или измените поисковый запрос
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
          {reviews.map((r) => (
            <div key={r.id}>
              <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:px-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-sm font-medium text-zinc-900">{r.author.name ?? "Аноним"}</span>
                    <span className="text-xs text-zinc-400">→</span>
                    <span className="text-sm text-zinc-600">{r.targetUser.name ?? "Аноним"}</span>
                    <StarRow rating={r.rating} />
                    <span className="text-xs text-zinc-400">{fmt(r.createdAt)}</span>
                    {r.riskScore > 30 && (
                      <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${r.riskScore >= 60 ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}>
                        <AlertTriangle className="h-2.5 w-2.5" />risk {r.riskScore}
                      </span>
                    )}
                    {r.reportCount > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                        {r.reportCount} жал.
                      </span>
                    )}
                  </div>
                  {r.text && <p className="mt-1 text-sm text-zinc-600 line-clamp-2">{r.text}</p>}
                  {r.listing && <p className="mt-0.5 text-xs text-zinc-400 truncate">Объявление: {r.listing.title}</p>}
                  {r.moderationNote && (
                    <p className="mt-1 text-xs text-amber-600 italic">Заметка: {r.moderationNote}</p>
                  )}
                </div>

                <div className="flex flex-row flex-wrap gap-2 sm:max-w-[4.5rem] sm:shrink-0 sm:flex-col sm:gap-1.5">
                  {/* Action buttons */}
                  {!r.isDeleted && (
                    <>
                      {r.reviewModerationState !== "PUBLISHED" && (
                        <button onClick={() => setModal({ reviewId: r.id, action: "publish" })} title="Опубликовать" className="flex h-7 w-7 items-center justify-center rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition">
                          <CheckCircle className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {!r.isHidden && (
                        <button onClick={() => setModal({ reviewId: r.id, action: "hide" })} title="Скрыть" className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 transition">
                          <EyeOff className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {r.reviewModerationState !== "REJECTED" && (
                        <button onClick={() => setModal({ reviewId: r.id, action: "reject" })} title="Отклонить" className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 transition">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button onClick={() => setModal({ reviewId: r.id, action: "delete" })} title="Удалить" className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                  {r.isDeleted && (
                    <button onClick={() => setModal({ reviewId: r.id, action: "restore" })} title="Восстановить" className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 transition">
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {/* Expand */}
                  <button
                    onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-100 text-zinc-400 hover:border-zinc-200 transition"
                  >
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded === r.id ? "rotate-180" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Expanded: reports */}
              {expanded === r.id && r.reports.length > 0 && (
                <div className="border-t border-zinc-100 bg-zinc-50/80 px-5 pb-4 pt-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Жалобы ({r.reports.length})
                  </p>
                  <div className="space-y-2">
                    {r.reports.map((rep, i) => (
                      <div key={i} className="rounded-xl border border-zinc-100 bg-white px-3 py-2 text-xs">
                        <span className="font-medium text-zinc-700">{rep.reporter.name ?? "?"}</span>
                        <span className="mx-1 text-zinc-400">·</span>
                        <span className="text-zinc-600">{rep.reason}</span>
                        {rep.comment && <p className="mt-0.5 italic text-zinc-500">{rep.comment}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          </div>
        )}
      </div>

      {total > 30 && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {page > 1 && (
            <button
              type="button"
              onClick={() => setPage((p) => p - 1)}
              className="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200"
            >
              ← Назад
            </button>
          )}
          <span className="px-3 py-2 text-sm text-zinc-500">
            Стр. {page} из {Math.ceil(total / 30)}
          </span>
          {page * 30 < total && (
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              className="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200"
            >
              Далее →
            </button>
          )}
        </div>
      )}

      {modal && (
        <ModerationNoteModal
          reviewId={modal.reviewId}
          action={modal.action}
          onDone={handleDone}
          onClose={() => setModal(null)}
        />
      )}
    </AdminPageShell>
  )
}
