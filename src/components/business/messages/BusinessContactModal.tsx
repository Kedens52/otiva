"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"

type Props = {
  open: boolean
  onClose: () => void
  companyId: string
  companyName: string
  businessListingId?: string
  listingTitle?: string
}

export function BusinessContactModal({
  open,
  onClose,
  companyId,
  companyName,
  businessListingId,
  listingTitle,
}: Props) {
  const router = useRouter()
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const textRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!open) return
    const tmpl = listingTitle
      ? `Здравствуйте! Интересует предложение «${listingTitle}» от ${companyName}.`
      : `Здравствуйте! Хотели бы обсудить сотрудничество с ${companyName}.`
    setMessage(tmpl)
    setError("")
    setTimeout(() => textRef.current?.focus(), 50)
  }, [open, companyName, listingTitle])

  if (!open) return null

  async function send() {
    const trimmed = message.trim()
    if (!trimmed || sending) return
    setSending(true)
    setError("")
    try {
      const res = await fetch("/api/business/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          businessListingId,
          message: trimmed,
        }),
      })
      if (res.status === 401) {
        router.push(`/business/login?from=${encodeURIComponent(window.location.pathname)}`)
        return
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Ошибка отправки")
      onClose()
      const convId = data.conversation?.id
      const biz = await fetch("/api/business/me").then((r) => (r.ok ? r.json() : null))
      const hasCabinet = Boolean(biz?.hasBusinessProfile)
      if (convId) {
        router.push(
          hasCabinet
            ? `/business/dashboard/messages/${convId}`
            : `/business/chats/${convId}`,
        )
      } else {
        router.push(hasCabinet ? "/business/dashboard/messages" : "/business/chats")
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка отправки")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-zinc-950">Написать компании</h2>
            <p className="mt-1 text-sm text-zinc-500">
              {companyName}
              {listingTitle ? ` · ${listingTitle}` : ""}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100" aria-label="Закрыть">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          Сообщение попадёт в бизнес-кабинет компании, не в личные сообщения владельца.
        </p>
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
        <textarea
          ref={textRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          maxLength={2000}
          className="mt-4 w-full resize-none rounded-xl border border-zinc-200 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={send}
          disabled={!message.trim() || sending}
          className="mt-3 w-full rounded-xl bg-[hsl(var(--nashlo-orange))] py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {sending ? "Отправка…" : "Отправить"}
        </button>
      </div>
    </div>
  )
}
