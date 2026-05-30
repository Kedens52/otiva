"use client"

import Link from "next/link"
import { Fragment, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ChatFraudHint } from "@/components/marketplace/ChatFraudHint"
import { SupportChat } from "@/components/support/SupportChat"

type ConvMember = {
  userId: string
  user: { id: string; name: string | null; avatar: string | null; phone: string | null }
}

type Conversation = {
  id: string
  updatedAt: string
  listing: { id: string; title: string; price: number; images: string[] } | null
  members: ConvMember[]
  lastMessage: {
    text: string
    sender: { id: string; name: string | null }
    createdAt: string
  } | null
  unreadCount: number
}

type Filter = "all" | "unread" | "sales" | "buying"

type ChatMessage = {
  id: string
  text: string
  images: string[]
  createdAt: string
  sender: { id: string; name: string | null; avatar: string | null }
}

type ConversationDetail = {
  id: string
  listing: { id: string; title: string; price: number; images: string[]; status: string } | null
  members: ConvMember[]
  messages: ChatMessage[]
}

function timeLabel(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  if (diff < 60_000) return "только что"
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} мин`

  const date = new Date(ts)
  const now = new Date()
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
  }

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return "вчера"

  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })
}

function priceLabel(price?: number) {
  if (!price) return "Цена не указана"
  return new Intl.NumberFormat("ru-RU").format(price) + " ₽"
}

function avatarTone(seed: string) {
  const tones = [
    "from-[hsl(var(--nashlo-orange))] to-orange-400",
    "from-sky-500 to-indigo-500",
    "from-emerald-500 to-teal-400",
    "from-zinc-800 to-zinc-500",
  ]
  return tones[(seed.charCodeAt(0) || 0) % tones.length]
}

function initials(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "Н"
}

function messageTime(ts: string) {
  return new Date(ts).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
}

export default function ChatPage() {
  const router = useRouter()
  const [convs, setConvs] = useState<Conversation[]>([])
  const [meId, setMeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selected, setSelected] = useState<ConversationDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [messageText, setMessageText] = useState("")
  const [sending, setSending] = useState(false)
  const [panelMode, setPanelMode] = useState<"empty" | "conversation" | "support">("empty")
  const bottomRef = useRef<HTMLDivElement>(null)
  const messagesScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const meRes = await fetch("/api/auth/me")
      if (!meRes.ok) {
        router.push("/login?from=/chat")
        return
      }

      const meData = await meRes.json()
      setMeId(meData.user?.id ?? meData.id)

      const res = await fetch("/api/messages/conversations")
      if (res.ok) {
        const data = await res.json()
        setConvs(data.conversations ?? [])
      }

      setLoading(false)
    }

    load()
  }, [router])

  function getOther(conv: Conversation) {
    return conv.members.find((member) => member.userId !== meId)?.user ?? conv.members[0]?.user
  }

  const totalUnread = convs.reduce((sum, conv) => sum + conv.unreadCount, 0)

  const filtered = useMemo(() => {
    return convs.filter((conv) => {
      const other = getOther(conv)
      const haystack = `${other?.name ?? ""} ${conv.listing?.title ?? ""} ${conv.lastMessage?.text ?? ""}`.toLowerCase()
      const matchesQuery = !query || haystack.includes(query.toLowerCase().trim())

      if (!matchesQuery) return false
      if (filter === "unread") return conv.unreadCount > 0
      if (filter === "sales") return conv.lastMessage?.sender.id !== meId
      if (filter === "buying") return conv.lastMessage?.sender.id === meId
      return true
    })
  }, [convs, filter, query, meId])

  const filters: Array<{ id: Filter; label: string; count?: number }> = [
    { id: "all", label: "Все" },
    { id: "unread", label: "Новые", count: totalUnread },
    { id: "sales", label: "Покупатели" },
    { id: "buying", label: "Мои" },
  ]

  useEffect(() => {
    if (!selectedId || panelMode !== "conversation") return
    let cancelled = false

    async function loadDetail() {
      setDetailLoading(true)
      const res = await fetch(`/api/messages/${selectedId}`)
      if (cancelled) return
      if (res.ok) {
        const data = await res.json()
        setSelected(data.conversation ?? null)
      }
      setDetailLoading(false)
    }

    loadDetail()
    const timer = window.setInterval(loadDetail, 5000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [selectedId, panelMode])

  useEffect(() => {
    const el = messagesScrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
  }, [selected?.messages.length, panelMode])

  async function sendMessage() {
    const trimmed = messageText.trim()
    if (panelMode !== "conversation" || !selectedId || !trimmed || sending) return

    setSending(true)
    setMessageText("")

    try {
      const res = await fetch(`/api/messages/${selectedId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      })
      if (res.ok) {
        const data = await res.json()
        setSelected((current) => current ? { ...current, messages: [...current.messages, data.message] } : current)
        setConvs((current) => current.map((conv) => (
          conv.id === selectedId
            ? { ...conv, updatedAt: data.message.createdAt, lastMessage: data.message, unreadCount: 0 }
            : conv
        )))
      } else {
        setMessageText(trimmed)
      }
    } catch {
      setMessageText(trimmed)
    } finally {
      setSending(false)
    }
  }

  function handleMessageKey(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  const selectedOther = selected
    ? selected.members.find((member) => member.userId !== meId)?.user ?? selected.members[0]?.user
    : null
  const selectedName = selectedOther?.name ?? "Пользователь"

  return (
    <main className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-white lg:rounded-2xl lg:border lg:border-zinc-200 lg:shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="grid h-full min-h-0 w-full flex-1 lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)]">
        <aside className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-zinc-200 bg-white lg:border-r">
          <header className="shrink-0 border-b border-zinc-100 bg-white px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] lg:static lg:px-5 lg:pb-4 lg:pt-5">
            <h1 className="text-[22px] font-bold leading-tight tracking-tight text-zinc-950 lg:text-2xl">Сообщения</h1>
            <p className="mt-0.5 hidden text-sm text-zinc-500 lg:block">Личная переписка по обычным объявлениям</p>
            <p className="mt-2 hidden text-xs text-zinc-500 lg:block">
              <Link href="/business/chats" className="font-semibold text-[hsl(var(--nashlo-orange))] underline">
                Переписка с компаниями (B2B)
              </Link>
              {" · "}
              <Link href="/business/dashboard/messages" className="underline">
                бизнес-кабинет
              </Link>
            </p>

            <div className="mt-4 flex h-11 items-center gap-2.5 rounded-full bg-[#F2F2F2] px-4">
              <svg className="h-[18px] w-[18px] shrink-0 text-zinc-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m21 21-4.35-4.35M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Поиск по чатам"
                className="min-w-0 flex-1 bg-transparent text-[15px] text-zinc-950 outline-none placeholder:text-zinc-400"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-zinc-400"
                  aria-label="Очистить поиск"
                >
                  ×
                </button>
              ) : null}
            </div>

            <div className="-mx-4 mt-3 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] lg:-mx-5 lg:px-5 [&::-webkit-scrollbar]:hidden">
              {filters.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={`flex h-9 shrink-0 snap-start items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold transition ${
                    filter === item.id
                      ? "bg-[#FF4F12] text-white"
                      : "bg-[#F2F2F2] text-zinc-700"
                  }`}
                >
                  {item.label}
                  {!!item.count && (
                    <span className={`rounded-full px-1.5 text-[11px] ${filter === item.id ? "bg-white/20 text-white" : "bg-white text-zinc-500"}`}>
                      {item.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </header>

          <section className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-2 lg:px-3 lg:pb-4">
            <Link
              href="/support"
              className="mb-3 flex items-center gap-3 rounded-2xl bg-[#FFF6F0] px-4 py-3.5 transition active:bg-[#FFEDE3] lg:hidden"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FF4F12] text-lg font-bold text-white">
                ?
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[15px] font-semibold text-zinc-950">Поддержка Нашло</p>
                  <span className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#FF4F12]">
                    важно
                  </span>
                </div>
                <p className="mt-0.5 truncate text-sm text-zinc-500">
                  Поможем с объявлениями, оплатой и безопасностью
                </p>
              </div>
              <span className="text-lg text-zinc-300">›</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                setPanelMode("support")
                setSelectedId(null)
                setSelected(null)
                setMessageText("")
              }}
              className={`mb-3 hidden w-full items-center gap-3 rounded-[22px] border px-4 py-4 text-left transition lg:flex ${
                panelMode === "support" ? "border-[hsl(var(--nashlo-orange)/0.35)] bg-orange-50" : "border-orange-100 bg-orange-50 hover:bg-orange-100"
              }`}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[hsl(var(--nashlo-orange))] text-lg font-bold text-white">
                ?
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold text-zinc-950">Поддержка Нашло</p>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-[hsl(var(--nashlo-orange))]">важно</span>
                </div>
                <p className="mt-0.5 truncate text-sm text-zinc-500">Откроется справа в этом окне</p>
              </div>
              <span className="text-xl text-[hsl(var(--nashlo-orange))]">›</span>
            </button>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-20 animate-pulse rounded-2xl bg-zinc-100" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex min-h-[52dvh] flex-col items-center justify-center px-2 text-center">
                <div className="flex h-[88px] w-[88px] items-center justify-center rounded-full border-2 border-[#FF4F12]/15 bg-[#FFF0E8]">
                  <svg className="h-9 w-9 text-[#FF4F12]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7A8.38 8.38 0 0 1 4 11.5a8.5 8.5 0 1 1 17 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="mt-5 text-[17px] font-bold text-zinc-950">
                  {query || filter !== "all" ? "Ничего не найдено" : "Пока нет чатов"}
                </p>
                <p className="mt-2 max-w-[280px] text-sm leading-6 text-zinc-500">
                  {query || filter !== "all"
                    ? "Попробуйте изменить фильтр или запрос."
                    : "Напишите продавцу из карточки объявления, и диалог появится здесь."}
                </p>
                {!query && filter === "all" ? (
                  <Link
                    href="/"
                    className="mt-6 flex h-12 w-full max-w-[320px] items-center justify-center rounded-2xl bg-[#FF4F12] text-[15px] font-semibold text-white transition active:bg-[#E8470F]"
                  >
                    Перейти к объявлениям
                  </Link>
                ) : null}
              </div>
            ) : (
              <div className="space-y-0.5">
                {filtered.map((conv) => {
                  const other = getOther(conv)
                  const name = other?.name ?? "Пользователь"
                  const title = conv.listing?.title ?? "Чат"
                  const img = conv.listing?.images?.[0]
                  const lastText = conv.lastMessage
                    ? `${conv.lastMessage.sender.id === meId ? "Вы: " : ""}${conv.lastMessage.text}`
                    : "Пока нет сообщений"

                  return (
                    <Fragment key={conv.id}>
                    <Link
                      href={`/messages/${conv.id}`}
                      className="group flex min-w-0 items-center gap-3 rounded-2xl px-2 py-3 transition active:bg-zinc-50 lg:hidden"
                    >
                      <div className="relative shrink-0">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img} alt="" className="h-[52px] w-[52px] rounded-xl object-cover" />
                        ) : (
                          <div className={`flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-gradient-to-br ${avatarTone(name)} text-base font-bold text-white`}>
                            {initials(name)}
                          </div>
                        )}
                        {conv.unreadCount > 0 ? (
                          <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#FF4F12]" />
                        ) : null}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-zinc-950">{title}</p>
                          <span className="shrink-0 text-xs text-zinc-400">{timeLabel(conv.updatedAt)}</span>
                        </div>
                        <p className="mt-0.5 truncate text-sm text-zinc-500">{name}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <p className={`min-w-0 flex-1 truncate text-sm ${conv.unreadCount > 0 ? "font-semibold text-zinc-800" : "text-zinc-400"}`}>
                            {lastText}
                          </p>
                          {conv.unreadCount > 0 ? (
                            <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-[#FF4F12] px-1.5 text-[11px] font-bold text-white">
                              {conv.unreadCount}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </Link>
                    <button
                      key={`${conv.id}-desktop`}
                      type="button"
                      onClick={() => {
                        setPanelMode("conversation")
                        setSelectedId(conv.id)
                        setMessageText("")
                        setConvs((current) => current.map((item) => item.id === conv.id ? { ...item, unreadCount: 0 } : item))
                      }}
                      className={`group hidden w-full min-w-0 items-center gap-3 rounded-[22px] border bg-white px-3 py-3 text-left transition hover:border-zinc-200 hover:bg-zinc-50 lg:flex lg:px-4 ${
                        panelMode === "conversation" && selectedId === conv.id ? "border-[hsl(var(--nashlo-orange)/0.35)] bg-orange-50" : "border-transparent"
                      }`}
                    >
                      <div className="relative shrink-0">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img} alt="" className="h-14 w-14 rounded-[18px] object-cover ring-1 ring-zinc-100" />
                        ) : (
                          <div className={`flex h-14 w-14 items-center justify-center rounded-[18px] bg-gradient-to-br ${avatarTone(name)} text-lg font-bold text-white`}>
                            {initials(name)}
                          </div>
                        )}
                        {conv.unreadCount > 0 && <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-[hsl(var(--nashlo-orange))]" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-zinc-950">{title}</p>
                          <span className="shrink-0 text-xs text-zinc-400">{timeLabel(conv.updatedAt)}</span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-2">
                          <p className="min-w-0 truncate text-sm text-zinc-500">{name}</p>
                          {conv.listing && <span className="shrink-0 text-xs text-zinc-300">•</span>}
                          {conv.listing && <p className="shrink-0 text-xs font-semibold text-zinc-500">{priceLabel(conv.listing.price)}</p>}
                        </div>
                        <p className={`mt-1 truncate text-sm ${conv.unreadCount > 0 ? "font-semibold text-zinc-800" : "text-zinc-400"}`}>
                          {lastText}
                        </p>
                      </div>

                      {conv.unreadCount > 0 ? (
                        <span className="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--nashlo-orange))] px-2 text-xs font-bold text-white">
                          {conv.unreadCount}
                        </span>
                      ) : (
                        <span className="text-xl text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-zinc-500">›</span>
                      )}
                    </button>
                    </Fragment>
                  )
                })}
              </div>
            )}
          </section>
        </aside>

        <section className="hidden h-full min-h-0 min-w-0 flex-col overflow-hidden bg-[#fafafa] lg:flex">
          {panelMode === "empty" ? (
            <div className="flex h-full flex-col p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[hsl(var(--nashlo-orange))]">Центр сообщений</p>
                  <h2 className="mt-2 max-w-xl text-4xl font-semibold tracking-tight text-zinc-950">Выберите диалог слева</h2>
                  <p className="mt-3 max-w-lg text-sm leading-6 text-zinc-500">Переписка откроется здесь, в этом же окне. Так можно быстро переключаться между покупателями и объявлениями.</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <svg className="h-7 w-7 text-[hsl(var(--nashlo-orange))]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7A8.38 8.38 0 0 1 4 11.5a8.5 8.5 0 1 1 17 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              <div className="mt-auto grid grid-cols-3 gap-3">
                {[
                  ["Диалогов", convs.length],
                  ["Новых", totalUnread],
                  ["Поддержка", "онлайн"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[22px] bg-white p-5 shadow-sm">
                    <p className="text-2xl font-semibold text-zinc-950">{value}</p>
                    <p className="mt-1 text-sm text-zinc-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : panelMode === "support" ? (
            <SupportChat compactHeader className="h-full" />
          ) : detailLoading && !selected ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-[hsl(var(--nashlo-orange))]" />
            </div>
          ) : selected ? (
            <div className="flex h-full min-h-0 flex-col overflow-hidden">
              <header className="shrink-0 border-b border-zinc-200 bg-white px-5 py-4">
                <div className="flex items-center gap-4">
                  {selectedOther?.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedOther.avatar} alt="" className="h-12 w-12 rounded-[18px] object-cover" />
                  ) : (
                    <div className={`flex h-12 w-12 items-center justify-center rounded-[18px] bg-gradient-to-br ${avatarTone(selectedName)} text-lg font-bold text-white`}>
                      {initials(selectedName)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-semibold text-zinc-950">{selectedName}</p>
                    {selected.listing && <p className="truncate text-sm text-zinc-500">{selected.listing.title} · {priceLabel(selected.listing.price)}</p>}
                  </div>
                  {selectedOther?.id && (
                    <Link href={`/profile/${selectedOther.id}`} className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50">
                      Профиль
                    </Link>
                  )}
                  {selected.listing && (
                    <Link href={`/listings/${selected.listing.id}`} className="rounded-2xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-200">
                      Объявление
                    </Link>
                  )}
                </div>
                {selected.listing && (
                  <Link href={`/listings/${selected.listing.id}`} className="mt-4 flex items-center gap-3 rounded-[20px] border border-zinc-200 bg-zinc-50 p-3 transition hover:border-zinc-300 hover:bg-white">
                    {selected.listing.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={selected.listing.images[0]} alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-zinc-200 text-xs font-semibold text-zinc-500">
                        фото
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[hsl(var(--nashlo-orange))]">Пишут по объявлению</p>
                      <p className="mt-1 truncate text-sm font-semibold text-zinc-950">{selected.listing.title}</p>
                      <p className="mt-0.5 text-sm font-bold text-zinc-950">{priceLabel(selected.listing.price)}</p>
                    </div>
                    <span className="text-xl text-zinc-300">›</span>
                  </Link>
                )}
              </header>

              <div ref={messagesScrollRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
                {selected.messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className={`flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${avatarTone(selectedName)} text-2xl font-bold text-white`}>
                      {initials(selectedName)}
                    </div>
                    <p className="mt-4 font-semibold text-zinc-950">Начните диалог</p>
                    <p className="mt-1 text-sm text-zinc-500">Сообщение появится у собеседника сразу после отправки.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selected.messages.map((message) => {
                      const isMe = message.sender.id === meId
                      return (
                        <div key={message.id} className={"flex flex-col gap-1 " + (isMe ? "items-end" : "items-start")}>
                          <div className={`max-w-[72%] rounded-[22px] px-4 py-2.5 shadow-sm ${isMe ? "rounded-br-md bg-[hsl(var(--nashlo-orange))] text-white" : "rounded-bl-md bg-white text-zinc-950"}`}>
                            <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.text}</p>
                            <p className={`mt-1 text-right text-[11px] ${isMe ? "text-white/70" : "text-zinc-400"}`}>{messageTime(message.createdAt)}</p>
                          </div>
                          <ChatFraudHint draftText={message.text} className="max-w-[88%]" />
                        </div>
                      )
                    })}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>

              <footer className="shrink-0 border-t border-zinc-200 bg-white px-5 py-4">
                <ChatFraudHint draftText={messageText} className="mb-2" />
                <div className="flex items-end gap-3">
                  <textarea
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    onKeyDown={handleMessageKey}
                    rows={1}
                    placeholder="Ваше сообщение"
                    className="max-h-32 min-h-12 min-w-0 flex-1 resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-6 text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-[hsl(var(--nashlo-orange))] focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={sendMessage}
                    disabled={!messageText.trim() || sending}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--nashlo-orange))] text-xl font-semibold text-white transition disabled:bg-zinc-100 disabled:text-zinc-400"
                    aria-label="Отправить"
                  >
                    ↑
                  </button>
                </div>
              </footer>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-center text-sm text-zinc-500">
              Диалог не найден.
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
