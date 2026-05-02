"use client"

import { useEffect, useState } from "react"

type User = {
  id: string
  name: string | null
  phone: string
  city: string | null
  rating: number
  isVerified: boolean
  isBanned: boolean
  role: string
  createdAt: string
  _count: { listings: number }
}

const STATUS_COLOR = {
  banned: "bg-red-100 text-red-600",
  active: "bg-emerald-50 text-emerald-700",
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [debounced, setDebounced] = useState("")

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 400)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const sp = new URLSearchParams()
        if (debounced) sp.set("q", debounced)
        const res = await fetch(`/api/admin/users?${sp.toString()}`)
        if (res.ok) {
          const data = await res.json()
          setUsers(data.items ?? [])
          setTotal(data.total ?? 0)
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [debounced])

  async function toggleBan(userId: string, isBanned: boolean) {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, isBanned }),
    })
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isBanned } : u))
    }
  }

  const bannedCount  = users.filter((u) => u.isBanned).length
  const activeCount  = users.filter((u) => !u.isBanned).length

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Пользователи</h1>
          <p className="mt-1 text-sm text-zinc-500">Управление аккаунтами, бан и верификация.</p>
        </div>
        <div className="flex gap-3">
          <div className="rounded-[20px] border border-zinc-200 bg-white px-4 py-3 text-center shadow-sm">
            <p className="text-xl font-semibold text-zinc-950">{activeCount}</p>
            <p className="mt-0.5 text-xs text-zinc-500">Активных</p>
          </div>
          <div className="rounded-[20px] border border-zinc-200 bg-white px-4 py-3 text-center shadow-sm">
            <p className="text-xl font-semibold text-zinc-950">{bannedCount}</p>
            <p className="mt-0.5 text-xs text-zinc-500">Заблокировано</p>
          </div>
          <div className="rounded-[20px] border border-zinc-200 bg-white px-4 py-3 text-center shadow-sm">
            <p className="text-xl font-semibold text-zinc-950">{total}</p>
            <p className="mt-0.5 text-xs text-zinc-500">Всего</p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по имени, телефону или городу…"
          className="h-11 w-full max-w-sm rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none transition focus:border-[hsl(var(--nashlo-orange))]"
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-[24px] border border-zinc-200 bg-white shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-sm text-zinc-400">Загрузка…</div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-400">Пользователей не найдено</div>
        ) : (
          <>
            <div className="hidden grid-cols-[minmax(0,2fr)_1fr_0.7fr_0.7fr_auto] gap-4 border-b border-zinc-100 bg-zinc-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-400 lg:grid">
              <span>Пользователь</span><span>Телефон</span><span>Объявления</span><span>Рейтинг</span><span>Действия</span>
            </div>
            <div className="divide-y divide-zinc-100">
              {users.map((user) => (
                <div key={user.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[minmax(0,2fr)_1fr_0.7fr_0.7fr_auto] lg:items-center">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--nashlo-orange)/0.15)] text-sm font-semibold text-[hsl(var(--nashlo-orange))]">
                      {(user.name ?? user.phone)[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-zinc-950">{user.name ?? "—"}</p>
                      <p className="truncate text-xs text-zinc-500">{user.city ?? "—"} · с {new Date(user.createdAt).toLocaleDateString("ru-RU")}</p>
                    </div>
                    {user.isBanned && <span className="ml-1 shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">Бан</span>}
                  </div>
                  <p className="text-sm text-zinc-600">{user.phone}</p>
                  <p className="text-sm font-semibold text-zinc-950">{user._count.listings}</p>
                  <p className="text-sm font-semibold text-zinc-950">{user.rating > 0 ? user.rating.toFixed(1) : "—"}</p>
                  <div className="flex gap-2">
                    {user.isBanned ? (
                      <button onClick={() => toggleBan(user.id, false)}
                        className="rounded-xl bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-200">
                        Разбанить
                      </button>
                    ) : (
                      <button onClick={() => toggleBan(user.id, true)}
                        className="rounded-xl bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100">
                        Бан
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
