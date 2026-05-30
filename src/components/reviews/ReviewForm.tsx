"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { StarPicker } from "@/components/reviews/StarRating"

const ALLOWED_TAGS = [
  "Всё отлично",
  "Быстро договорились",
  "Товар соответствует описанию",
  "Приятное общение",
  "Надёжный пользователь",
  "Были сложности",
  "Не рекомендую",
]

type Props = {
  dealId: string
  targetUserId: string
  targetUserName?: string | null
  listingTitle?: string | null
  onSuccess: () => void
  onClose: () => void
}

export function ReviewForm({ dealId, targetUserId, targetUserName, listingTitle, onSuccess, onClose }: Props) {
  const [rating, setRating] = useState(0)
  const [tags, setTags] = useState<string[]>([])
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : prev.length < 4 ? [...prev, tag] : prev,
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) { setError("Поставьте оценку"); return }
    if (text.trim().length < 10) { setError("Напишите отзыв подробнее (минимум 10 символов)"); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId, targetUserId, rating, tags, text: text.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Ошибка"); return }
      onSuccess()
    } catch {
      setError("Ошибка сети")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-zinc-950">Оставить отзыв</h3>
            {targetUserName && <p className="text-sm text-zinc-500 mt-0.5">Для: {targetUserName}</p>}
            {listingTitle && <p className="text-xs text-zinc-400 truncate max-w-[280px]">{listingTitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:text-zinc-900 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Stars */}
          <div className="mb-4">
            <p className="text-sm font-medium text-zinc-700 mb-2">Оценка</p>
            <StarPicker value={rating} onChange={setRating} size={32} />
          </div>

          {/* Tags */}
          <div className="mb-4">
            <p className="text-sm font-medium text-zinc-700 mb-2">Теги <span className="text-zinc-400 font-normal">(до 4)</span></p>
            <div className="flex flex-wrap gap-1.5">
              {ALLOWED_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    tags.includes(tag)
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Text */}
          <div className="mb-4">
            <p className="text-sm font-medium text-zinc-700 mb-2">Отзыв</p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Расскажите о вашем опыте взаимодействия..."
              maxLength={1000}
              rows={4}
              className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-400 focus:bg-white transition"
            />
            <div className="mt-1 flex justify-between">
              <span className="text-xs text-zinc-400">Минимум 10 символов</span>
              <span className="text-xs text-zinc-400">{text.length}/1000</span>
            </div>
          </div>

          {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-zinc-500 hover:text-zinc-900 transition">
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[hsl(var(--nashlo-orange))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? "Отправка..." : "Опубликовать отзыв"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
