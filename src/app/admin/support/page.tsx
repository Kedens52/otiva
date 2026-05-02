"use client"

import { useEffect, useMemo, useState } from "react"

type User = {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  role: string
  createdAt?: string
}

type Message = {
  id: string
  text: string
  createdAt: string
  sender: { id: string; name: string | null; role: string }
}

type SupportConversation = {
  id: string
  updatedAt: string
  client: User | null
  messages: Message[]
  lastMessage: Message | null
  unreadCount: number
}

function timeLabel(value: string) {
  return new Date(value).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
}

export default function AdminSupportPage() {
  const [conversations, setConversations] = useState<SupportConversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  async function load() {
    setLoading(true)
    const res = await fetch("/api/admin/support")
    if (res.ok) {
      const data = await res.json()
      const items = data.conversations ?? []
      setConversations(items)
      setSelectedId((current) => current ?? items[0]?.id ?? null)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    const timer = setInterval(load, 7000)
    return () => clearInterval(timer)
  }, [])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return conversations
    return conversations.filter((conversation) => {
      const client = conversation.client
      const haystack = `${client?.id ?? ""} ${client?.name ?? ""} ${client?.phone ?? ""} ${client?.email ?? ""} ${conversation.lastMessage?.text ?? ""}`.toLowerCase()
      return haystack.includes(needle)
    })
  }, [conversations, query])

  const selected = conversations.find((item) => item.id === selectedId) ?? filtered[0] ?? null

  async function sendReply() {
    const trimmed = text.trim()
    if (!trimmed || !selected || sending) return
    setSending(true)
    setText("")
    try {
      const res = await fetch("/api/admin/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: selected.id, text: trimmed }),
      })
      if (res.ok) {
        const data = await res.json()
        setConversations((current) => current.map((conversation) => (
          conversation.id === selected.id
            ? { ...conversation, messages: [...conversation.messages, data.message], lastMessage: data.message, updatedAt: data.message.createdAt, unreadCount: 0 }
            : conversation
        )))
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Чат поддержки</h1>
          <p className="mt-1 text-sm text-zinc-500">Отдельные обращения пользователей для модераторов и поддержки.</p>
        </div>
        <div className="rounded-[20px] border border-zinc-200 bg-white px-4 py-3 text-center shadow-sm">
          <p className="text-xl font-semibold text-zinc-950">{conversations.reduce((sum, item) => sum + item.unreadCount, 0)}</p>
          <p className="mt-0.5 text-xs text-zinc-500">Новых сообщений</p>
        </div>
      </div>

      <div className="grid min-h-[680px] overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="border-b border-zinc-200 bg-zinc-50 lg:border-b-0 lg:border-r">
          <div className="p-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по ID, имени, телефону"
              className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]"
            />
          </div>
          <div className="max-h-[620px] overflow-y-auto">
            {loading ? (
              <p className="px-4 py-8 text-center text-sm text-zinc-400">Загрузка...</p>
            ) : filtered.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-zinc-400">Обращений пока нет</p>
            ) : filtered.map((conversation) => {
              const client = conversation.client
              const active = selected?.id === conversation.id
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setSelectedId(conversation.id)}
                  className={`block w-full border-t border-zinc-200 px-4 py-4 text-left transition ${active ? "bg-white" : "hover:bg-white/70"}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--nashlo-orange)/0.14)] font-bold text-[hsl(var(--nashlo-orange))]">
                      {(client?.name || client?.phone || "?")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="min-w-0 flex-1 truncate font-semibold text-zinc-950">{client?.name || "Пользователь"}</p>
                        {conversation.unreadCount > 0 && (
                          <span className="rounded-full bg-[hsl(var(--nashlo-orange))] px-2 py-0.5 text-xs font-bold text-white">{conversation.unreadCount}</span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate font-mono text-[11px] text-zinc-400">ID: {client?.id || "—"}</p>
                      <p className="mt-1 truncate text-sm text-zinc-500">{conversation.lastMessage?.text || "Нет сообщений"}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        <section className="flex min-h-[680px] flex-col">
          {!selected ? (
            <div className="flex flex-1 items-center justify-center text-sm text-zinc-400">Выберите обращение</div>
          ) : (
            <>
              <header className="border-b border-zinc-100 px-5 py-4">
                <p className="text-lg font-semibold text-zinc-950">{selected.client?.name || "Пользователь"}</p>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                  <span className="font-mono">ID: {selected.client?.id || "—"}</span>
                  <span>{selected.client?.phone || "телефон не указан"}</span>
                  <span>{selected.client?.email || "почта не указана"}</span>
                </div>
              </header>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-zinc-50 px-5 py-5">
                {selected.messages.map((message) => {
                  const fromSupport = message.sender.role === "MODERATOR" || message.sender.role === "ADMIN"
                  return (
                    <div key={message.id} className={`flex ${fromSupport ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[72%] rounded-[22px] px-4 py-2.5 shadow-sm ${fromSupport ? "rounded-br-md bg-zinc-950 text-white" : "rounded-bl-md bg-white text-zinc-950"}`}>
                        <p className="break-words text-sm leading-6">{message.text}</p>
                        <p className={`mt-1 text-[11px] ${fromSupport ? "text-white/55" : "text-zinc-400"}`}>{timeLabel(message.createdAt)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <footer className="border-t border-zinc-100 p-4">
                <div className="flex items-end gap-2">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={2}
                    placeholder="Ответить пользователю"
                    className="min-h-12 flex-1 resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))] focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={sendReply}
                    disabled={!text.trim() || sending}
                    className="rounded-2xl bg-[hsl(var(--nashlo-orange))] px-5 py-3 text-sm font-semibold text-white disabled:bg-zinc-200 disabled:text-zinc-400"
                  >
                    Отправить
                  </button>
                </div>
              </footer>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
