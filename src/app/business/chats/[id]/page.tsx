"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { BusinessHeader } from "@/components/business/BusinessHeader"

type ChatMessage = {
  id: string
  text: string
  senderType: string
  sender: { id: string; name: string | null }
}

type ConversationDetail = {
  company: { name: string } | null
  messages: ChatMessage[]
}

export default function BusinessBuyerChatThreadPage() {
  const params = useParams<{ id: string }>()
  const [conv, setConv] = useState<ConversationDetail | null>(null)
  const [meId, setMeId] = useState<string | null>(null)
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void (async () => {
      const me = await fetch("/api/auth/me").then((r) => (r.ok ? r.json() : null))
      setMeId(me?.user?.id ?? me?.id ?? null)
      const res = await fetch(`/api/business/messages/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setConv(data.conversation ?? null)
      }
    })()
  }, [params.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conv?.messages.length])

  async function send() {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setSending(true)
    const res = await fetch(`/api/business/messages/${params.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed }),
    })
    const data = await res.json().catch(() => ({}))
    setSending(false)
    if (res.ok) {
      setText("")
      setConv((c) => (c ? { ...c, messages: [...c.messages, data.message] } : c))
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F6F8]">
      <BusinessHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6">
        <Link href="/business/chats" className="text-sm font-semibold text-[hsl(var(--nashlo-orange))]">
          ← К переписке с компаниями
        </Link>
        <h1 className="mt-4 text-lg font-bold text-zinc-950">{conv?.company?.name ?? "Компания"}</h1>
        <div className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-4">
          {conv?.messages.map((msg) => {
            const mine = msg.sender.id === meId
            const label =
              msg.senderType === "COMPANY" ? conv?.company?.name ?? "Компания" : msg.sender.name ?? "Вы"
            return (
              <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                    mine ? "bg-[hsl(var(--nashlo-orange))] text-white" : "bg-zinc-100 text-zinc-900"
                  }`}
                >
                  <p className="text-xs font-semibold opacity-80">{label}</p>
                  <p className="mt-0.5">{msg.text}</p>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
        <div className="mt-4 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 rounded-xl border border-zinc-200 px-4 py-3 text-sm"
            placeholder="Сообщение…"
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={sending || !text.trim()}
            className="rounded-xl bg-[hsl(var(--nashlo-orange))] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            Отправить
          </button>
        </div>
      </main>
    </div>
  )
}
