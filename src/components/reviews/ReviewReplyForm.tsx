"use client"

import { useState } from "react"

type Props = {
  reviewId: string
  onSuccess: (text: string) => void
  onCancel: () => void
}

export function ReviewReplyForm({ reviewId, onSuccess, onCancel }: Props) {
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/reviews/${reviewId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Ошибка"); return }
      onSuccess(text.trim())
    } catch {
      setError("Ошибка сети")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Напишите ответ..."
        maxLength={500}
        rows={3}
        className="w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-[hsl(var(--nashlo-orange)/0.5)] focus:ring-2 focus:ring-[hsl(var(--nashlo-orange)/0.1)]"
      />
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <span className="text-xs text-zinc-400">{text.length}/500</span>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg px-3 py-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition">
            Отмена
          </button>
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50"
          >
            {loading ? "..." : "Ответить"}
          </button>
        </div>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </form>
  )
}
