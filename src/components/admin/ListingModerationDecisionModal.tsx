"use client"

import { useEffect, useRef, useState } from "react"
import { LISTING_MODERATION_REASONS, type ModerationReasonCode } from "@/lib/moderation-reasons"

type Props = {
  listingTitle: string
  onRevision: (reason: string, moderationReasonCode?: ModerationReasonCode) => void
  onFinalReject: (reason: string, moderationReasonCode?: ModerationReasonCode) => void
  onCancel: () => void
}

export function ListingModerationDecisionModal({
  listingTitle,
  onRevision,
  onFinalReject,
  onCancel,
}: Props) {
  const [code, setCode] = useState<ModerationReasonCode | "">("")
  const [detail, setDetail] = useState("")
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function buildReason(): string {
    const row = code ? LISTING_MODERATION_REASONS.find((r) => r.code === code) : null
    const base = row?.label ?? ""
    const extra = detail.trim()
    if (base && extra) return `${base}: ${extra}`
    if (base) return base
    return extra
  }

  const reason = buildReason()
  const canSubmit = reason.trim().length > 0

  function pickPreset(c: ModerationReasonCode) {
    setCode(c)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[28px] bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-zinc-950">Решение по объявлению</h2>
        <p className="mt-1 truncate text-sm text-zinc-500">«{listingTitle}»</p>

        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">Причина (код)</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {LISTING_MODERATION_REASONS.map((r) => (
            <button
              key={r.code}
              type="button"
              onClick={() => pickPreset(r.code)}
              className={`rounded-xl border px-3 py-1.5 text-left text-xs font-medium transition ${
                code === r.code
                  ? "border-zinc-950 bg-zinc-950 text-white"
                  : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <p className="mt-4 text-xs font-semibold text-zinc-500">Комментарий для продавца</p>
        <textarea
          ref={inputRef}
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="Что именно исправить…"
          rows={4}
          maxLength={500}
          className="mt-2 w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-400"
        />
        <p className="mt-1 text-right text-xs text-zinc-400">{detail.length}/500</p>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={onCancel}
            className="order-4 flex-1 rounded-2xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50 sm:order-1"
          >
            Отмена
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => canSubmit && onRevision(reason.trim(), code || undefined)}
            className="order-2 flex-1 rounded-2xl bg-amber-500 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            На доработку
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => canSubmit && onFinalReject(reason.trim(), code || undefined)}
            className="order-3 flex-1 rounded-2xl bg-red-600 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Отклонить окончательно
          </button>
        </div>
      </div>
    </div>
  )
}
