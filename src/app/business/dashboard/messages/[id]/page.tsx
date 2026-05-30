"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { BusinessSectionGuard } from "@/components/business/BusinessSectionGuard"
import { businessContextLabel } from "@/lib/messaging/labels"

type ChatMessage = {
  id: string
  text: string
  createdAt: string
  senderType: string
  senderCompanyId: string | null
  sender: { id: string; name: string | null; avatar: string | null }
}

type ConversationDetail = {
  id: string
  contextType: string
  companyId: string | null
  company: { id: string; name: string; logoUrl: string | null } | null
  businessListing: { title: string; slug: string | null } | null
  businessInquiry: { type: string } | null
  members: { userId: string; user: { name: string | null } }[]
  messages: ChatMessage[]
}

export default function BusinessDashboardMessageThreadPage() {
  const params = useParams<{ id: string }>()
  const [conv, setConv] = useState<ConversationDetail | null>(null)
  const [meId, setMeId] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  async function load() {
    const meRes = await fetch("/api/auth/me")
    if (!meRes.ok) return
    const meData = await meRes.json()
    setMeId(meData.user?.id ?? meData.id)

    const biz = await fetch("/api/business/me").then((r) => (r.ok ? r.json() : null))
    setCompanyId(biz?.primary?.companyId ?? null)

    const res = await fetch(`/api/business/messages/${params.id}`)
    if (res.ok) {
      const data = await res.json()
      setConv(data.conversation ?? null)
    }
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [params.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conv?.messages.length])

  async function send() {
    const trimmed = text.trim()
    if (!trimmed || sending || !conv) return
    setSending(true)
    const res = await fetch(`/api/business/messages/${params.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: trimmed,
        companyId: companyId ?? conv.companyId ?? undefined,
      }),
    })
    const data = await res.json().catch(() => ({}))
    setSending(false)
    if (res.ok) {
      setText("")
      setConv((c) =>
        c ? { ...c, messages: [...c.messages, data.message] } : c,
      )
    }
  }

  const isCompanySide =
    conv?.companyId && companyId === conv.companyId

  function senderLabel(msg: ChatMessage) {
    if (msg.senderType === "COMPANY" && conv?.company?.name) {
      return conv.company.name
    }
    return msg.sender.name ?? "Пользователь"
  }

  return (
    <BusinessSectionGuard section="messages">
      <div className="flex min-h-0 flex-1 flex-col">
        <Link
          href="/business/dashboard/messages"
          className="mb-4 text-sm font-semibold text-[hsl(var(--nashlo-orange))]"
        >
          ← Все бизнес-сообщения
        </Link>

        {loading ? (
          <p className="text-sm text-zinc-500">Загрузка…</p>
        ) : !conv ? (
          <p className="text-sm text-zinc-500">Диалог не найден</p>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            <header className="shrink-0 border-b border-zinc-100 px-4 py-3">
              <p className="font-semibold text-zinc-950">
                {businessContextLabel(conv.contextType, conv.businessInquiry?.type)}
              </p>
              {conv.businessListing && (
                <p className="text-sm text-zinc-600">{conv.businessListing.title}</p>
              )}
              {isCompanySide && (
                <p className="mt-1 text-xs text-zinc-500">Ответ от имени компании</p>
              )}
            </header>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-zinc-50/50 p-4">
              {conv.messages.map((msg) => {
                const mine = msg.sender.id === meId
                return (
                  <div
                    key={msg.id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                        mine
                          ? "bg-[hsl(var(--nashlo-orange))] text-white"
                          : "border border-zinc-200 bg-white text-zinc-900"
                      }`}
                    >
                      <p className="text-xs font-semibold opacity-80">{senderLabel(msg)}</p>
                      <p className="mt-0.5 whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            <div className="shrink-0 border-t border-zinc-100 p-3 sm:p-4">
              <div className="flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    void send()
                  }
                }}
                placeholder="Сообщение…"
                className="flex-1 rounded-xl border border-zinc-200 px-4 py-3 text-sm"
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
            </div>
          </div>
        )}
      </div>
    </BusinessSectionGuard>
  )
}
