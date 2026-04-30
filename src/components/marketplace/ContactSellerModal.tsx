"use client"

import { useEffect, useRef, useState } from "react"
import { getOrCreateConversation, sendMessage as chatSend } from "@/lib/chat-store"
import { useRouter } from "next/navigation"

type Props = {
  sellerName: string
  sellerPhone?: string
  listingTitle: string
  listingId?: string
  listingCategory?: string
  city?: string
  onClose: () => void
}

const OPENER_KEY = "otiva-opener-template"
const DEFAULT_OPENER = "Здравствуйте! Меня интересует ваше объявление «{listing}». Оно ещё актуально?"

export function ContactSellerModal({ sellerName, sellerPhone, listingTitle, listingId = "0", listingCategory = "cars", city = "", onClose }: Props) {
  const [tab,       setTab]       = useState<"write" | "call">("write")
  const [message,   setMessage]   = useState("")
  const [sent,      setSent]      = useState(false)
  const [revealed,  setRevealed]  = useState(false)
  const textRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  useEffect(() => {
    const tmpl = localStorage.getItem(OPENER_KEY) || DEFAULT_OPENER
    setMessage(tmpl.replace("{listing}", listingTitle))
    setTimeout(() => textRef.current?.focus(), 50)
  }, [listingTitle])

  function send() {
    if (!message.trim()) return
    getOrCreateConversation(listingId, listingTitle, listingCategory, sellerName, city)
    chatSend(listingId, message.trim(), "me")

    // Auto-responder
    const autoEnabled = localStorage.getItem("otiva-autoreply-enabled") === "true"
    if (autoEnabled) {
      const reply = localStorage.getItem("otiva-autoreply-text") || "Здравствуйте! Объявление актуально, готов ответить на вопросы."
      const delay = Number(localStorage.getItem("otiva-autoreply-delay") || "0") * 1000
      setTimeout(() => { chatSend(listingId, reply, "seller") }, Math.max(delay, 800))
    }
    setSent(true)
  }

  function goToChat() {
    onClose()
    router.push("/messages/" + listingId)
  }

  const phone = sellerPhone || "+7 999 000-00-00"
  const maskedPhone = phone.slice(0, 9) + "•••-••-••"

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-zinc-950/50 px-4 pb-4 sm:items-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <div className="min-w-0">
            <p className="truncate font-semibold text-zinc-950">{sellerName}</p>
            <p className="mt-0.5 truncate text-sm text-zinc-500">{listingTitle}</p>
          </div>
          <button onClick={onClose} className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200">✕</button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-1 bg-zinc-100 p-1">
          <button
            onClick={() => setTab("write")}
            className={`rounded-xl py-2.5 text-sm font-semibold transition ${tab === "write" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-950"}`}
          >
            ✉ Написать
          </button>
          <button
            onClick={() => setTab("call")}
            className={`rounded-xl py-2.5 text-sm font-semibold transition ${tab === "call" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-950"}`}
          >
            📞 Позвонить
          </button>
        </div>

        <div className="p-5">
          {tab === "write" ? (
            sent ? (
              <div className="py-4 text-center">
                <p className="text-4xl">✅</p>
                <p className="mt-3 font-semibold text-zinc-950">Сообщение отправлено!</p>
                <p className="mt-1 text-sm text-zinc-500">Продавец получит уведомление и ответит вам в чате.</p>
                <div className="mt-5 grid gap-2">
                  <button onClick={goToChat} className="w-full rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white">
                    Открыть чат
                  </button>
                  <button onClick={onClose} className="w-full rounded-2xl border border-zinc-200 px-5 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
                    Закрыть
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="mb-2 text-sm font-medium text-zinc-600">Ваше сообщение</p>
                <textarea
                  ref={textRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-zinc-200 px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-[hsl(var(--otiva-orange))]"
                />
                <button
                  onClick={send}
                  disabled={!message.trim()}
                  className="mt-3 w-full rounded-2xl bg-[hsl(var(--otiva-orange))] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[hsl(var(--otiva-orange)/0.9)] disabled:opacity-40"
                >
                  Отправить сообщение
                </button>
                <p className="mt-2 text-center text-xs text-zinc-400">Переписка сохраняется в разделе «Сообщения»</p>
              </>
            )
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl bg-zinc-50 p-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Номер продавца</p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-zinc-950">
                  {revealed ? phone : maskedPhone}
                </p>
                {!revealed && (
                  <p className="mt-1 text-xs text-zinc-500">Нажмите, чтобы показать номер</p>
                )}
              </div>
              {!revealed ? (
                <button
                  onClick={() => setRevealed(true)}
                  className="w-full rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
                >
                  Показать номер
                </button>
              ) : (
                <a
                  href={`tel:${phone.replace(/\D/g, "")}`}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[hsl(var(--otiva-mint))] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  📞 Позвонить
                </a>
              )}
              <p className="text-center text-xs text-zinc-400">
                Звонки и переписка защищены политикой Отивы
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
