"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
type Props = {
  sellerId: string
  sellerName: string
  phoneAvailable?: boolean
  phoneMasked?: string
  listingTitle: string
  listingId?: string
  listingCategory?: string
  city?: string
  onClose: () => void
  initialTab?: "write" | "call"
}

const OPENER_KEY = "nashlo-opener-template"
const DEFAULT_OPENER = "Здравствуйте! Меня интересует ваше объявление «{listing}». Оно ещё актуально?"

export function ContactSellerModal({
  sellerId, sellerName, phoneAvailable = false, phoneMasked,
  listingTitle, listingId, city = "", onClose, initialTab = "write",
}: Props) {
  const [tab, setTab] = useState<"write" | "call">(initialTab)
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [revealed, setRevealed] = useState(false)
  const [phone, setPhone] = useState("")
  const [loadingPhone, setLoadingPhone] = useState(false)
  const [phoneError, setPhoneError] = useState("")
  const [convId, setConvId] = useState<string | null>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  useEffect(() => { setTab(initialTab) }, [initialTab])

  useEffect(() => {
    const tmpl = typeof window !== "undefined"
      ? (localStorage.getItem(OPENER_KEY) || DEFAULT_OPENER)
      : DEFAULT_OPENER
    setMessage(tmpl.replace("{listing}", listingTitle))
    setTimeout(() => textRef.current?.focus(), 50)
  }, [listingTitle])

  async function send() {
    const trimmed = message.trim()
    if (!trimmed || sending) return
    setSending(true)
    setError("")
    try {
      const res = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listingId || undefined, recipientId: sellerId, message: trimmed }),
      })
      if (res.status === 401) { router.push("/login"); return }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Ошибка отправки")
      setConvId(data.conversation?.id ?? null)
      setSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка отправки")
    } finally {
      setSending(false)
    }
  }

  async function revealPhone() {
    if (!phoneAvailable || loadingPhone || revealed) return
    setLoadingPhone(true)
    setPhoneError("")
    try {
      const res = await fetch(`/api/users/${sellerId}/contact-phone`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Номер недоступен")
      setPhone(data.phone || "")
      setRevealed(true)
    } catch (err: unknown) {
      setPhoneError(err instanceof Error ? err.message : "Не удалось получить номер")
    } finally {
      setLoadingPhone(false)
    }
  }

  function goToChat() {
    onClose()
    router.push(convId ? `/messages/${convId}` : "/chat")
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() }
  }

  const displayMasked = phoneMasked || "+7 *** ***-**-••"

  function renderWrite() {
    if (sent) {
      return (
        <div className="py-4 text-center">
          <p className="text-4xl">{"✅"}</p>
          <p className="mt-3 font-semibold text-zinc-950">{"Сообщение отправлено!"}</p>
          <p className="mt-1 text-sm text-zinc-500">{"Продавец получит уведомление и ответит вам в чате."}</p>
          <div className="mt-5 grid gap-2">
            <button onClick={goToChat} className="w-full rounded-xl bg-[hsl(var(--nashlo-orange))] px-5 py-3 text-sm font-semibold text-white">
              {"Открыть чат"}
            </button>
            <button onClick={onClose} className="w-full rounded-xl border border-zinc-200 px-5 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
              {"Закрыть"}
            </button>
          </div>
        </div>
      )
    }
    return (
      <div>
        <p className="mb-2 text-sm font-medium text-zinc-600">{"Ваше сообщение"}</p>
        <textarea
          ref={textRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKey}
          rows={4}
          maxLength={1000}
          className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-[hsl(var(--nashlo-orange))] focus:bg-white"
        />
        {city && <p className="mt-1.5 text-xs text-zinc-400">{"📍 " + city}</p>}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <button onClick={send} disabled={!message.trim() || sending}
          className="mt-3 w-full rounded-xl bg-[hsl(var(--nashlo-orange))] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40">
          {sending ? "Отправляем…" : "Отправить сообщение"}
        </button>
        <p className="mt-2 text-center text-xs text-zinc-400">{"Enter — отправить · Shift+Enter — новая строка"}</p>
      </div>
    )
  }

  function renderCall() {
    if (!phoneAvailable) {
      return (
        <div className="space-y-4 py-2 text-center">
          <p className="text-sm text-zinc-600">
            Продавец не указал телефон для звонков. Напишите в чат — так безопаснее.
          </p>
          <button
            onClick={() => setTab("write")}
            className="w-full rounded-xl bg-[hsl(var(--nashlo-orange))] px-5 py-3 text-sm font-semibold text-white"
          >
            Написать продавцу
          </button>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-zinc-50 p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{"Номер продавца"}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-zinc-950">
            {revealed ? phone : displayMasked}
          </p>
          {!revealed && <p className="mt-1 text-xs text-zinc-500">{"Нажмите, чтобы показать полный номер"}</p>}
        </div>
        {phoneError && <p className="text-center text-sm text-red-600">{phoneError}</p>}
        {!revealed && (
          <button
            onClick={revealPhone}
            disabled={loadingPhone}
            className="w-full rounded-xl bg-[hsl(var(--nashlo-orange))] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[hsl(var(--nashlo-orange)/0.92)] disabled:opacity-50"
          >
            {loadingPhone ? "Загрузка…" : "Показать номер"}
          </button>
        )}
        {revealed && phone && (
          <a
            href={"tel:" + phone.replace(/\D/g, "")}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[hsl(var(--nashlo-mint))] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            {"📞 Позвонить"}
          </a>
        )}
        {revealed && !phone && (
          <p className="text-center text-sm text-zinc-400">{"Телефон не указан"}</p>
        )}
        <p className="text-center text-xs text-zinc-400">{"Звонки и переписка защищены политикой Нашло"}</p>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-zinc-950/45 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] backdrop-blur-sm sm:items-center sm:pb-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <div className="min-w-0">
            <p className="truncate font-semibold text-zinc-950">{sellerName}</p>
            <p className="mt-0.5 truncate text-sm text-zinc-500">{listingTitle}</p>
          </div>
          <button onClick={onClose} className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200">
            {"✕"}
          </button>
        </div>

        <div className={"grid gap-1 bg-zinc-100 p-1 " + (phoneAvailable ? "grid-cols-2" : "grid-cols-1")}>
          <button onClick={() => setTab("write")}
            className={"rounded-xl py-2.5 text-sm font-semibold transition " + (tab === "write" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-950")}>
            {"✉ Написать"}
          </button>
          {phoneAvailable && (
            <button onClick={() => setTab("call")}
              className={"rounded-xl py-2.5 text-sm font-semibold transition " + (tab === "call" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-950")}>
              {"📞 Позвонить"}
            </button>
          )}
        </div>

        <div className="p-5">
          {tab === "write" && renderWrite()}
          {tab === "call" && renderCall()}
        </div>
      </div>
    </div>
  )
}
