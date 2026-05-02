"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

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

function timeLabel(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  if (diff < 60_000) return "только что"
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} мин`
  const date = new Date(ts)
  const now = new Date()
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
  }
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return "вчера"
  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })
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

export default function ChatPage() {
  const router = useRouter()
  const [convs, setConvs] = useState<Conversation[]>([])
  const [meId, setMeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")

  useEffect(() => {
    async function load() {
      const meRes = await fetch("/api/auth/me")
      if (!meRes.ok) { router.push("/login?from=/chat"); return }
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
    return conv.members.find((m) => m.userId !== meId)?.user ?? conv.members[0]?.user
  }

  const filtered = convs.filter((c) => {
    if (!query) return true
    const other = getOther(c)
    const text = `${other?.name ?? ""} ${c.listing?.title ?? ""}`.toLowerCase()
    return text.includes(query.toLowerCase())
  })

  return (
    <main className="min-h-[100dvh] bg-white text-zinc-950 lg:min-h-0">
      <div className="mx-auto flex min-h-[100dvh] max-w-2xl flex-col lg:min-h-0 lg:px-4 lg:py-10">
        <header className="sticky top-0 z-20 border-b border-zinc-100 bg-white/95 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.9rem)] backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:px-0 lg:pb-6 lg:pt-0">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 lg:text-4xl">Сообщения</h1>
          <div className="mt-3 flex h-12 items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 shadow-sm">
            <span className="text-lg text-zinc-400">⌕</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск по чатам"
              className="min-w-0 flex-1 bg-transparent text-sm text-zinc-950 outline-none placeholder:text-zinc-400" />
            {query && <button type="button" onClick={() => setQuery("")} className="text-zinc-400">×</button>}
          </div>
        </header>

        <section className="flex-1 overflow-y-auto px-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 lg:px-0">
          <Link href="/support" className="mb-3 flex items-center gap-3 rounded-[24px] border border-orange-100 bg-orange-50 px-4 py-4 transition hover:bg-orange-100">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-[hsl(var(--nashlo-orange))] text-lg font-bold text-white">?</div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-zinc-950">Поддержка Нашло</p>
              <p className="mt-0.5 truncate text-sm text-zinc-500">Вопросы по объявлениям, оплате и безопасности</p>
            </div>
            <span className="text-xl text-[hsl(var(--nashlo-orange))]">›</span>
          </Link>
          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map((i) => <div key={i} className="h-20 rounded-2xl bg-zinc-100 animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex min-h-[55dvh] flex-col items-center justify-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[hsl(var(--nashlo-orange)/0.1)] text-4xl">💬</div>
              <p className="mt-4 text-lg font-semibold">{query ? "Ничего не найдено" : "Пока нет чатов"}</p>
              <p className="mt-1 max-w-xs text-sm text-zinc-400">Напишите продавцу из карточки объявления, и диалог появится здесь.</p>
              <Link href="/search" className="mt-5 rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white">Перейти к объявлениям</Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[28px] border border-zinc-100 bg-white shadow-sm">
              {filtered.map((conv, index) => {
                const other = getOther(conv)
                const name = other?.name ?? "Пользователь"
                const title = conv.listing?.title ?? "Чат"
                const img = conv.listing?.images?.[0]

                return (
                  <article key={conv.id} className={index > 0 ? "border-t border-zinc-100" : ""}>
                    <Link href={`/messages/${conv.id}`} className="flex min-w-0 items-center gap-3 px-4 py-4 hover:bg-zinc-50 transition">
                      {img ? (
                        <img src={img} alt="" className="h-14 w-14 shrink-0 rounded-[18px] object-cover" />
                      ) : (
                        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br ${avatarTone(name)} text-lg font-bold text-white`}>
                          {name[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="min-w-0 flex-1 truncate font-semibold text-zinc-950">{title}</p>
                          <span className="shrink-0 text-xs text-zinc-400">{timeLabel(conv.updatedAt)}</span>
                        </div>
                        <p className="mt-0.5 text-sm text-zinc-500 truncate">{name}</p>
                        {conv.lastMessage && (
                          <p className="mt-0.5 truncate text-sm text-zinc-400">
                            {conv.lastMessage.sender.id === meId ? "Вы: " : ""}{conv.lastMessage.text}
                          </p>
                        )}
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--nashlo-orange))] px-1.5 text-xs font-bold text-white">
                          {conv.unreadCount}
                        </span>
                      )}
                    </Link>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
