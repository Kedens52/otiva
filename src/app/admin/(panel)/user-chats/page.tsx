"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader"
import { AdminPageShell } from "@/components/admin/layout/AdminPageShell"

type MemberUser = {
  id: string
  name: string | null
  avatar: string | null
  phone: string | null
  email?: string | null
}

type ConvRow = {
  id: string
  updatedAt: string
  createdAt: string
  listingId: string | null
  listing: { id: string; title: string; price: number; status: string; images: string[] } | null
  members: Array<{ userId: string; user: MemberUser }>
  lastMessage: {
    id: string
    text: string
    createdAt: string
    sender: { id: string; name: string | null }
  } | null
  messageCount: number
}

type Msg = {
  id: string
  text: string
  images: string[]
  createdAt: string
  sender: { id: string; name: string | null; avatar: string | null; role: string }
}

type ConvDetail = ConvRow & {
  messages: Msg[]
  messageCountTotal: number
  messagesTruncated: boolean
}

function timeShort(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
}

function AdminUserChatsContent() {
  const searchParams = useSearchParams()
  const initialUserId = searchParams.get("userId")?.trim() ?? ""

  const [userIdFilter, setUserIdFilter] = useState(initialUserId)
  const [searchQ, setSearchQ] = useState("")
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<ConvRow[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState("")

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<ConvDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState("")
  const [mobilePane, setMobilePane] = useState<"list" | "dialog">("list")

  const loadList = useCallback(async () => {
    setListLoading(true)
    setListError("")
    const sp = new URLSearchParams()
    if (userIdFilter.trim()) sp.set("userId", userIdFilter.trim())
    if (searchQ.trim()) sp.set("q", searchQ.trim())
    sp.set("page", String(page))
    const res = await fetch(`/api/admin/user-chats?${sp.toString()}`)
    if (res.status === 403) {
      setListError("Нет права на просмотр диалогов (users.viewChats).")
      setRows([])
      setListLoading(false)
      return
    }
    if (!res.ok) {
      setListError("Не удалось загрузить список диалогов.")
      setRows([])
      setListLoading(false)
      return
    }
    const data = await res.json()
    setRows(data.conversations ?? [])
    setTotal(data.total ?? 0)
    setHasMore(Boolean(data.hasMore))
    setListLoading(false)
  }, [userIdFilter, searchQ, page])

  useEffect(() => {
    void loadList()
  }, [loadList])

  useEffect(() => {
    if (!selectedId) {
      setDetail(null)
      return
    }
    let cancelled = false
    async function loadDetail() {
      setDetailLoading(true)
      setDetailError("")
      const res = await fetch(`/api/admin/user-chats/${selectedId}`)
      if (cancelled) return
      if (!res.ok) {
        setDetail(null)
        setDetailError(res.status === 404 ? "Диалог не найден." : "Не удалось загрузить сообщения.")
        setDetailLoading(false)
        return
      }
      const data = await res.json()
      setDetail(data.conversation ?? null)
      setDetailLoading(false)
    }
    void loadDetail()
    return () => {
      cancelled = true
    }
  }, [selectedId])

  function memberLine(m: ConvRow["members"][0]) {
    const u = m.user
    return (
      <span key={m.userId} className="text-xs text-zinc-600">
        <Link href={`/admin/users/${u.id}`} className="font-medium text-zinc-900 hover:underline">
          {u.name ?? u.phone ?? u.id.slice(0, 8)}
        </Link>
      </span>
    )
  }

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="Диалоги пользователей"
        description="Переписки по объявлениям (не поддержка). Для разбора спорных ситуаций. Открытие диалога фиксируется в аудите."
      />

      <div className="mt-6 flex flex-col gap-3 rounded-[20px] border border-zinc-200 bg-zinc-50 p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex w-full min-w-0 flex-1 flex-col gap-1 sm:min-w-[200px]">
          <span className="text-xs font-medium text-zinc-500">ID пользователя</span>
          <input
            value={userIdFilter}
            onChange={(e) => {
              setUserIdFilter(e.target.value)
              setPage(1)
            }}
            placeholder="cuid — только диалоги с участием"
            className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]"
          />
        </label>
        <label className="flex w-full min-w-0 flex-[2] flex-col gap-1 sm:min-w-[220px]">
          <span className="text-xs font-medium text-zinc-500">Поиск по тексту, объявлению, имени, телефону</span>
          <input
            value={searchQ}
            onChange={(e) => {
              setSearchQ(e.target.value)
              setPage(1)
            }}
            placeholder="Например: предоплата, доставка…"
            className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]"
          />
        </label>
        <button
          type="button"
          onClick={() => void loadList()}
          className="h-10 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Обновить
        </button>
      </div>

      {listError && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{listError}</p>
      )}

      <div className="grid min-h-[min(70dvh,640px)] overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm lg:min-h-[640px] lg:grid-cols-[minmax(0,380px)_1fr]">
        <aside
          className={`flex max-h-[70dvh] flex-col border-b border-zinc-200 lg:max-h-[min(80vh,900px)] lg:border-b-0 lg:border-r ${
            mobilePane === "dialog" ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="border-b border-zinc-100 px-4 py-3 text-xs text-zinc-500">
            Найдено: {total.toLocaleString("ru-RU")} · страница {page}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {listLoading ? (
              <p className="px-4 py-10 text-center text-sm text-zinc-400">Загрузка…</p>
            ) : rows.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-zinc-400">Нет диалогов по фильтру</p>
            ) : (
              rows.map((c) => {
                const active = c.id === selectedId
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(c.id)
                      setMobilePane("dialog")
                    }}
                    className={`block w-full border-t border-zinc-100 px-4 py-3 text-left text-sm transition first:border-t-0 ${
                      active ? "bg-orange-50/80" : "hover:bg-zinc-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium text-zinc-950">{c.listing?.title ?? "Без объявления"}</span>
                      <span className="shrink-0 text-[11px] text-zinc-400">{timeShort(c.updatedAt)}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{c.lastMessage?.text ?? "—"}</p>
                    <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1">{c.members.map(memberLine)}</div>
                    <p className="mt-1 text-[11px] text-zinc-400">{c.messageCount} сообщ.</p>
                  </button>
                )
              })
            )}
          </div>
          <div className="flex shrink-0 items-center justify-between gap-2 border-t border-zinc-100 px-3 py-2">
            <button
              type="button"
              disabled={page <= 1 || listLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 disabled:opacity-40"
            >
              Назад
            </button>
            <button
              type="button"
              disabled={!hasMore || listLoading}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 disabled:opacity-40"
            >
              Далее
            </button>
          </div>
        </aside>

        <section
          className={`flex max-h-[70dvh] flex-col bg-white lg:max-h-[min(80vh,900px)] ${
            mobilePane === "list" ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="flex shrink-0 items-center gap-2 border-b border-zinc-100 px-3 py-2 lg:hidden">
            <button
              type="button"
              onClick={() => setMobilePane("list")}
              className="inline-flex items-center gap-1 rounded-xl px-2 py-1.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
            >
              <ChevronLeft className="h-4 w-4" />
              К диалогам
            </button>
          </div>
          {!selectedId ? (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-zinc-400">
              Выберите диалог слева
            </div>
          ) : detailLoading ? (
            <div className="flex flex-1 items-center justify-center p-8 text-sm text-zinc-400">Загрузка сообщений…</div>
          ) : detailError ? (
            <div className="flex flex-1 items-center justify-center p-8 text-sm text-red-600">{detailError}</div>
          ) : detail ? (
            <>
              <header className="shrink-0 border-b border-zinc-100 px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-950">{detail.listing?.title ?? "Чат"}</h2>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {detail.members.map((m) => (
                        <Link
                          key={m.userId}
                          href={`/admin/users/${m.user.id}`}
                          className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-100"
                        >
                          {m.user.name ?? m.user.phone ?? m.user.id.slice(0, 8)}
                          {m.user.phone ? <span className="ml-1 text-zinc-500">{m.user.phone}</span> : null}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-xs">
                    {detail.listing && (
                      <Link
                        href={`/listings/${detail.listing.id}`}
                        target="_blank"
                        className="font-semibold text-[hsl(var(--nashlo-orange))] hover:underline"
                      >
                        Открыть объявление ↗
                      </Link>
                    )}
                    <span className="text-zinc-400">ID: {detail.id}</span>
                  </div>
                </div>
                {detail.messagesTruncated && (
                  <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    Показаны последние {detail.messages.length} из {detail.messageCountTotal} сообщений.
                  </p>
                )}
              </header>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
                {detail.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className="max-w-[92%] rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2 text-[11px] text-zinc-500">
                        <span className="font-semibold text-zinc-700">{msg.sender.name ?? msg.sender.id.slice(0, 8)}</span>
                        <span>{timeShort(msg.createdAt)}</span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
                    </div>
                  ))}
              </div>
            </>
          ) : null}
        </section>
      </div>
    </AdminPageShell>
  )
}

export default function AdminUserChatsPage() {
  return (
    <Suspense
      fallback={
        <AdminPageShell className="py-16 text-center text-sm text-zinc-500">Загрузка…</AdminPageShell>
      }
    >
      <AdminUserChatsContent />
    </Suspense>
  )
}
