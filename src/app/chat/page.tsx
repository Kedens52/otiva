"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { loadChats, seedConversations, totalUnread, type Conversation } from "@/lib/chat-store"

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60000)   return "только что"
  if (diff < 3600000) return Math.floor(diff / 60000) + " мин назад"
  if (diff < 86400000) return Math.floor(diff / 3600000) + " ч назад"
  return Math.floor(diff / 86400000) + " д назад"
}

export default function ChatPage() {
  const [convs, setConvs] = useState<Conversation[]>([])

  function reload() {
    seedConversations()
    const all = loadChats()
    setConvs(Object.values(all).sort((a, b) => b.updatedAt - a.updatedAt))
  }

  useEffect(() => {
    reload()
    window.addEventListener("otiva-chats-change", reload)
    return () => window.removeEventListener("otiva-chats-change", reload)
  }, [])

  const unread = totalUnread()

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 lg:py-10">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">Сообщения</h1>
        {unread > 0 && (
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[hsl(var(--otiva-orange))] px-1.5 text-xs font-bold text-white">
            {unread}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-zinc-500">Переписка по объявлениям сохраняется в браузере.</p>

      {convs.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-5xl">💬</p>
          <p className="mt-4 font-semibold text-zinc-950">Нет сообщений</p>
          <p className="mt-1 text-sm text-zinc-500">Напишите продавцу из карточки объявления</p>
          <Link href="/feed" className="mt-5 inline-block rounded-2xl bg-zinc-950 px-6 py-3 text-sm font-semibold text-white">
            Перейти в ленту
          </Link>
        </div>
      ) : (
        <section className="mt-5 overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
          {convs.map((conv) => {
            const last = conv.messages[conv.messages.length - 1]
            const unreadCount = conv.messages.filter((m) => m.from === "seller" && !m.read).length
            return (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className="flex items-center gap-4 border-b border-zinc-100 px-4 py-4 transition last:border-b-0 hover:bg-zinc-50"
              >
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-zinc-100">
                  <img src={`/listings/${conv.listingCategory}.svg`} alt="" className="h-full w-full rounded-2xl object-cover" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[hsl(var(--otiva-orange))] px-1 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`truncate text-sm ${unreadCount > 0 ? "font-bold text-zinc-950" : "font-semibold text-zinc-800"}`}>
                      {conv.listingTitle}
                    </p>
                    <span className="shrink-0 text-xs text-zinc-400">{timeAgo(conv.updatedAt)}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500">{conv.sellerName} · {conv.city}</p>
                  {last && (
                    <p className={`mt-1 truncate text-sm ${unreadCount > 0 ? "font-medium text-zinc-950" : "text-zinc-500"}`}>
                      {last.from === "me" ? "Вы: " : ""}{last.text}
                    </p>
                  )}
                </div>
              </Link>
            )
          })}
        </section>
      )}
    </main>
  )
}
