"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { loadChats, seedConversations, totalUnread, type Conversation } from "@/lib/chat-store"
import { Logo } from "@/components/layout/Logo"

function timeLabel(ts: number): string {
  const now = new Date()
  const date = new Date(ts)
  const diff = Date.now() - ts

  if (diff < 60_000) return "только что"
  if (diff < 60 * 60_000) return `${Math.floor(diff / 60_000)} мин`
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
  }

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return "вчера"

  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" })
}

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

function avatarLetter(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "Н"
}

export default function ChatPage() {
  const [convs, setConvs] = useState<Conversation[]>([])
  const [query, setQuery] = useState("")

  function reload() {
    seedConversations()
    const all = loadChats()
    setConvs(Object.values(all).sort((a, b) => b.updatedAt - a.updatedAt))
  }

  useEffect(() => {
    reload()
    window.addEventListener("nashlo-chats-change", reload)
    return () => window.removeEventListener("nashlo-chats-change", reload)
  }, [])

  const unread = totalUnread()
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return convs
    return convs.filter((chat) =>
      `${chat.sellerName} ${chat.listingTitle} ${chat.city}`.toLowerCase().includes(normalized)
    )
  }, [convs, query])

  return (
    <main className="min-h-[100dvh] bg-white text-zinc-950 lg:min-h-0">
      <div className="mx-auto flex min-h-[100dvh] max-w-2xl flex-col lg:min-h-0 lg:px-4 lg:py-10">
        <header className="sticky top-0 z-20 border-b border-zinc-100 bg-white/95 px-4 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] backdrop-blur lg:static lg:rounded-none lg:border-0 lg:bg-transparent lg:px-0 lg:pb-6 lg:pt-0">
          <div className="flex items-center justify-between">
            <Link href="/feed" className="flex h-10 w-10 items-center justify-center rounded-full text-2xl text-[hsl(var(--nashlo-orange))] lg:hidden" aria-label="Назад">
              ‹
            </Link>
            <div className="hidden lg:block">
              <h1 className="text-4xl font-semibold tracking-tight">Сообщения</h1>
            </div>
            <div className="lg:hidden">
              <Logo compact />
            </div>
            <Link href="/create" className="flex h-10 w-10 items-center justify-center rounded-full text-2xl text-[hsl(var(--nashlo-orange))] lg:hidden" aria-label="Новое объявление">
              ✎
            </Link>
          </div>
          <div className="mt-4 flex items-center gap-3 lg:hidden">
            <h1 className="flex-1 text-center text-2xl font-semibold tracking-tight text-zinc-950">Сообщения</h1>
            {unread > 0 && (
              <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-[hsl(var(--nashlo-orange))] px-2 text-xs font-bold text-white">
                {unread}
              </span>
            )}
          </div>
          <div className="mt-4 flex h-12 items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 shadow-sm shadow-zinc-200/40 lg:bg-zinc-100">
            <span className="text-lg text-zinc-400">⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Поиск по чатам"
              className="min-w-0 flex-1 bg-transparent text-sm text-zinc-950 outline-none placeholder:text-zinc-400"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} className="text-zinc-400 hover:text-zinc-950">
                ×
              </button>
            )}
          </div>
        </header>

        <section className="min-h-0 flex-1 overflow-y-auto px-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 lg:px-0 lg:pb-0">
          {filtered.length === 0 ? (
            <div className="flex min-h-[55dvh] flex-col items-center justify-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[hsl(var(--nashlo-orange)/0.1)] text-4xl">💬</div>
              <p className="mt-4 text-lg font-semibold">{query ? "Ничего не найдено" : "Пока нет чатов"}</p>
              <p className="mt-1 max-w-xs text-sm text-zinc-400">Напишите продавцу из карточки объявления, и диалог появится здесь.</p>
              <Link href="/feed" className="mt-5 rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white">
                Перейти в ленту
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[28px] border border-zinc-100 bg-white shadow-sm">
              {filtered.map((conv, index) => {
                const last = conv.messages[conv.messages.length - 1]
                const unreadCount = conv.messages.filter((msg) => msg.from === "seller" && !msg.read).length
                const isSupport = conv.id === "support"

                return (
                  <Link
                    key={conv.id}
                    href={`/messages/${conv.id}`}
                    className={`flex min-w-0 items-center gap-3 px-4 py-4 transition active:bg-zinc-50 lg:hover:bg-zinc-50 ${index > 0 ? "border-t border-zinc-100" : ""}`}
                  >
                    <div className={`relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[22px] bg-gradient-to-br ${isSupport ? "from-[hsl(var(--nashlo-orange))] to-orange-400" : avatarTone(conv.sellerName)} text-xl font-bold text-white shadow-lg shadow-zinc-200`}>
                      {isSupport ? "?" : avatarLetter(conv.sellerName)}
                      {unreadCount > 0 && <span className="absolute right-1.5 top-1.5 h-3 w-3 rounded-full bg-[hsl(var(--nashlo-orange))]" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="min-w-0 flex-1 truncate text-lg font-semibold leading-tight text-zinc-950">
                          {isSupport ? "Поддержка" : conv.listingTitle}
                        </p>
                        <span className="shrink-0 text-sm text-zinc-400">{timeLabel(conv.updatedAt)}</span>
                      </div>
                      <p className="mt-1 truncate text-sm text-zinc-400">
                        {last ? `${last.from === "me" ? "Вы: " : `${conv.sellerName}: `}${last.text}` : conv.city}
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--nashlo-orange))] px-1.5 text-xs font-bold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
