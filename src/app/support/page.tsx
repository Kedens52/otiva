"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

type SupportMessage = {
  id: string
  text: string
  createdAt: string
  sender: { id: string; name: string | null; avatar: string | null; role: string }
}

type SupportConversation = {
  id: string
  messages: SupportMessage[]
}

function timeLabel(ts: string) {
  return new Date(ts).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
}

export default function SupportPage() {
  const router = useRouter()
  const [conversation, setConversation] = useState<SupportConversation | null>(null)
  const [meId, setMeId] = useState<string | null>(null)
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  async function load() {
    const meRes = await fetch("/api/auth/me")
    if (!meRes.ok) {
      router.push("/login?from=/support")
      return
    }
    const meData = await meRes.json()
    setMeId(meData.user?.id ?? meData.id)

    const res = await fetch("/api/support")
    if (res.ok) {
      const data = await res.json()
      setConversation(data.conversation)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    const timer = setInterval(load, 5000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conversation?.messages.length])

  async function send() {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setSending(true)
    setText("")
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      })
      if (res.ok) {
        const data = await res.json()
        setConversation((current) => current ? { ...current, messages: [...current.messages, data.message] } : current)
      }
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950" />
      </main>
    )
  }

  return (
    <main className="h-[100dvh] overflow-hidden bg-white text-zinc-950">
      <div className="mx-auto flex h-full max-w-2xl flex-col">
        <header className="shrink-0 border-b border-zinc-100 bg-white/95 px-4 pb-4 pt-[calc(env(safe-area-inset-top)+0.85rem)] backdrop-blur lg:pt-5">
          <div className="flex items-center gap-3">
            <Link href="/chat" className="flex h-10 w-10 items-center justify-center rounded-full text-3xl text-[hsl(var(--nashlo-orange))]">‹</Link>
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-zinc-950 text-lg font-bold text-white">Н</div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold">Поддержка Нашло</h1>
              <p className="text-sm text-zinc-400">Поможем с объявлением, оплатой или безопасностью</p>
            </div>
          </div>
        </header>

        <section className="min-h-0 flex-1 overflow-y-auto bg-zinc-50 px-3 py-4">
          {!conversation?.messages.length ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--nashlo-orange)/0.12)] text-2xl font-bold text-[hsl(var(--nashlo-orange))]">?</div>
              <p className="mt-4 font-semibold">Напишите в поддержку</p>
              <p className="mt-1 max-w-xs text-sm text-zinc-400">Опишите вопрос подробно. Модератор увидит ваше обращение в отдельном кабинете.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversation.messages.map((message) => {
                const isMe = message.sender.id === meId
                return (
                  <div key={message.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-[22px] px-4 py-2.5 shadow-sm ${isMe ? "rounded-br-md bg-[hsl(var(--nashlo-orange))] text-white" : "rounded-bl-md bg-white text-zinc-950"}`}>
                      <p className="break-words text-base leading-snug">{message.text}</p>
                      <p className={`mt-1 text-xs ${isMe ? "text-white/70" : "text-zinc-400"}`}>{timeLabel(message.createdAt)}</p>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </section>

        <footer className="shrink-0 border-t border-zinc-100 bg-white px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3">
          <div className="flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={1}
              placeholder="Ваш вопрос"
              className="max-h-[116px] min-h-12 min-w-0 flex-1 resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-base outline-none focus:border-[hsl(var(--nashlo-orange))] focus:bg-white"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
            />
            <button type="button" onClick={send} disabled={!text.trim() || sending}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--nashlo-orange))] text-white disabled:bg-zinc-100 disabled:text-zinc-400">
              ↑
            </button>
          </div>
        </footer>
      </div>
    </main>
  )
}
