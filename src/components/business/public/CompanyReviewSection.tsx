"use client"

import { useState } from "react"
import { Star } from "lucide-react"

type Review = {
  id: string
  rating: number
  comment: string
  createdAt: string | Date
  authorName: string
  authorAvatar: string | null
}

type Props = {
  companyId: string
  reviews: Review[]
  averageRating: number
  reviewCount: number
}

export function CompanyReviewSection({ companyId, reviews, averageRating, reviewCount }: Props) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [msg, setMsg] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit() {
    setMsg("")
    setLoading(true)
    const res = await fetch(`/api/business/companies/${companyId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment }),
    })
    const data = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) {
      setMsg(data.error ?? "Не удалось отправить")
      return
    }
    setMsg("Отзыв сохранён. Обновите страницу, чтобы увидеть его в списке.")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
        <span className="text-lg font-semibold">
          {reviewCount > 0 ? averageRating.toFixed(1).replace(".", ",") : "—"}
        </span>
        <span className="text-sm text-zinc-500">
          {reviewCount} {reviewCount === 1 ? "отзыв" : reviewCount < 5 ? "отзыва" : "отзывов"}
        </span>
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-zinc-500">Пока нет отзывов о работе с компанией.</p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-xl border border-zinc-100 bg-white p-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-950">{r.authorName}</span>
                <span className="text-xs text-amber-600">{"★".repeat(r.rating)}</span>
              </div>
              <p className="mt-2 text-sm text-zinc-700">{r.comment}</p>
              <p className="mt-1 text-xs text-zinc-400">
                {new Date(r.createdAt).toLocaleDateString("ru-RU")}
              </p>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4">
        <p className="text-sm font-semibold text-zinc-950">Оставить отзыв о компании</p>
        <p className="mt-1 text-xs text-zinc-500">Отдельно от отзывов продавца на обычном Нашло.</p>
        <div className="mt-3 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={`rounded p-1 ${rating >= n ? "text-amber-500" : "text-zinc-300"}`}
            >
              <Star className="h-5 w-5 fill-current" />
            </button>
          ))}
        </div>
        <textarea
          rows={3}
          className="mt-2 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
          placeholder="Опыт работы с компанией (мин. 10 символов)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        {msg && <p className="mt-2 text-xs text-zinc-600">{msg}</p>}
        <button
          type="button"
          disabled={loading || comment.length < 10}
          onClick={() => void submit()}
          className="mt-2 rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Отправить отзыв
        </button>
      </div>
    </div>
  )
}
