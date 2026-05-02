"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"

type ChatMessage = {
  id: string
  text: string
  images: string[]
  createdAt: string
  sender: { id: string; name: string | null; avatar: string | null }
}
type ConvData = {
  id: string
  listing: { id: string; title: string; price: number; images: string[]; status: string } | null
  members: Array<{ userId: string; user: { id: string; name: string | null; avatar: string | null; phone: string | null } }>
  messages: ChatMessage[]
}

function timeLabel(ts: string): string {
  return new Date(ts).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
}
function dateLabel(ts: string): string {
  const date = new Date(ts)
  const now = new Date()
  if (date.toDateString() === now.toDateString()) return "Сегодня"
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return "Вчера"
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })
}

function avatarTone(seed: string) {
  const tones = [
    "from-[hsl(var(--nashlo-orange))] to-orange-400",
    "from-sky-500 to-indigo-500",
    "from-emerald-500 to-teal-400",
    "from-zinc-700 to-zinc-500",
  ]
  return tones[(seed.charCodeAt(0) ?? 0) % tones.length]
}

export default function ChatDetailPage({ params }: { params: { chatId: string } }) {
  const [conv, setConv] = useState<ConvData | null>(null)
  const [meId, setMeId] = useState<string | null>(null)
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchConv = useCallback(async () => {
    const res = await fetch(`/api/messages/${params.chatId}`)
    if (res.ok) {
      const data = await res.json()
      setConv(data.conversation)
    }
    setLoading(false)
  }, [params.chatId])

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setMeId(d.user?.id ?? d.id) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchConv()
    // Poll every 4 seconds for new messages
    pollRef.current = setInterval(fetchConv, 4000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [fetchConv])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [conv?.messages.length])

  async function send() {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setSending(true)
    setText("")
    if (inputRef.current) inputRef.current.style.height = "auto"

    try {
      const res = await fetch(`/api/messages/${params.chatId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      })
      if (res.ok) {
        const data = await res.json()
        setConv((prev) => prev ? { ...prev, messages: [...prev.messages, data.message] } : prev)
      }
    } catch {
      setText(trimmed) // restore on error
    } finally {
      setSending(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() }
  }

  function resizeInput(el: HTMLTextAreaElement) {
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 116)}px`
  }

  if (loading) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950" />
      </main>
    )
  }

  if (!conv) {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-white px-4 text-center">
        <p className="text-zinc-400">Чат не найден.</p>
        <Link href="/chat" className="mt-4 rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white">К сообщениям</Link>
      </main>
    )
  }

  const other = conv.members.find((m) => m.userId !== meId)?.user ?? conv.members[0]?.user
  const otherName = other?.name ?? "Пользователь"
  const tone = avatarTone(otherName)

  // Build items with date separators
  type Item = { type: "date"; label: string } | { type: "msg"; msg: ChatMessage }
  const items: Item[] = []
  const seen = new Set<string>()
  for (const msg of conv.messages) {
    const key = new Date(msg.createdAt).toDateString()
    if (!seen.has(key)) { seen.add(key); items.push({ type: "date", label: dateLabel(msg.createdAt) }) }
    items.push({ type: "msg", msg })
  }

  return (
    <main className="h-[100dvh] overflow-hidden bg-white text-zinc-950">
      <div className="mx-auto flex h-full max-w-2xl flex-col">
        <header className="shrink-0 border-b border-zinc-100 bg-white/95 px-4 pb-4 pt-[calc(env(safe-area-inset-top)+0.85rem)] backdrop-blur lg:pt-4">
          <div className="flex items-center gap-3">
            <Link href="/chat" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-3xl text-[hsl(var(--nashlo-orange))]">‹</Link>
            {other?.avatar ? (
              <img src={other.avatar} alt="" className="h-12 w-12 shrink-0 rounded-[18px] object-cover" />
            ) : (
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br ${tone} text-lg font-bold text-white`}>
                {otherName[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-semibold leading-tight">{otherName}</p>
              {conv.listing && (
                <p className="mt-0.5 truncate text-sm text-zinc-400">{conv.listing.title}</p>
              )}
            </div>
            {conv.listing && (
              <Link href={`/listings/${conv.listing.id}`}
                className="shrink-0 rounded-2xl bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-200">
                Объявление
              </Link>
            )}
          </div>
        </header>

        <section className="min-h-0 flex-1 overflow-y-auto bg-zinc-50 px-3 py-4 lg:px-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className={`flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${tone} text-2xl font-bold`}>
                {otherName[0]?.toUpperCase()}
              </div>
              <p className="mt-4 font-semibold">Начните диалог</p>
              <p className="mt-1 text-sm text-zinc-400">Напишите первое сообщение.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {items.map((item, index) => {
                if (item.type === "date") {
                  return (
                    <div key={`date-${index}`} className="flex justify-center py-3">
                      <span className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-500">{item.label}</span>
                    </div>
                  )
                }
                const { msg } = item
                const isMe = msg.sender.id === meId
                const next = items[index + 1]
                const isLast = next?.type !== "msg" || next.msg.sender.id !== msg.sender.id

                return (
                  <div key={msg.id} className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                    {!isMe && (
                      <div className={`h-7 w-7 shrink-0 ${isLast ? `flex items-center justify-center rounded-full bg-gradient-to-br ${tone} text-xs font-bold text-white` : "invisible"}`}>
                        {isLast ? (otherName[0]?.toUpperCase()) : ""}
                      </div>
                    )}
                    <div className="flex max-w-[78%] flex-col sm:max-w-[72%]">
                      <div className={`break-words px-4 py-2.5 text-base leading-snug lg:text-sm ${isMe
                        ? "rounded-[22px] rounded-br-md bg-[hsl(var(--nashlo-orange))] text-white shadow-sm"
                        : "rounded-[22px] rounded-bl-md bg-white text-zinc-950 shadow-sm"
                      }`}>
                        {msg.text}
                      </div>
                      {isLast && (
                        <p className={`mt-1 text-xs text-zinc-500 ${isMe ? "text-right" : "text-left"}`}>
                          {timeLabel(msg.createdAt)}
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
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => { setText(e.target.value); resizeInput(e.target) }}
              onKeyDown={handleKey}
              rows={1}
              placeholder="Ваше сообщение"
              className="max-h-[116px] min-h-12 min-w-0 flex-1 resize-none overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-base leading-6 text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-[hsl(var(--nashlo-orange))] focus:bg-white"
            />
            <button type="button" onClick={send} disabled={!text.trim() || sending}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--nashlo-orange))] text-white transition disabled:bg-zinc-100 disabled:text-zinc-400">
              ↑
            </button>
          </div>
        </footer>
      </div>
    </main>
  )
}
