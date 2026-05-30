"use client"

import { useState } from "react"
import { X } from "lucide-react"

const REASONS = [
  "Спам",
  "Оскорбления",
  "Ложная информация",
  "Не было сделки",
  "Мошенничество",
  "Другое",
]

type Props = {
  reviewId: string
  onClose: () => void
}

export function ReviewReportModal({ reviewId, onClose }: Props) {
  const [reason, setReason] = useState("")
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/reviews/${reviewId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, comment: comment.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Ошибка"); return }
      setDone(true)
    } catch {
      setError("Ошибка сети")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-zinc-950">Жалоба на отзыв</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:text-zinc-900 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {done ? (
          <div className="text-center py-4">
            <p className="text-sm text-zinc-700 mb-4">Жалоба принята. Мы рассмотрим её в ближайшее время.</p>
            <button type="button" onClick={onClose} className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition">
              Закрыть
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="text-sm text-zinc-500 mb-3">Укажите причину жалобы</p>
            <div className="space-y-2">
              {REASONS.map((r) => (
                <label key={r} className="flex items-center gap-2.5 cursor-pointer rounded-xl border border-zinc-100 px-3 py-2 hover:border-zinc-200 transition">
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="h-4 w-4 accent-zinc-900"
                  />
                  <span className="text-sm text-zinc-700">{r}</span>
                </label>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Дополнительный комментарий (необязательно)"
              maxLength={500}
              rows={2}
              className="mt-3 w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-400"
            />

            {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

            <div className="mt-4 flex gap-2 justify-end">
              <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-zinc-500 hover:text-zinc-900 transition">
                Отмена
              </button>
              <button
                type="submit"
                disabled={loading || !reason}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition disabled:opacity-50"
              >
                {loading ? "..." : "Пожаловаться"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
