"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { formatPrice, imageToneForCategory } from "@/lib/listing-types"
import { moderationReasonByCode } from "@/lib/moderation-reasons"
import { CabinetPage } from "@/components/profile/CabinetPage"
import { EmptyState } from "@/components/profile/EmptyState"

type Listing = {
  id: string; title: string; price: number
  city: string | null; status: string; createdAt: string
  images: string[]; views: number; uniqueViews?: number; rejectionReason?: string | null
  moderationReasonCode?: string | null
  returnedForRevision?: boolean
  autoApproved?: boolean; isPromoted?: boolean; promotedUntil?: string | null
  category: { slug: string; nameRu: string }
  _count?: { favorites: number }
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Активно", MODERATION: "На проверке",
  ARCHIVED: "Снято", SOLD: "Продано", REJECTED: "Отклонено",
}
const STATUS_COLOR: Record<string, string> = {
  ACTIVE:     "bg-emerald-50 text-emerald-700 border-emerald-200",
  MODERATION: "bg-amber-50 text-amber-700 border-amber-200",
  ARCHIVED:   "bg-zinc-100 text-zinc-500 border-zinc-200",
  SOLD:       "bg-blue-50 text-blue-600 border-blue-200",
  REJECTED:   "bg-red-50 text-red-600 border-red-200",
}

type Tab = "all" | "active" | "moderation" | "archived" | "rejected"
const TABS: { key: Tab; label: string }[] = [
  { key: "all",        label: "Все" },
  { key: "active",     label: "Активные" },
  { key: "moderation", label: "На проверке" },
  { key: "archived",   label: "Архив" },
  { key: "rejected",   label: "Отклонённые" },
]

export default function MyListingsPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>("all")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState("")
  const [statusPending, setStatusPending] = useState<string | null>(null)
  const [appealId, setAppealId] = useState<string | null>(null)
  const [appealText, setAppealText] = useState("")
  const [appealPending, setAppealPending] = useState(false)
  const [query, setQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")

  useEffect(() => {
    async function load() {
      const lRes = await fetch("/api/my-listings")
      if (lRes.ok) {
        const data = await lRes.json()
        setListings(data.listings ?? [])
      }
      setLoading(false)
    }
    load()
  }, [])

  async function submitAppeal() {
    if (!appealId || appealText.trim().length < 10) return
    setAppealPending(true)
    try {
      const res = await fetch(`/api/listings/${appealId}/appeal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: appealText.trim() }),
      })
      if (res.ok) {
        setAppealId(null)
        setAppealText("")
      }
    } finally {
      setAppealPending(false)
    }
  }

  async function updateStatus(id: string, status: "ARCHIVED" | "ACTIVE") {
    setStatusPending(id)
    const res = await fetch(`/api/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (res.ok) setListings((prev) => prev.map((l) => l.id === id ? { ...l, status } : l))
    setStatusPending(null)
  }

  async function deleteListing(id: string) {
    setDeletingId(id)
    setDeleteError("")
    const res = await fetch(`/api/listings/${id}`, { method: "DELETE" })
    if (res.ok) {
      setListings((prev) => prev.filter((l) => l.id !== id))
      setConfirmDeleteId(null)
    } else {
      setDeleteError("Не удалось удалить. Попробуйте ещё раз.")
    }
    setDeletingId(null)
  }

  const categories = Array.from(
    new Map(listings.map((l) => [l.category.slug, l.category.nameRu])).entries(),
  )

  const filtered = listings.filter((l) => {
    const matchesTab =
      tab === "all" ||
      (tab === "active"     && l.status === "ACTIVE") ||
      (tab === "moderation" && l.status === "MODERATION") ||
      (tab === "archived"   && (l.status === "ARCHIVED" || l.status === "SOLD")) ||
      (tab === "rejected"   && l.status === "REJECTED")
    const matchesQuery    = !query.trim() || l.title.toLowerCase().includes(query.trim().toLowerCase())
    const matchesCategory = !categoryFilter || l.category.slug === categoryFilter
    return matchesTab && matchesQuery && matchesCategory
  })

  const counts: Record<Tab, number> = {
    all:        listings.length,
    active:     listings.filter((l) => l.status === "ACTIVE").length,
    moderation: listings.filter((l) => l.status === "MODERATION").length,
    archived:   listings.filter((l) => l.status === "ARCHIVED" || l.status === "SOLD").length,
    rejected:   listings.filter((l) => l.status === "REJECTED").length,
  }

  const listingsCountLabel =
    listings.length === 0
      ? "Пока нет объявлений"
      : `${listings.length} ${listings.length === 1 ? "объявление" : listings.length < 5 ? "объявления" : "объявлений"}`
  const listingsLabel = `То, что вы продаёте · ${listingsCountLabel}`

  return (
    <div className="min-w-0 pb-6 lg:pb-10">

      {/* ── Delete confirm modal ── */}
      {confirmDeleteId && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-[env(safe-area-inset-bottom)] sm:items-center sm:p-0"
          onClick={() => { setConfirmDeleteId(null); setDeleteError("") }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-sm rounded-t-[32px] bg-white p-6 shadow-2xl sm:rounded-[32px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-200 sm:hidden" />
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-2xl">🗑️</div>
            <h2 className="mt-3 text-lg font-semibold text-zinc-950">Удалить объявление?</h2>
            <p className="mt-1.5 text-sm text-zinc-500">
              «{listings.find((l) => l.id === confirmDeleteId)?.title}»
              <br />Это действие нельзя отменить.
            </p>
            {deleteError && (
              <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{deleteError}</p>
            )}
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => { setConfirmDeleteId(null); setDeleteError("") }}
                className="flex-1 rounded-2xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50"
              >
                Отмена
              </button>
              <button
                onClick={() => deleteListing(confirmDeleteId!)}
                disabled={deletingId === confirmDeleteId}
                className="flex-1 rounded-2xl bg-red-600 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {deletingId === confirmDeleteId ? "Удаляем..." : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      )}

      <CabinetPage
        title="Мои объявления"
        subtitle={listingsLabel}
        action={
          <Link
            href="/create"
            className="inline-flex shrink-0 items-center rounded-[12px] bg-[hsl(var(--nashlo-orange))] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[hsl(var(--nashlo-orange)/0.92)]"
          >
            + Разместить объявление
          </Link>
        }
      >
        <div className="rounded-xl bg-zinc-100 p-1">
          <div className="-mx-0.5 flex overflow-x-auto px-0.5 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-1">
              {TABS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition ${
                    tab === key
                      ? "bg-white text-zinc-950 shadow-sm"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  {label}
                  {counts[key] > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                        tab === key ? "bg-zinc-100 text-zinc-600" : "bg-zinc-200/80 text-zinc-600"
                      }`}
                    >
                      {counts[key]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <div className="flex h-11 w-full min-w-0 items-center overflow-hidden rounded-[14px] border border-zinc-200 bg-zinc-50 sm:min-w-[220px] sm:flex-1">
            <svg className="ml-3 h-4 w-4 shrink-0 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.3-4.3M11 19A8 8 0 1 0 11 3a8 8 0 0 0 0 16z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по моим объявлениям"
              className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-zinc-400"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-11 w-full rounded-[14px] border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-700 outline-none transition focus:border-[hsl(var(--nashlo-orange)/0.45)] sm:w-auto"
          >
            <option value="">Все категории</option>
            {categories.map(([slug, label]) => (
              <option key={slug} value={slug}>{label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => { setQuery(""); setCategoryFilter("") }}
            className="h-11 w-full rounded-[14px] border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 sm:w-auto"
          >
            Сбросить
          </button>
        </div>

        {loading ? (
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-zinc-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon="📬"
              title={tab === "all" ? "Объявлений пока нет" : "В этой вкладке пусто"}
              description={
                tab === "all"
                  ? "Разместите первое объявление — это бесплатно."
                  : "Здесь появятся объявления с соответствующим статусом."
              }
              actionLabel={tab === "all" ? "Подать объявление" : undefined}
              actionHref={tab === "all" ? "/create" : undefined}
            />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {filtered.map((l) => {
              const thumb = l.images?.[0]
              const tone  = imageToneForCategory(l.category.slug)
              return (
                <div
                  key={l.id}
                  className="group grid grid-cols-[80px_minmax(0,1fr)] gap-3 rounded-2xl border border-zinc-200 bg-white p-3 transition hover:border-zinc-300 sm:grid-cols-[96px_minmax(0,1fr)] sm:gap-4 sm:p-4"
                >
                  <Link
                    href={`/listings/${l.id}`}
                    className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br ${tone} sm:h-24 sm:w-24`}
                  >
                    {thumb ? (
                      <img
                        src={thumb}
                        alt=""
                        className="h-full w-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl">📦</div>
                    )}
                  </Link>

                  <div className="min-w-0">
                    <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                      <Link
                        href={`/listings/${l.id}`}
                        className="line-clamp-2 text-[13px] font-semibold leading-snug text-zinc-950 hover:underline underline-offset-4 sm:text-sm"
                      >
                        {l.title}
                      </Link>
                      <div className="flex flex-wrap gap-1.5">
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOR[l.status] ?? "bg-zinc-100 text-zinc-500 border-zinc-200"}`}
                        >
                          {STATUS_LABEL[l.status] ?? l.status}
                        </span>
                        {l.isPromoted && (
                          <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-[hsl(var(--nashlo-orange))]">
                            Продвигается
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="mt-0.5 text-xs text-zinc-500">{l.city ?? "—"} · {l.category.nameRu}</p>
                    <p className="mt-1 text-base font-semibold text-zinc-950">{formatPrice(l.price)}</p>

                    {l.status === "MODERATION" && l.rejectionReason && (
                      <div className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
                        <p className="font-semibold">Нужно исправить</p>
                        <p className="mt-0.5">{l.rejectionReason}</p>
                        {moderationReasonByCode(l.moderationReasonCode)?.hint && (
                          <p className="mt-0.5 text-amber-800/80">{moderationReasonByCode(l.moderationReasonCode)!.hint}</p>
                        )}
                      </div>
                    )}
                    {l.status === "REJECTED" && l.rejectionReason && (
                      <div className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-900">
                        <p className="font-semibold">Объявление отклонено</p>
                        {moderationReasonByCode(l.moderationReasonCode)?.label && (
                          <p className="mt-0.5 text-red-800/80">
                            Код: {moderationReasonByCode(l.moderationReasonCode)!.label}
                          </p>
                        )}
                        <p className="mt-0.5">{l.rejectionReason}</p>
                      </div>
                    )}

                    <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                      <span>{new Date(l.createdAt).toLocaleDateString("ru-RU")}</span>
                      <span>👁 {l.views ?? 0}</span>
                      {l.uniqueViews != null && <span>{l.uniqueViews} уник.</span>}
                      <span>♡ {l._count?.favorites ?? 0}</span>
                    </div>

                    <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:gap-2 sm:overflow-visible sm:pb-0">
                      {l.status === "ACTIVE" && (
                        <button
                          onClick={() => updateStatus(l.id, "ARCHIVED")}
                          disabled={statusPending === l.id}
                          className="shrink-0 rounded-[10px] border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50"
                        >
                          Снять
                        </button>
                      )}
                      {(l.status === "ARCHIVED" || l.status === "REJECTED") && (
                        <button
                          onClick={() => updateStatus(l.id, "ACTIVE")}
                          disabled={statusPending === l.id}
                          className="shrink-0 rounded-[10px] bg-[hsl(var(--nashlo-orange))] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[hsl(var(--nashlo-orange)/0.92)] disabled:opacity-50"
                        >
                          Активировать
                        </button>
                      )}
                      {(l.status === "ACTIVE" || l.status === "ARCHIVED" || l.status === "MODERATION" || l.status === "REJECTED") && (
                        <Link
                          href={`/my-listings/${l.id}/edit`}
                          className="shrink-0 rounded-[10px] border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50"
                        >
                          Изменить
                        </Link>
                      )}
                      {(l.status === "MODERATION" || l.status === "REJECTED") && l.rejectionReason && (
                        <button
                          type="button"
                          onClick={() => { setAppealId(l.id); setAppealText("") }}
                          className="shrink-0 rounded-[10px] border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-100"
                        >
                          Оспорить
                        </button>
                      )}
                      <Link
                        href="/profile/promotion"
                        className="shrink-0 rounded-[10px] border border-orange-200 px-3 py-1.5 text-xs font-semibold text-[hsl(var(--nashlo-orange))] transition hover:bg-orange-50"
                      >
                        Продвижение
                      </Link>
                      <button
                        onClick={() => { setConfirmDeleteId(l.id); setDeleteError("") }}
                        className="shrink-0 rounded-[10px] border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CabinetPage>

      {/* ── Appeal modal ── */}
      {appealId && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-[env(safe-area-inset-bottom)] sm:items-center sm:p-0"
          onClick={() => { if (!appealPending) setAppealId(null) }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md rounded-t-[32px] bg-white p-6 shadow-2xl sm:rounded-[32px]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-zinc-950">Оспорить решение</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Кратко опишите, почему считаете решение ошибочным (не менее 10 символов).
            </p>
            <textarea
              className="mt-4 w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-sm outline-none focus:border-zinc-400"
              rows={4}
              value={appealText}
              onChange={(e) => setAppealText(e.target.value)}
              maxLength={2000}
            />
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                disabled={appealPending}
                onClick={() => setAppealId(null)}
                className="flex-1 rounded-2xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={appealPending || appealText.trim().length < 10}
                onClick={() => void submitAppeal()}
                className="flex-1 rounded-2xl bg-[hsl(var(--nashlo-orange))] py-3 text-sm font-semibold text-white transition hover:bg-[hsl(var(--nashlo-orange)/0.92)] disabled:opacity-40"
              >
                {appealPending ? "Отправка…" : "Отправить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
