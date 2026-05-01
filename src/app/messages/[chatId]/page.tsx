"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  getConversation,
  markRead,
  seedConversations,
  sendMessage,
  type ChatMessage,
  type Conversation,
} from "@/lib/chat-store"

const AUTOREPLY_KEY = "nashlo-autoreply-enabled"
const REPLIES_KEY = "nashlo-autoreply-text"
const DELAY_KEY = "nashlo-autoreply-delay"

type MessageItem = { type: "message"; message: ChatMessage }
type DateItem = { type: "date"; label: string }

function avatarTone(value: string) {
  const tones = [
    "from-[hsl(var(--nashlo-orange))] to-orange-400",
    "from-sky-500 to-indigo-500",
    "from-emerald-500 to-teal-400",
    "from-zinc-700 to-zinc-500",
    "from-[hsl(var(--nashlo-blue))] to-sky-400",
  ]
  return tones[value.charCodeAt(0) % tones.length]
}

function timeLabel(ts: number): string {
  return new Date(ts).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
}

function dateLabel(ts: number): string {
  const date = new Date(ts)
  const now = new Date()
  if (date.toDateString() === now.toDateString()) return "Сегодня"

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return "Вчера"

  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })
}

function buildItems(messages: ChatMessage[]): Array<DateItem | MessageItem> {
  const items: Array<DateItem | MessageItem> = []
  const seen = new Set<string>()

  for (const message of messages) {
    const key = new Date(message.ts).toDateString()
    if (!seen.has(key)) {
      seen.add(key)
      items.push({ type: "date", label: dateLabel(message.ts) })
    }
    items.push({ type: "message", message })
  }

  return items
}

export default function ChatDetailPage({ params }: { params: { chatId: string } }) {
  const [conv, setConv] = useState<Conversation | null>(null)
  const [text, setText] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const reload = useCallback(() => {
    seedConversations()
    const next = getConversation(params.chatId)
    if (next) {
      markRead(params.chatId)
      setConv({ ...next })
    }
  }, [params.chatId])

  useEffect(() => {
    reload()
    window.addEventListener("nashlo-chats-change", reload)
    return () => window.removeEventListener("nashlo-chats-change", reload)
  }, [reload])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [conv?.messages.length])

  const items = useMemo(() => buildItems(conv?.messages ?? []), [conv?.messages])
  const autoEnabled = typeof window !== "undefined" && localStorage.getItem(AUTOREPLY_KEY) === "true"

  function resizeInput(element: HTMLTextAreaElement) {
    element.style.height = "auto"
    element.style.height = `${Math.min(element.scrollHeight, 116)}px`
  }

  function send() {
    const trimmed = text.trim()
    if (!trimmed || !conv) return

    sendMessage(conv.id, trimmed, "me")
    setText("")

    if (inputRef.current) {
      inputRef.current.style.height = "auto"
      inputRef.current.focus()
    }

    const enabled = localStorage.getItem(AUTOREPLY_KEY) === "true"
    if (enabled) {
      const reply = localStorage.getItem(REPLIES_KEY) || "Здравствуйте! Объявление актуально, готов ответить на вопросы."
      const delay = Number(localStorage.getItem(DELAY_KEY) || "0") * 1000
      setTimeout(() => sendMessage(conv.id, reply, "seller"), Math.max(delay, 800))
    }
  }

  function handleKey(event: React.KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      send()
    }
  }

  if (!conv) {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-white px-4 text-center text-zinc-950">
        <p className="text-zinc-400">Чат не найден.</p>
        <Link href="/chat" className="mt-4 rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white">
          К сообщениям
        </Link>
      </main>
    )
  }

  return (
    <main className="h-[100dvh] overflow-hidden bg-white text-zinc-950">
      <div className="mx-auto flex h-full max-w-2xl flex-col">
        <header className="shrink-0 border-b border-zinc-100 bg-white/95 px-4 pb-4 pt-[calc(env(safe-area-inset-top)+0.85rem)] backdrop-blur lg:pt-4">
          <div className="flex items-center gap-3">
            <Link href="/chat" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-3xl text-[hsl(var(--nashlo-orange))] lg:text-zinc-600 lg:hover:bg-zinc-100" aria-label="Назад">
              ‹
            </Link>
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br ${avatarTone(conv.sellerName)} text-lg font-bold text-white shadow-lg shadow-zinc-200`}>
              {conv.sellerName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-semibold leading-tight">{conv.listingTitle}</p>
              <p className="mt-0.5 truncate text-sm text-zinc-400">Чат с «{conv.sellerName}»</p>
            </div>
            {autoEnabled && (
              <span className="hidden shrink-0 rounded-full bg-[hsl(var(--nashlo-mint)/0.15)] px-3 py-1 text-xs font-semibold text-[hsl(var(--nashlo-mint))] sm:inline-flex">
                Автоответ
              </span>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <div>
              <p className="rounded-full bg-[hsl(var(--nashlo-orange)/0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[hsl(var(--nashlo-orange))]">
                Продавец на связи
              </p>
              <p className="mt-2 text-sm text-zinc-500">{conv.city || "Город не указан"}</p>
            </div>
            {conv.id !== "support" && (
              <Link href={conv.listingCategory === "cars" ? `/cars/${conv.id}` : `/listings/${conv.id}`} className="rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-950">
                Объявление
              </Link>
            )}
          </div>
        </header>

        <section className="min-h-0 flex-1 overflow-y-auto bg-zinc-50 px-3 py-4 lg:px-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className={`flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${avatarTone(conv.sellerName)} text-2xl font-bold`}>
                {conv.sellerName.slice(0, 1).toUpperCase()}
              </div>
              <p className="mt-4 font-semibold">Начните диалог</p>
              <p className="mt-1 text-sm text-zinc-400">Напишите продавцу первое сообщение.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {items.map((item, index) => {
                if (item.type === "date") {
                  return (
                    <div key={`date-${index}`} className="flex justify-center py-3">
                      <span className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-500">
                        {item.label}
                      </span>
                    </div>
                  )
                }

                const message = item.message
                const isMe = message.from === "me"
                const next = items[index + 1]
                const isLastInGroup = next?.type !== "message" || next.message.from !== message.from

                return (
                  <div key={message.id} className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                    {!isMe && (
                      <div className={`h-7 w-7 shrink-0 ${isLastInGroup ? `flex items-center justify-center rounded-full bg-gradient-to-br ${avatarTone(conv.sellerName)} text-xs font-bold text-white` : "invisible"}`}>
                        {isLastInGroup ? conv.sellerName.slice(0, 1).toUpperCase() : ""}
                      </div>
                    )}
                    <div className="flex max-w-[78%] flex-col sm:max-w-[72%]">
                      <div
                        className={`break-words px-4 py-2.5 text-base leading-snug lg:text-sm ${
                          isMe
                            ? "rounded-[22px] rounded-br-md bg-[hsl(var(--nashlo-orange))] text-white shadow-sm shadow-[hsl(var(--nashlo-orange)/0.2)]"
                            : "rounded-[22px] rounded-bl-md bg-white text-zinc-950 shadow-sm"
                        }`}
                      >
                        {message.text}
                      </div>
                      {isLastInGroup && (
                        <p className={`mt-1 text-xs text-zinc-500 ${isMe ? "text-right" : "text-left"}`}>
                          {timeLabel(message.ts)}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </section>

        <footer className="shrink-0 border-t border-zinc-100 bg-white px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 lg:px-4">
          <div className="flex items-end gap-2">
            <button type="button" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-2xl text-zinc-500" aria-label="Прикрепить файл">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l9.193-9.193a3 3 0 1 1 4.243 4.243l-9.193 9.193a1.5 1.5 0 1 1-2.121-2.121l8.486-8.486" />
              </svg>
            </button>
            <textarea
              ref={inputRef}
              value={text}
              onChange={(event) => {
                setText(event.target.value)
                resizeInput(event.target)
              }}
              onKeyDown={handleKey}
              rows={1}
              placeholder="Ваше сообщение"
              className="max-h-[116px] min-h-12 min-w-0 flex-1 resize-none overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-base leading-6 text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-[hsl(var(--nashlo-orange))] focus:bg-white"
            />
            <button
              type="button"
              onClick={send}
              disabled={!text.trim()}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--nashlo-orange))] text-white transition disabled:bg-zinc-100 disabled:text-zinc-400"
              aria-label="Отправить"
            >
              ↑
            </button>
          </div>
        </footer>
      </div>
    </main>
  )
}
