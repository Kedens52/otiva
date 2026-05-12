"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getAdminCsrfFromDocument } from "@/lib/admin/csrf-client"

type User = {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  vkId: string | null
  yandexId: string | null
  city: string | null
  rating: number
  isVerified: boolean
  emailVerified: boolean
  phoneVerifiedAt: string | null
  isBanned: boolean
  role: string
  walletBalance: number
  lastLoginAt: string | null
  lastLoginIp: string | null
  createdAt: string
  _count: { listings: number }
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value / 100)
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
      } catch (error) {
        console.error(error)
      }
      setLoading(false)
    }
    load()
  }, [debounced])

  async function toggleBan(userId: string, isBanned: boolean) {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": getAdminCsrfFromDocument() },
      body: JSON.stringify({ userId, isBanned }),
    })
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isBanned } : u))
    }
  }

  const bannedCount = users.filter((u) => u.isBanned).length
  const activeCount = users.filter((u) => !u.isBanned).length
  const verifiedCount = users.filter((u) => u.isVerified || u.phoneVerifiedAt || u.vkId || u.yandexId).length

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Пользователи</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Досье профилей: контакты, привязки, активность, объявления и признаки спама.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Активных", activeCount],
            ["Проверенных", verifiedCount],
            ["Заблокировано", bannedCount],
            ["Всего", total],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-[20px] border border-zinc-200 bg-white px-4 py-3 text-center shadow-sm">
              <p className="text-xl font-semibold text-zinc-950">{value}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по имени, телефону или городу..."
          className="h-11 w-full max-w-md rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none transition focus:border-[hsl(var(--nashlo-orange))]"
        />
        <p className="text-xs text-zinc-400">Кнопка “Досье” открывает полную карточку пользователя.</p>
      </div>

      <div className="mt-4 overflow-hidden rounded-[24px] border border-zinc-200 bg-white shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-sm text-zinc-400">Загрузка...</div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-400">Пользователей не найдено</div>
        ) : (
          <>
            <div className="hidden grid-cols-[minmax(0,2fr)_1.2fr_1.3fr_1fr_0.9fr_auto] gap-4 border-b border-zinc-100 bg-zinc-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-400 lg:grid">
              <span>Пользователь</span>
              <span>Контакты</span>
              <span>Проверка</span>
              <span>Активность</span>
              <span>Объявления</span>
              <span>Действия</span>
            </div>
            <div className="divide-y divide-zinc-100">
              {users.map((user) => {
                const avatarLetter = (user.name ?? user.phone ?? user.email ?? "?")[0].toUpperCase()
                return (
                  <div key={user.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[minmax(0,2fr)_1.2fr_1.3fr_1fr_0.9fr_auto] lg:items-center">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--nashlo-orange)/0.15)] text-sm font-semibold text-[hsl(var(--nashlo-orange))]">
                        {avatarLetter}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold text-zinc-950">{user.name ?? "Без имени"}</p>
                          {user.isBanned && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">Бан</span>}
                        </div>
                        <p className="truncate font-mono text-xs text-zinc-400">ID: {user.id}</p>
                        <p className="truncate text-xs text-zinc-500">
                          {user.city ?? "Город не указан"} · с {new Date(user.createdAt).toLocaleDateString("ru-RU")}
                        </p>
                      </div>
                    </div>

                    <div className="min-w-0 text-sm">
                      <p className="truncate text-zinc-700">{user.phone ?? "Телефон не указан"}</p>
                      <p className="truncate text-xs text-zinc-500">{user.email ?? "Email не указан"}</p>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {user.isVerified && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">Проверен</span>}
                      {user.phoneVerifiedAt && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">Телефон</span>}
                      {user.emailVerified && <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-700">Email</span>}
                      {user.vkId && <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">VK</span>}
                      {user.yandexId && <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">Яндекс</span>}
                      {!user.isVerified && !user.phoneVerifiedAt && !user.emailVerified && !user.vkId && !user.yandexId && (
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500">Нет привязок</span>
                      )}
                    </div>

                    <div className="text-sm text-zinc-600">
                      <p>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString("ru-RU") : "Не входил"}</p>
                      {user.lastLoginIp && <p className="truncate font-mono text-xs text-zinc-400">{user.lastLoginIp}</p>}
                      <p className="text-xs text-zinc-400">{formatMoney(user.walletBalance)}</p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-zinc-950">{user._count.listings}</p>
                      <p className="text-xs text-zinc-500">рейтинг {user.rating > 0 ? user.rating.toFixed(1) : "—"}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link href={`/admin/users/${user.id}`}
                        className="rounded-xl bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800">
                        Досье
                      </Link>
                      <Link href={`/profile/${user.id}`} target="_blank"
                        className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">
                        Профиль
                      </Link>
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
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
