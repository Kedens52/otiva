"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import {
  getConversation, markRead, sendMessage, loadChats,
  seedConversations, type Conversation,
} from "@/lib/chat-store"

const AUTOREPLY_KEY = "otiva-autoreply-enabled"
const REPLIES_KEY   = "otiva-autoreply-text"
const DELAY_KEY     = "otiva-autoreply-delay"

function timeLabel(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
}

export default function ChatDetailPage({ params }: { params: { chatId: string } }) {
  const [conv, setConv] = useState<Conversation | null>(null)
  const [text, setText] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  function reload() {
    seedConversations()
    const c = getConversation(params.chatId)
    if (c) { markRead(params.chatId); setConv({ ...c }) }
  }

  useEffect(() => {
    reload()
    window.addEventListener("otiva-chats-change", reload)
    return () => window.removeEventListener("otiva-chats-change", reload)
  }, [params.chatId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conv?.messages.length])

  function send() {
    const trimmed = text.trim()
    if (!trimmed || !conv) return
    sendMessage(conv.id, trimmed, "me")
    setText("")

    // Auto-responder
    const enabled = localStorage.getItem(AUTOREPLY_KEY) === "true"
    if (enabled) {
      const reply = localStorage.getItem(REPLIES_KEY) || "Здравствуйте! Объявление актуально, готов ответить на вопросы."
      const delay = Number(localStorage.getItem(DELAY_KEY) || "0") * 1000
      setTimeout(() => {
        sendMessage(conv.id, reply, "seller")
      }, Math.max(delay, 800))
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() }
  }

  if (!conv) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 text-center">
        <p className="text-zinc-500">Чат не найден.</p>
        <Link href="/chat" className="mt-4 inline-block text-sm font-semibold text-zinc-950 underline">← К сообщениям</Link>
      </main>
    )
  }

  const autoEnabled = typeof window !== "undefined" && localStorage.getItem(AUTOREPLY_KEY) === "true"

  return (
    <main className="mx-auto flex max-w-3xl flex-col px-4 pb-4 pt-6 lg:py-6" style={{ height: "calc(100dvh - 64px)" }}>
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <Link href="/chat" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200">
          ←
        </Link>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 overflow-hidden">
          <img src={`/listings/${conv.listingCategory}.svg`} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-zinc-950">{conv.sellerName}</p>
          <p className="truncate text-xs text-zinc-500">{conv.listingTitle}</p>
        </div>
        {autoEnabled && (
          <span className="ml-auto shrink-0 rounded-full bg-[hsl(var(--otiva-mint)/0.15)] px-2.5 py-1 text-xs font-semibold text-[hsl(var(--otiva-mint))]">
            Автоответ вкл
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-[24px] border border-zinc-200 bg-zinc-50 p-4">
        {conv.messages.length === 0 && (
          <p className="mt-8 text-center text-sm text-zinc-400">Начните диалог — напишите первое сообщение</p>
        )}
        <div className="space-y-2">
          {conv.messages.map((msg, i) => {
            const isMe = msg.from === "me"
            const showTime = i === 0 || msg.ts - conv.messages[i - 1].ts > 300000
            return (
              <div key={msg.id}>
                {showTime && (
                  <p className="my-2 text-center text-xs text-zinc-400">{timeLabel(msg.ts)}</p>
                )}
                <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  {!isMe && (
                    <div className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center self-end rounded-full bg-zinc-300 text-xs font-semibold text-zinc-700">
                      {conv.sellerName[0]}
                    </div>
                  )}
                  <div className={`max-w-[78%] rounded-3xl px-4 py-2.5 text-sm leading-6 ${isMe ? "rounded-br-md bg-zinc-950 text-white" : "rounded-bl-md bg-white text-zinc-950 shadow-sm"}`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-3 flex gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          placeholder="Напишите сообщение… (Enter — отправить)"
          className="min-w-0 flex-1 resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[hsl(var(--otiva-orange))]"
        />
        <button
          onClick={send}
          disabled={!text.trim()}
          className="shrink-0 rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-40"
        >
          ↑
        </button>
      </div>
    </main>
  )
}
