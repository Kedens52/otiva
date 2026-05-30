"use client"

import { useRef, useState } from "react"
import type { QuickReplyVariableContext } from "@/lib/support/operator-quick-replies"
import type { OperatorQuickReply } from "./types"
import { SupportQuickRepliesPicker } from "./SupportQuickRepliesPicker"

type SupportComposerProps = {
  closed: boolean
  canReply: boolean
  sending: boolean
  resolving: boolean
  quickReplies: OperatorQuickReply[]
  variableContext: QuickReplyVariableContext
  supportTopic?: string | null
  supportSubtopic?: string | null
  lastMessageText?: string | null
  hasListing?: boolean
  hasAd?: boolean
  hasBusiness?: boolean
  onSend: (text: string, meta?: { quickReplyId?: string; wasEdited?: boolean }) => void
  onClose: () => void
  onReopen: () => void
}

export function SupportComposer({
  closed,
  canReply,
  sending,
  resolving,
  quickReplies,
  variableContext,
  supportTopic,
  supportSubtopic,
  lastMessageText,
  hasListing,
  hasAd,
  hasBusiness,
  onSend,
  onClose,
  onReopen,
}: SupportComposerProps) {
  const [text, setText] = useState("")
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pendingQuickReplyId, setPendingQuickReplyId] = useState<string | null>(null)
  const [pendingOriginal, setPendingOriginal] = useState("")
  const [varWarning, setVarWarning] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleInsert(inserted: string, quickReplyId: string, missing: string[]) {
    setText(inserted)
    setPendingQuickReplyId(quickReplyId)
    setPendingOriginal(inserted)
    setVarWarning(
      missing.length
        ? `Не подставлены: ${missing.map((k) => `{${k}}`).join(", ")}`
        : null,
    )
    textareaRef.current?.focus()
  }

  function submit() {
    const trimmed = text.trim()
    if (!trimmed || !canReply || sending || closed) return
    const wasEdited =
      pendingQuickReplyId != null && trimmed !== pendingOriginal.trim()
    onSend(trimmed, {
      quickReplyId: pendingQuickReplyId ?? undefined,
      wasEdited,
    })
    setText("")
    setPendingQuickReplyId(null)
    setPendingOriginal("")
    setVarWarning(null)
  }

  if (closed) {
    return (
      <footer className="shrink-0 border-t border-zinc-100 bg-zinc-50 px-4 py-4 sm:px-5">
        <p className="text-center text-sm font-medium text-zinc-600">Обращение закрыто</p>
        {canReply ? (
          <button
            type="button"
            onClick={onReopen}
            disabled={resolving}
            className="mx-auto mt-3 flex rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
          >
            {resolving ? "Открываем…" : "Открыть обращение"}
          </button>
        ) : null}
      </footer>
    )
  }

  return (
    <footer className="relative shrink-0 border-t border-zinc-100 bg-white px-4 py-3 sm:px-5">
      <SupportQuickRepliesPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        items={quickReplies}
        variableContext={variableContext}
        supportTopic={supportTopic}
        supportSubtopic={supportSubtopic}
        lastMessageText={lastMessageText}
        hasListing={hasListing}
        hasAd={hasAd}
        hasBusiness={hasBusiness}
        onInsert={handleInsert}
      />

      {!canReply ? (
        <p className="py-2 text-center text-sm text-zinc-500">Нет прав на ответ в поддержке</p>
      ) : (
        <>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPickerOpen((v) => !v)}
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-white"
            >
              Быстрые ответы
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={resolving}
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
            >
              {resolving ? "…" : "Закрыть обращение"}
            </button>
          </div>
          {varWarning ? (
            <p className="mb-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">{varWarning}</p>
          ) : null}
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  submit()
                }
              }}
              rows={2}
              disabled={sending}
              placeholder="Ответить пользователю · Enter — отправить, Shift+Enter — новая строка"
              className="min-h-12 max-h-40 flex-1 resize-y rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))] focus:bg-white disabled:opacity-60"
            />
            <button
              type="button"
              onClick={submit}
              disabled={!text.trim() || sending}
              className="shrink-0 rounded-2xl bg-[hsl(var(--nashlo-orange))] px-5 py-3 text-sm font-semibold text-white disabled:bg-zinc-200 disabled:text-zinc-400"
            >
              {sending ? "…" : "Отправить"}
            </button>
          </div>
        </>
      )}
    </footer>
  )
}
