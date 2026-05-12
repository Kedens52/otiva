"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatPrice, imageToneForCategory } from "@/lib/listing-types"
import { moderationReasonByCode } from "@/lib/moderation-reasons"

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
  const router = useRouter()
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

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/auth/me")
      if (!res.ok) { router.push("/login?from=/my-listings"); return }
      const lRes = await fetch("/api/my-listings")
      if (lRes.ok) {
        const data = await lRes.json()
        setListings(data.listings ?? [])
      }
      setLoading(false)
    }
    load()
  }, [router])

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

  const filtered = listings.filter((l) => {
    if (tab === "all") return true
    if (tab === "active") return l.status === "ACTIVE"
    if (tab === "moderation") return l.status === "MODERATION"
    if (tab === "archived") return l.status === "ARCHIVED" || l.status === "SOLD"
    if (tab === "rejected") return l.status === "REJECTED"
    return true
  })

  const counts: Record<Tab, number> = {
    all:        listings.length,
    active:     listings.filter((l) => l.status === "ACTIVE").length,
    moderation: listings.filter((l) => l.status === "MODERATION").length,
    archived:   listings.filter((l) => l.status === "ARCHIVED" || l.status === "SOLD").length,
    rejected:   listings.filter((l) => l.status === "REJECTED").length,
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 pb-28 lg:pb-10">

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-[env(safe-area-inset-bottom)] sm:items-center sm:p-0"
          onClick={() => { setConfirmDeleteId(null); setDeleteError("") }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm rounded-t-[32px] bg-white p-6 shadow-2xl sm:rounded-[32px]"
            onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-200 sm:hidden" />
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-2xl">&#128465;</div>
            <h2 className="mt-3 text-xl font-semibold text-zinc-950">Удалить объявление?</h2>
            <p className="mt-1.5 text-sm text-zinc-500">
              &#171;{listings.find((l) => l.id === confirmDeleteId)?.title}&#187;
              <br />Это действие нельзя отменить.
            </p>
            {deleteError && (
              <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{deleteError}</p>
            )}
            <div className="mt-5 flex gap-3">
              <button onClick={() => { setConfirmDeleteId(null); setDeleteError("") }}
                className="flex-1 rounded-2xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 transition">
                Отмена
              </button>
              <button onClick={() => deleteListing(confirmDeleteId!)}
                disabled={deletingId === confirmDeleteId}
                className="flex-1 rounded-2xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition">
                {deletingId === confirmDeleteId ? "Удаляем..." : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Мои объявления</h1>
          <p className="mt-1 text-sm text-zinc-500">{listings.length} объявлений</p>
        </div>
        <Link href="/create"
          className="rounded-2xl bg-[hsl(var(--nashlo-orange))] px-5 py-3 text-sm font-semibold text-white hover:opacity-90 transition">
          + Новое
        </Link>
      </div>

      <div className="mt-6 flex gap-1 overflow-x-auto rounded-2xl bg-zinc-100 p-1 scrollbar-none">
        {TABS.filter((t) => counts[t.key] > 0 || t.key === "all").map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={"flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition " +
              (tab === t.key ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-700")}>
            {t.label}
            {counts[t.key] > 0 && (
              <span className={"rounded-full px-1.5 py-0.5 text-[10px] font-bold " +
                (tab === t.key ? "bg-zinc-100 text-zinc-600" : "bg-zinc-200 text-zinc-500")}>
                {counts[t.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-4 space-y-3">
          {[1,2,3].map((i) => <div key={i} className="h-28 rounded-2xl bg-zinc-100 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-[28px] border border-zinc-200 bg-white py-16 text-center">
          <p className="text-4xl">&#128237;</p>
          <p className="mt-4 text-xl font-semibold text-zinc-950">
            {tab === "all" ? "Объявлений пока нет" : "В этой вкладке пусто"}
          </p>
          {tab === "all" && (
            <Link href="/create" className="mt-6 rounded-2xl bg-zinc-950 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800">
              Подать объявление
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {filtered.map((l) => {
            const thumb = l.images?.[0]
            const tone = imageToneForCategory(l.category.slug)
            return (
              <div key={l.id} className="flex gap-4 rounded-[24px] border border-zinc-200 bg-white p-4 shadow-sm">
                <Link href={`/listings/${l.id}`}
                  className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br ${tone} sm:h-24 sm:w-24`}>
                  {thumb
                    ? <img src={thumb} alt="" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
                    : <div className="flex h-full w-full items-center justify-center text-2xl">&#128230;</div>
                  }
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <Link href={`/listings/${l.id}`} className="font-semibold text-zinc-950 hover:underline line-clamp-1">
                      {l.title}
                    </Link>
                    <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOR[l.status] ?? "bg-zinc-100 text-zinc-500 border-zinc-200"}`}>
                      {STATUS_LABEL[l.status] ?? l.status}
                    </span>
                    {l.isPromoted && (
                      <span className="shrink-0 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-[hsl(var(--nashlo-orange))]">
                        Продвигается
                      </span>
                    )}
                  </div>

                  <p className="mt-0.5 text-sm text-zinc-500">{l.city ?? "—"} · {l.category.nameRu}</p>
                  <p className="mt-0.5 text-base font-bold text-zinc-950">{formatPrice(l.price)}</p>
                  {l.status === "MODERATION" && l.rejectionReason && (
                    <div className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
                      <p className="font-semibold">Нужно исправить</p>
                      <p className="mt-1">{l.rejectionReason}</p>
                      {moderationReasonByCode(l.moderationReasonCode)?.hint && (
                        <p className="mt-1 text-amber-800/90">{moderationReasonByCode(l.moderationReasonCode)!.hint}</p>
                      )}
                    </div>
                  )}
                  {l.status === "REJECTED" && l.rejectionReason && (
                    <div className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-900">
                      <p className="font-semibold">Объявление отклонено</p>
                      {moderationReasonByCode(l.moderationReasonCode)?.label && (
                        <p className="mt-0.5 text-red-800/90">
                          Код: {moderationReasonByCode(l.moderationReasonCode)!.label}
                        </p>
                      )}
                      <p className="mt-1">{l.rejectionReason}</p>
                      {moderationReasonByCode(l.moderationReasonCode)?.hint && (
                        <p className="mt-1 text-red-800/90">{moderationReasonByCode(l.moderationReasonCode)!.hint}</p>
                      )}
                    </div>
                  )}
                  {l.autoApproved && l.status === "ACTIVE" && (
                    <p className="mt-2 text-xs font-medium text-emerald-600">Автоматически проверено</p>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                    <span>{new Date(l.createdAt).toLocaleDateString("ru-RU")}</span>
                    <span>&#128065; {l.views ?? 0}</span>
                    <span>{l.uniqueViews ?? 0} уник.</span>
                    <span>&#9825; {l._count?.favorites ?? 0} в избранном</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {l.status === "ACTIVE" && (
                      <button onClick={() => updateStatus(l.id, "ARCHIVED")}
                        disabled={statusPending === l.id}
                        className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 transition">
                        Снять
                      </button>
                    )}
                    {(l.status === "MODERATION" || l.status === "REJECTED") && (
                      <Link href={`/my-listings/${l.id}/edit`}
                        className="rounded-xl bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 transition">
                        Исправить объявление
                      </Link>
                    )}
                    {(l.status === "MODERATION" || l.status === "REJECTED") && l.rejectionReason && (
                      <button
                        type="button"
                        onClick={() => { setAppealId(l.id); setAppealText("") }}
                        className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition">
                        Оспорить решение
                      </button>
                    )}
                    {(l.status === "ARCHIVED" || l.status === "REJECTED") && (
                      <button onClick={() => updateStatus(l.id, "ACTIVE")}
                        disabled={statusPending === l.id}
                        className="rounded-xl bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 transition">
                        Активировать
                      </button>
                    )}
                    {(l.status === "ACTIVE" || l.status === "ARCHIVED" || l.status === "SOLD") && (
                    <Link href={`/my-listings/${l.id}/edit`}
                      className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition">
                      Изменить
                    </Link>
                    )}
                    <Link href="/profile"
                      className="rounded-xl border border-orange-200 px-3 py-1.5 text-xs font-semibold text-[hsl(var(--nashlo-orange))] hover:bg-orange-50 transition">
                      Продвижение
                    </Link>
                    <button
                      onClick={() => { setConfirmDeleteId(l.id); setDeleteError("") }}
                      className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 transition">
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
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
            <p className="mt-1 text-sm text-zinc-500">Кратко опишите, почему считаете решение ошибочным (не менее 10 символов).</p>
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
                className="flex-1 rounded-2xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={appealPending || appealText.trim().length < 10}
                onClick={() => void submitAppeal()}
                className="flex-1 rounded-2xl bg-zinc-950 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-40"
              >
                {appealPending ? "Отправка…" : "Отправить"}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  )
}
