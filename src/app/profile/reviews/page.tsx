"use client"

import { useEffect, useState } from "react"
import { Star, ChevronDown } from "lucide-react"
import { CabinetPage } from "@/components/profile/CabinetPage"
import { ReviewCard, type ReviewCardData } from "@/components/reviews/ReviewCard"
import { ReviewForm } from "@/components/reviews/ReviewForm"
import { StarRating } from "@/components/reviews/StarRating"
import { LegalConsentNotice } from "@/components/legal/LegalConsentNotice"

type ReviewStats = {
  avg: number
  count: number
  positive: number
  neutral: number
  negative: number
}

type PendingDeal = {
  dealId: string
  listingId: string
  listingTitle: string
  listingSlug: string | null
  listingImage: string | null
  completedAt: string
  otherUser: { id: string; name: string | null; avatar: string | null }
  userRole: "seller" | "buyer"
}

type Me = {
  id: string
  name: string | null
}

function pluralReviews(n: number) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 14) return `${n} отзывов`
  if (mod10 === 1) return `${n} отзыв`
  if (mod10 >= 2 && mod10 <= 4) return `${n} отзыва`
  return `${n} отзывов`
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })
  } catch {
    return ""
  }
}

export default function ProfileReviewsPage() {
  const [me, setMe] = useState<Me | null>(null)
  const [reviews, setReviews] = useState<ReviewCardData[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [pendingDeals, setPendingDeals] = useState<PendingDeal[]>([])
  const [filter, setFilter] = useState("all")
  const [sort, setSort] = useState("newest")
  const [loading, setLoading] = useState(true)
  const [activeForm, setActiveForm] = useState<PendingDeal | null>(null)
  const [formDone, setFormDone] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.user) setMe(d.user)
        else if (d?.id) setMe(d)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`/api/profile/reviews?filter=${filter}&sort=${sort}`).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/profile/reviews/pending").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([reviewData, pendingData]) => {
        if (reviewData?.reviews) setReviews(reviewData.reviews)
        if (reviewData?.stats) setStats(reviewData.stats)
        if (pendingData?.deals) setPendingDeals(pendingData.deals)
      })
      .finally(() => setLoading(false))
  }, [filter, sort])

  const FILTERS = [
    { key: "all", label: "Все" },
    { key: "positive", label: "Положительные" },
    { key: "neutral", label: "Нейтральные" },
    { key: "negative", label: "Отрицательные" },
  ]

  const activePendingDeals = pendingDeals.filter((d) => !formDone.has(d.dealId))

  return (
    <>
      <CabinetPage
        title="Отзывы"
        subtitle="Здесь отображаются отзывы от пользователей после общения или сделки."
      >
        <LegalConsentNotice variant="reviews" className="mb-5" />

        {stats && stats.count > 0 ? (
          <div className="mb-5 rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4">
            <div className="flex flex-wrap items-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-zinc-950">{stats.avg}</p>
                <StarRating rating={stats.avg} size={14} className="mt-1 justify-center" />
                <p className="mt-1 text-xs text-zinc-500">{pluralReviews(stats.count)}</p>
              </div>
              <div className="flex min-w-[160px] flex-col gap-1.5 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-zinc-600">Положительные</span>
                  <span className="font-medium text-green-600">{stats.positive}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-zinc-600">Нейтральные</span>
                  <span className="font-medium text-zinc-600">{stats.neutral}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-zinc-600">Отрицательные</span>
                  <span className="font-medium text-red-500">{stats.negative}</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {activePendingDeals.length > 0 ? (
          <div className="mb-5 rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4">
            <h2 className="mb-3 text-sm font-semibold text-zinc-950">Ожидают отзыва</h2>
            <div className="space-y-2.5">
              {activePendingDeals.map((deal) => (
                <div
                  key={deal.dealId}
                  className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-white p-3"
                >
                  {deal.listingImage ? (
                    <img
                      src={deal.listingImage}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-zinc-100" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-950">{deal.listingTitle}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {deal.userRole === "seller" ? "Покупатель" : "Продавец"}:{" "}
                      {deal.otherUser.name ?? "Пользователь"} · {formatDate(deal.completedAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveForm(deal)}
                    className="shrink-0 rounded-xl bg-[hsl(var(--nashlo-orange))] px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90"
                  >
                    Оставить отзыв
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mb-5 flex flex-wrap items-center gap-2">
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`shrink-0 rounded-xl border px-3 py-1.5 text-sm transition ${
                  filter === f.key
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative ml-auto">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="cursor-pointer appearance-none rounded-xl border border-zinc-200 bg-white py-1.5 pl-3 pr-8 text-sm text-zinc-700 outline-none focus:border-zinc-400"
            >
              <option value="newest">Сначала новые</option>
              <option value="oldest">Сначала старые</option>
              <option value="high">С высокой оценкой</option>
              <option value="low">С низкой оценкой</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-zinc-100" />
            ))}
          </div>
        ) : reviews.length > 0 ? (
          <div className="space-y-3">
            {reviews.map((r) => (
              <ReviewCard
                key={r.id}
                review={r}
                currentUserId={me?.id}
                targetUserId={me?.id}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 p-8 text-center">
            <Star className="mx-auto mb-3 h-8 w-8 text-zinc-200" />
            <p className="text-sm font-medium text-zinc-700">Пока нет отзывов</p>
            <p className="mt-1 text-sm text-zinc-400">
              Когда пользователи оставят отзывы, они появятся здесь.
            </p>
          </div>
        )}
      </CabinetPage>

      {activeForm ? (
        <ReviewForm
          dealId={activeForm.dealId}
          targetUserId={activeForm.otherUser.id}
          targetUserName={activeForm.otherUser.name}
          listingTitle={activeForm.listingTitle}
          onSuccess={() => {
            setFormDone((prev) => new Set(prev).add(activeForm.dealId))
            setActiveForm(null)
          }}
          onClose={() => setActiveForm(null)}
        />
      ) : null}
    </>
  )
}
