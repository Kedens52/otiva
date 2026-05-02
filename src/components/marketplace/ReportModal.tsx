"use client"

import { useState } from "react"

type Props = {
  listingId: string
  listingTitle: string
  onClose: () => void
}

const REPORT_REASONS = [
  { id: "fraud", label: "Мошенничество или обман", icon: "⚠️" },
  { id: "prohibited", label: "Запрещённый товар", icon: "🚫" },
  { id: "spam", label: "Спам или дубликат", icon: "📋" },
  { id: "wrong_category", label: "Не та категория", icon: "📁" },
  { id: "wrong_price", label: "Неверная цена", icon: "💸" },
  { id: "other", label: "Другое", icon: "💬" },
]

export function ReportModal({ listingId, listingTitle, onClose }: Props) {
  const [selectedReason, setSelectedReason] = useState("")
  const [comment, setComment] = useState("")
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (!selectedReason || submitting) return
    setSubmitting(true)
    try {
      await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, reason: selectedReason, comment: comment.trim() }),
      })
    } catch {}
    setSubmitting(false)
    setSent(true)
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center px-4 pb-[env(safe-area-inset-bottom)] sm:items-center sm:p-0" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-t-[32px] bg-white p-5 shadow-2xl sm:rounded-[32px] sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-200 sm:hidden" />

        {sent ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--nashlo-mint)/0.12)] text-3xl">✓</div>
            <h2 className="text-xl font-semibold text-zinc-950">Жалоба отправлена</h2>
            <p className="mt-2 text-sm text-zinc-500">Модераторы рассмотрят её в течение 24 часов.</p>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-2xl bg-zinc-950 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Закрыть
            </button>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-zinc-950">Пожаловаться</h2>
              <p className="mt-1 text-sm text-zinc-500 truncate">на «{listingTitle}»</p>
            </div>

            <p className="mb-3 text-sm font-semibold text-zinc-700">Причина</p>
            <div className="space-y-2">
              {REPORT_REASONS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedReason(r.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                    selectedReason === r.id
                      ? "border-zinc-950 bg-zinc-950 text-white"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                  }`}
                >
                  <span>{r.icon}</span>
                  {r.label}
                </button>
              ))}
            </div>

            {selectedReason && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-semibold text-zinc-700">Комментарий (необязательно)</p>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Опишите проблему подробнее..."
                  className="w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-sm outline-none transition focus:border-zinc-400 focus:bg-white"
                />
              </div>
            )}

            <div className="mt-5 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-2xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50"
              >
                Отмена
              </button>
              <button
                onClick={submit}
                disabled={!selectedReason || submitting}
                className="flex-1 rounded-2xl bg-red-600 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-40"
              >
                {submitting ? "Отправляем…" : "Отправить жалобу"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
