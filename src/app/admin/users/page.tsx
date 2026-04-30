"use client"

import { useState } from "react"

type UserStatus = "Активен" | "Заблокирован" | "На проверке"

const USERS = [
  { id: "1", name: "Алексей Морозов",   phone: "+7 916 123-45-67", city: "Москва",          listings: 12, rating: 4.9, joined: "15 янв 2024", status: "Активен"      as UserStatus, verified: true  },
  { id: "2", name: "Марина Волкова",    phone: "+7 921 234-56-78", city: "Санкт-Петербург", listings: 5,  rating: 4.8, joined: "03 мар 2024", status: "Активен"      as UserStatus, verified: true  },
  { id: "3", name: "Илья Соколов",      phone: "+7 903 345-67-89", city: "Казань",           listings: 3,  rating: 4.7, joined: "20 июн 2024", status: "На проверке"  as UserStatus, verified: false },
  { id: "4", name: "Анна Павлова",      phone: "+7 995 456-78-90", city: "Екатеринбург",    listings: 8,  rating: 4.8, joined: "01 авг 2023", status: "Активен"      as UserStatus, verified: true  },
  { id: "5", name: "Дмитрий Федоров",   phone: "+7 911 567-89-01", city: "Новосибирск",     listings: 1,  rating: 0,   joined: "10 апр 2025", status: "Заблокирован" as UserStatus, verified: false },
  { id: "6", name: "Екатерина Лебедева",phone: "+7 926 678-90-12", city: "Самара",          listings: 4,  rating: 4.7, joined: "22 фев 2024", status: "Активен"      as UserStatus, verified: true  },
]

const STATUS_COLOR: Record<UserStatus, string> = {
  "Активен":      "bg-[hsl(var(--otiva-mint)/0.15)] text-[hsl(var(--otiva-mint))]",
  "Заблокирован": "bg-red-100 text-red-600",
  "На проверке":  "bg-[hsl(var(--otiva-orange)/0.12)] text-[hsl(var(--otiva-orange))]",
}

export default function AdminUsersPage() {
  const [search, setSearch]     = useState("")
  const [statuses, setStatuses] = useState<Record<string, UserStatus>>(
    Object.fromEntries(USERS.map((u) => [u.id, u.status]))
  )

  const filtered = USERS.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.phone.includes(search) ||
    u.city.toLowerCase().includes(search.toLowerCase())
  )

  function ban(id: string)     { setStatuses((s) => ({ ...s, [id]: "Заблокирован" })) }
  function unban(id: string)   { setStatuses((s) => ({ ...s, [id]: "Активен" })) }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Пользователи</h1>
          <p className="mt-1 text-sm text-zinc-500">Управление аккаунтами, бан и верификация.</p>
        </div>
        <div className="flex gap-3">
          {(["Активен","Заблокирован","На проверке"] as UserStatus[]).map((s) => (
            <div key={s} className="rounded-[20px] border border-zinc-200 bg-white px-4 py-3 text-center shadow-sm">
              <p className="text-xl font-semibold text-zinc-950">{USERS.filter((u) => u.status === s).length}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{s}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по имени, телефону или городу…"
          className="h-11 w-full max-w-sm rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none transition focus:border-[hsl(var(--otiva-orange))]"
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-[24px] border border-zinc-200 bg-white shadow-sm">
        <div className="hidden grid-cols-[minmax(0,2fr)_1fr_0.7fr_0.7fr_1fr_auto] gap-4 border-b border-zinc-100 bg-zinc-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-400 lg:grid">
          <span>Пользователь</span><span>Телефон</span><span>Объявления</span><span>Рейтинг</span><span>Статус</span><span>Действия</span>
        </div>
        <div className="divide-y divide-zinc-100">
          {filtered.map((user) => {
            const status = statuses[user.id]
            return (
              <div key={user.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[minmax(0,2fr)_1fr_0.7fr_0.7fr_1fr_auto] lg:items-center">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--otiva-orange)/0.15)] text-sm font-semibold text-[hsl(var(--otiva-orange))]">
                      {user.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-zinc-950">{user.name}</p>
                      <p className="truncate text-xs text-zinc-500">{user.city} · с {user.joined}</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-zinc-600">{user.phone}</p>
                <p className="text-sm font-semibold text-zinc-950">{user.listings}</p>
                <p className="text-sm font-semibold text-zinc-950">{user.rating > 0 ? user.rating : "—"}</p>
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLOR[status]}`}>{status}</span>
                <div className="flex gap-2">
                  {status === "Заблокирован" ? (
                    <button onClick={() => unban(user.id)} className="rounded-xl bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-200">
                      Разбанить
                    </button>
                  ) : (
                    <button onClick={() => ban(user.id)} className="rounded-xl bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100">
                      Бан
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
