"use client"

import { useState } from "react"
import { X } from "lucide-react"

const REASONS = [
  { id: "fraud", label: "Мошенничество" },
  { id: "false_info", label: "Ложные сведения" },
  { id: "spam", label: "Спам" },
  { id: "prohibited", label: "Запрещённый контент" },
  { id: "other", label: "Другое" },
] as const

type Props = {
  open: boolean
  onClose: () => void
  companyId: string
  companyName: string
  businessListingId?: string
}

export function BusinessReportModal({ open, onClose, companyId, companyName, businessListingId }: Props) {
  const [reason, setReason] = useState("")
  const [comment, setComment] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!open) return null

  async function submit() {
    if (!reason || loading) return
    setLoading(true)
    await fetch("/api/business/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId, businessListingId, reason, comment }),
    })
    setLoading(false)
    setSent(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex justify-between">
          <h2 className="font-bold text-zinc-950">Жалоба на компанию</h2>
          <button type="button" onClick={onClose} aria-label="Закрыть">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-1 text-sm text-zinc-500">{companyName}</p>
        {sent ? (
          <p className="mt-4 text-sm text-emerald-800">Жалоба отправлена. Модераторы B2B рассмотрят её.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {REASONS.map((r) => (
              <label key={r.id} className="flex items-center gap-2 text-sm">
                <input type="radio" name="reason" value={r.id} checked={reason === r.id} onChange={() => setReason(r.id)} />
                {r.label}
              </label>
            ))}
            <textarea
              placeholder="Комментарий"
              rows={3}
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button
              type="button"
              disabled={!reason || loading}
              onClick={() => void submit()}
              className="w-full rounded-xl bg-zinc-950 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              Отправить
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
