"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton"
import { formatPrice } from "@/lib/listing-types"
import { getAdminCsrfFromDocument } from "@/lib/admin/csrf-client"
import { ListingModerationDecisionModal } from "@/components/admin/ListingModerationDecisionModal"
import { ContentIncidentsPanel } from "@/components/admin/ContentIncidentsPanel"
import type { ModerationReasonCode } from "@/lib/moderation-reasons"
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader"
import { AdminPageShell } from "@/components/admin/layout/AdminPageShell"

type QueueItem = {
  id: string
  title: string
  price: number
  city: string | null
  images: string[]
  category: { slug: string; nameRu: string }
  seller: { id: string; name: string | null; phone: string }
  createdAt: string
  moderationReasonCode?: string | null
  priceInsight?: { status: string; min: number | null; max: number | null; sampleSize: number; reason: string | null } | null
}

type Report = {
  id: string
  listingId: string | null
  listing: { id: string; title: string } | null
  targetUserId: string | null
  targetUser: { id: string; name: string | null } | null
  reason: string
  comment: string
  status: string
  createdAt: string
}

type ReviewQueueItem = {
  id: string
  rating: number
  text: string | null
  reviewModerationState: string
  isHidden: boolean
  createdAt: string
  author: { id: string; name: string | null; phone: string | null }
  targetUser: { id: string; name: string | null; phone: string | null }
  listing: { id: string; title: string } | null
}

type ReportTab = "queue" | "reports" | "reviews" | "incidents"

const REASON_LABELS: Record<string, string> = {
  fraud:          "Мошенничество или обман",
  prohibited:     "Запрещённый товар",
  spam:           "Спам",
  duplicate:      "Дубль",
  wrong_category: "Не та категория",
  wrong_price:    "Неверная цена",
  false_info:     "Ложная информация",
  user_abuse:     "Оскорбления / угрозы",
  appeal:         "Оспаривание модерации",
  appeal_moderation: "Оспаривание модерации",
  other:          "Другое",
}

const autoFilters = [
  { id: "contacts",   title: "Контакты в описании",  desc: "Телефоны, мессенджеры и внешние ссылки", level: "Высокий" },
  { id: "price",      title: "Подозрительная цена",   desc: "Цена сильно ниже рынка по категории",    level: "Средний" },
  { id: "duplicates", title: "Дубликаты объявлений",  desc: "Повтор названия, фото или описания",     level: "Высокий" },
  { id: "words",      title: "Стоп-слова",            desc: "Запрещённые товары, обещания и спам",    level: "Средний" },
]

// ── Main page ──────────────────────────────────────────────────────────────────
export default function AdminModerationPage() {
  const [tab, setTab]       = useState<ReportTab>("queue")
  const [queue, setQueue]   = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<Report[]>([])
  const [reviewItems, setReviewItems] = useState<ReviewQueueItem[]>([])
  const [reviewLoading, setReviewLoading] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<QueueItem | null>(null)
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

  async function loadReviewQueue() {
    setReviewLoading(true)
    try {
      const res = await fetch("/api/admin/review-queue")
      if (res.ok) {
        const data = await res.json()
        setReviewItems(data.items ?? [])
      }
    } catch {}
    setReviewLoading(false)
  }

  async function publishReview(id: string) {
    const res = await fetch(`/api/admin/reviews/${id}/publish`, {
      method: "POST",
      headers: { "X-CSRF-Token": getAdminCsrfFromDocument() },
    })
    if (res.ok) void loadReviewQueue()
  }

  async function hideReviewAdmin(id: string) {
    const res = await fetch(`/api/admin/reviews/${id}/hide`, {
      method: "POST",
      headers: { "X-CSRF-Token": getAdminCsrfFromDocument() },
    })
    if (res.ok) void loadReviewQueue()
  }

  async function restoreReview(id: string) {
    const res = await fetch(`/api/admin/reviews/${id}/restore`, {
      method: "POST",
      headers: { "X-CSRF-Token": getAdminCsrfFromDocument() },
    })
    if (res.ok) void loadReviewQueue()
  }

  useEffect(() => {
    loadQueue()
    loadReports()
    loadReviewQueue()
  }, [])

  async function moderate(
    listingId: string,
    action: "APPROVED" | "REJECTED" | "NEEDS_REVISION",
    reason?: string,
    moderationReasonCode?: ModerationReasonCode,
  ) {
    const res = await fetch("/api/admin/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": getAdminCsrfFromDocument() },
      body: JSON.stringify({
        listingId,
        action,
        reason,
        ...(moderationReasonCode ? { moderationReasonCode } : {}),
      }),
    })
    if (res.ok) {
      setQueue((prev) => prev.filter((l) => l.id !== listingId))
      setRejectTarget(null)
    }
  }

  async function resolveReport(id: string) {
    setReports((prev) => prev.filter((r) => r.id !== id))
    try {
      await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getAdminCsrfFromDocument() },
        body: JSON.stringify({ id, status: "resolved" }),
      })
    } catch {}
  }

  const pendingReports = reports.filter((r) => r.status === "pending").length

  return (
    <>
      {rejectTarget && (
        <ListingModerationDecisionModal
          listingTitle={rejectTarget.title}
          onRevision={(reason, code) => moderate(rejectTarget.id, "NEEDS_REVISION", reason, code)}
          onFinalReject={(reason, code) => moderate(rejectTarget.id, "REJECTED", reason, code)}
          onCancel={() => setRejectTarget(null)}
        />
      )}

      <main>
        <AdminPageShell>
          <AdminPageHeader
            title="Модерация"
            description="Ручная проверка, автофильтры и жалобы пользователей."
            actions={<AdminLogoutButton />}
          />

          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { value: String(queue.length), label: "В очереди" },
              { value: String(pendingReports), label: "Жалоб" },
              { value: String(reviewItems.length), label: "Отзывы" },
            ].map(({ value, label }) => (
              <div key={label} className="rounded-[24px] border border-zinc-200 bg-white p-4 shadow-sm">
                <p className="text-2xl font-semibold text-zinc-950">{value}</p>
                <p className="mt-0.5 text-sm text-zinc-500">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={() => setTab("queue")}
              className={
                "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition " +
                (tab === "queue"
                  ? "bg-zinc-950 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200")
              }
            >
              Очередь
              {queue.length > 0 && (
                <span
                  className={
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold " +
                    (tab === "queue" ? "bg-white text-zinc-950" : "bg-zinc-950 text-white")
                  }
                >
                  {queue.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab("reports")}
              className={
                "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition " +
                (tab === "reports"
                  ? "bg-zinc-950 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200")
              }
            >
              Жалобы
              {pendingReports > 0 && (
                <span
                  className={
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold " +
                    (tab === "reports" ? "bg-white text-zinc-950" : "bg-red-600 text-white")
                  }
                >
                  {pendingReports}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab("incidents")}
              className={
                "rounded-xl px-4 py-2 text-sm font-semibold transition " +
                (tab === "incidents"
                  ? "bg-red-600 text-white"
                  : "bg-red-50 text-red-700 hover:bg-red-100")
              }
            >
              Автоблокировки
            </button>
            <button
              onClick={() => setTab("reviews")}
              className={
                "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition " +
                (tab === "reviews"
                  ? "bg-zinc-950 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200")
              }
            >
              Отзывы
              {reviewItems.length > 0 && (
                <span
                  className={
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold " +
                    (tab === "reviews" ? "bg-white text-zinc-950" : "bg-amber-500 text-white")
                  }
                >
                  {reviewItems.length}
                </span>
              )}
            </button>
          </div>

          <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="order-2 overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm lg:order-1">
              {tab === "queue" ? (
                <>
                  <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
                    <h2 className="font-semibold text-zinc-950">Очередь на проверку</h2>
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-600">
                      {queue.length} объявлений
                    </span>
                  </div>
                  {loading ? (
                    <div className="py-12 text-center text-sm text-zinc-400">Загрузка...</div>
                  ) : queue.length === 0 ? (
                    <div className="py-16 text-center text-zinc-400">
                      <p className="mb-3 text-3xl">✅</p>
                      <p className="font-medium">Очередь пуста</p>
                      <p className="mt-1 text-sm">Новые объявления появятся здесь автоматически</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-100">
                      {queue.map((item) => (
                        <article
                          key={item.id}
                          className="grid gap-4 px-4 py-4 sm:px-5 sm:grid-cols-[72px_minmax(0,1fr)] sm:items-start xl:grid-cols-[80px_minmax(0,1fr)_220px] xl:items-center"
                        >
                          <div className="h-20 overflow-hidden rounded-2xl bg-zinc-100">
                            {item.images[0] ? (
                              <img src={item.images[0]} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
                                Нет фото
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate font-semibold text-zinc-950">{item.title}</p>
                              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                                {item.category.nameRu}
                              </span>
                            </div>
                            <p className="mt-0.5 text-sm text-zinc-500">
                              {item.city} · {formatPrice(item.price)}
                            </p>
                            {(item.moderationReasonCode === "LOW_PRICE_MARKET" ||
                              item.priceInsight?.status === "VERY_LOW") && (
                              <p className="mt-1 inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-medium text-amber-900">
                                ⚠ Цена ниже рынка
                                {item.priceInsight?.min != null && item.priceInsight?.max != null
                                  ? ` · рынок ${item.priceInsight.min.toLocaleString("ru-RU")}–${item.priceInsight.max.toLocaleString("ru-RU")} ₽`
                                  : ""}
                              </p>
                            )}
                            <Link
                              href={`/admin/users/${item.seller.id}`}
                              className="mt-0.5 block text-xs font-medium text-zinc-600 transition hover:text-[hsl(var(--nashlo-orange))] hover:underline"
                            >
                              {item.seller.name ?? item.seller.phone}
                            </Link>
                          </div>
                          <div className="flex flex-col gap-2 sm:col-span-2 xl:col-span-1">
                            <Link
                              href={"/listings/" + item.id}
                              target="_blank"
                              className="rounded-xl border border-zinc-200 py-2 text-center text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50"
                            >
                              Открыть ↗
                            </Link>
                            <div className="grid grid-cols-2 gap-1.5 sm:max-w-xs xl:max-w-none">
                              <button
                                onClick={() => moderate(item.id, "APPROVED")}
                                className="rounded-xl bg-zinc-950 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800"
                              >
                                Одобрить
                              </button>
                              <button
                                onClick={() => setRejectTarget(item)}
                                className="rounded-xl bg-red-50 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                              >
                                Решение
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </>
              ) : tab === "reports" ? (
                <>
                  <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
                    <h2 className="font-semibold text-zinc-950">Жалобы пользователей</h2>
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-600">
                      {reports.length} всего
                    </span>
                  </div>
                  {reports.length === 0 ? (
                    <div className="py-16 text-center text-zinc-400">
                      <p className="mb-3 text-3xl">🛡️</p>
                      <p className="font-medium">Жалоб пока нет</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-100">
                      {reports.map((report) => (
                        <div key={report.id} className="px-5 py-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-semibold text-zinc-950">
                                {report.listing?.title ?? report.targetUser?.name ?? "Жалоба на пользователя"}
                              </p>
                              {report.targetUser && (
                                <Link
                                  href={"/admin/users/" + report.targetUser.id}
                                  className="mt-1 inline-block text-xs font-medium text-zinc-600 hover:text-[hsl(var(--nashlo-orange))] hover:underline"
                                >
                                  Профиль пользователя ↗
                                </Link>
                              )}
                              <p className="mt-0.5 text-sm font-medium text-zinc-600">
                                {REASON_LABELS[report.reason] ?? report.reason}
                              </p>
                              {report.comment && <p className="mt-1 text-sm text-zinc-400">«{report.comment}»</p>}
                              <p className="mt-0.5 text-xs text-zinc-400">
                                {new Date(report.createdAt).toLocaleDateString("ru-RU")}
                              </p>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              {report.listing && (
                                <Link
                                  href={"/listings/" + report.listing.id}
                                  target="_blank"
                                  className="rounded-xl border border-zinc-200 px-3 py-1.5 text-center text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                                >
                                  Открыть
                                </Link>
                              )}
                              <button
                                onClick={() => resolveReport(report.id)}
                                className="rounded-xl bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-800"
                              >
                                Обработать
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : tab === "incidents" ? (
                <div className="px-5 py-5">
                  <div className="mb-4 border-b border-zinc-100 pb-4">
                    <h2 className="font-semibold text-zinc-950">Автоблокировки контента</h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      Запрещённые тексты, повторы и отклонённые фото — полные данные для проверки.
                    </p>
                  </div>
                  <ContentIncidentsPanel />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
                    <h2 className="font-semibold text-zinc-950">Отзывы: модерация и споры</h2>
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-600">
                      {reviewItems.length}
                    </span>
                  </div>
                  {reviewLoading ? (
                    <div className="py-12 text-center text-sm text-zinc-400">Загрузка...</div>
                  ) : reviewItems.length === 0 ? (
                    <div className="py-16 text-center text-zinc-400">
                      <p className="mb-3 text-3xl">✅</p>
                      <p className="font-medium">Очередь отзывов пуста</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-100">
                      {reviewItems.map((rv) => (
                        <div key={rv.id} className="px-5 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                              {rv.reviewModerationState}
                            </p>
                            {rv.isHidden && (
                              <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-semibold text-zinc-600">
                                Скрыт
                              </span>
                            )}
                          </div>
                          <p className="mt-1 font-semibold text-zinc-950">
                            {"★".repeat(Math.min(5, Math.max(1, rv.rating)))} ({rv.rating}) ·{" "}
                            {rv.author.name ?? rv.author.phone ?? "Автор"} →{" "}
                            {rv.targetUser.name ?? rv.targetUser.phone ?? "Получатель"}
                          </p>
                          {rv.listing && <p className="mt-0.5 text-sm text-zinc-500">{rv.listing.title}</p>}
                          {rv.text && <p className="mt-2 text-sm text-zinc-600">«{rv.text}»</p>}
                          <div className="mt-3 flex flex-wrap gap-2">
                            {!rv.isHidden && (
                              <button
                                type="button"
                                onClick={() => void publishReview(rv.id)}
                                className="rounded-xl bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-800"
                              >
                                Опубликовать / снять спор
                              </button>
                            )}
                            {rv.isHidden ? (
                              <button
                                type="button"
                                onClick={() => void restoreReview(rv.id)}
                                className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                              >
                                Восстановить
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => void hideReviewAdmin(rv.id)}
                                className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
                              >
                                Скрыть
                              </button>
                            )}
                            {rv.listing && (
                              <Link
                                href={"/listings/" + rv.listing.id}
                                target="_blank"
                                className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                              >
                                Объявление ↗
                              </Link>
                            )}
                            <Link
                              href={"/admin/users/" + rv.targetUser.id}
                              className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                            >
                              Получатель ↗
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <aside className="order-1 space-y-5 lg:order-2">
              <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
                <h2 className="font-semibold text-zinc-950">Автофильтры</h2>
                <div className="mt-4 space-y-2">
                  {autoFilters.map((f) => (
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
                        <span
                          className={
                            "mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                            (f.level === "Высокий"
                              ? "bg-red-50 text-red-500"
                              : "bg-orange-50 text-orange-500")
                          }
                        >
                          {f.level}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </AdminPageShell>
      </main>
    </>
  )
}
