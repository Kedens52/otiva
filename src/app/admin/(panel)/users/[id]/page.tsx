"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { getAdminCsrfFromDocument } from "@/lib/admin/csrf-client"

type Session = {
  id: string
  device: string | null
  userAgent: string | null
  ip: string | null
  lastActiveAt: string
  expiresAt: string
}

type Listing = {
  id: string
  title: string
  status: string
  price: number
  views: number
  uniqueViews: number
  rejectionReason: string | null
  createdAt: string
  category: { nameRu: string } | null
}

type Payment = {
  id: string
  orderId: string
  serviceType: string
  amount: number
  status: string
  createdAt: string
}

type WalletTx = {
  id: string
  type: string
  status: string
  amount: number
  balanceAfter: number
  title: string | null
  createdAt: string
}

type Report = {
  id: string
  reason: string
  comment: string
  status: string
  createdAt: string
  listing: { id: string; title: string } | null
}

type ModerationLog = {
  id: string
  action: string
  reason: string | null
  createdAt: string
  listing: { id: string; title: string } | null
  staff?: { id: string; login: string; displayName: string | null; role: string } | null
  moderator?: { id: string; name: string | null; phone: string | null } | null
}

type UserDetail = {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  city: string | null
  avatar: string | null
  role: string
  profileType: string
  companyName: string | null
  companyInn: string | null
  isVerified: boolean
  emailVerified: boolean
  isBanned: boolean
  walletBalance: number
  rating: number
  reviewCount: number
  createdAt: string
  updatedAt: string
  lastLoginAt: string | null
  lastLoginIp: string | null
  listings: Listing[]
  sessions: Session[]
  payments: Payment[]
  walletTransactions: WalletTx[]
  _count: { listings: number; reviews: number; favorites: number }
}

const STATUS_LABEL: Record<string, string> = {
  MODERATION: "На проверке",
  ACTIVE:     "Активно",
  REJECTED:   "Отклонено",
  ARCHIVED:   "Архив",
  SOLD:       "Продано",
}

const STATUS_COLOR: Record<string, string> = {
  MODERATION: "bg-amber-50 text-amber-700",
  ACTIVE:     "bg-emerald-50 text-emerald-700",
  REJECTED:   "bg-red-50 text-red-600",
  ARCHIVED:   "bg-zinc-100 text-zinc-500",
  SOLD:       "bg-blue-50 text-blue-600",
}

function fmt(n: number) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n / 100)
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<{ user: UserDetail; reports: Report[]; moderationLogs: ModerationLog[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<"listings" | "sessions" | "payments" | "wallet" | "reports" | "moderation">("listings")

  useEffect(() => {
    fetch(`/api/admin/users/${id}`)
      .then((r) => r.json())
      .then((d) => { if (d.ok) setData(d) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  async function patch(body: object) {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getAdminCsrfFromDocument() },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const d = await res.json()
        setData((prev) => prev ? { ...prev, user: { ...prev.user, ...d.user } } : prev)
      }
    } catch {}
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-lg font-medium text-zinc-950">Пользователь не найден</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-zinc-500 hover:underline">← Назад</button>
      </div>
    )
  }

  const { user, reports, moderationLogs } = data

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Back */}
      <button onClick={() => router.back()} className="mb-6 flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 transition">
        ← Пользователи
      </button>

      {/* Profile card */}
      <div className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--nashlo-orange)/0.15)] text-2xl font-semibold text-[hsl(var(--nashlo-orange))]">
              {(user.name ?? user.phone ?? "?")[0].toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold text-zinc-950">{user.name ?? "Без имени"}</h1>
                {user.isBanned && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">Заблокирован</span>}
                {user.isVerified && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">✓ Верифицирован</span>}
                {user.profileType === "COMPANY" && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">Бизнес</span>}
              </div>
              <p className="mt-0.5 font-mono text-xs text-zinc-400">{user.id}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              disabled={saving}
              onClick={() => patch({ isVerified: !user.isVerified })}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${user.isVerified ? "bg-zinc-100 text-zinc-700 hover:bg-zinc-200" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}>
              {user.isVerified ? "Снять верификацию" : "Верифицировать"}
            </button>
            <button
              disabled={saving}
              onClick={() => patch({ isBanned: !user.isBanned })}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${user.isBanned ? "bg-zinc-100 text-zinc-700 hover:bg-zinc-200" : "bg-red-50 text-red-600 hover:bg-red-100"}`}>
              {user.isBanned ? "Разблокировать" : "Заблокировать"}
            </button>
            <Link href={`/profile/${user.id}`} target="_blank"
              className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition">
              Профиль ↗
            </Link>
          </div>
        </div>

        {/* Info grid */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Телефон",  value: user.phone ?? "—" },
            { label: "Email",    value: user.email ?? "—" },
            { label: "Город",    value: user.city ?? "—" },
            { label: "Роль",     value: user.role },
            { label: "Зарегистрирован", value: new Date(user.createdAt).toLocaleDateString("ru-RU") },
            { label: "Последний вход",  value: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("ru-RU") : "—" },
            { label: "IP входа",        value: user.lastLoginIp ?? "—" },
            { label: "Рейтинг",         value: user.rating > 0 ? `${user.rating.toFixed(1)} (${user.reviewCount} отз.)` : "Нет отзывов" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl bg-zinc-50 p-3">
              <p className="text-xs text-zinc-400">{label}</p>
              <p className="mt-0.5 text-sm font-semibold text-zinc-950 break-all">{value}</p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {[
            { v: user._count.listings, l: "Объявлений" },
            { v: user._count.reviews,  l: "Отзывов" },
            { v: user._count.favorites, l: "В избранном" },
            { v: reports.length,        l: "Жалоб" },
            { v: user.payments.length,  l: "Платежей" },
            { v: (user.walletBalance / 100).toFixed(0) + " ₽", l: "Баланс" },
          ].map(({ v, l }) => (
            <div key={l} className="rounded-2xl border border-zinc-100 bg-white p-3 text-center shadow-sm">
              <p className="text-xl font-semibold text-zinc-950">{v}</p>
              <p className="mt-0.5 text-xs text-zinc-400">{l}</p>
            </div>
          ))}
        </div>

        {/* Company info */}
        {user.companyName && (
          <div className="mt-4 rounded-2xl bg-blue-50 px-4 py-3">
            <p className="text-sm font-semibold text-blue-800">{user.companyName}</p>
            {user.companyInn && <p className="text-xs text-blue-600">ИНН: {user.companyInn}</p>}
          </div>
        )}
      </div>

      {/* Tab nav */}
      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {([
          ["listings",   `Объявления (${user.listings.length})`],
          ["sessions",   `Устройства (${user.sessions.length})`],
          ["payments",   `Платежи (${user.payments.length})`],
          ["wallet",     `Кошелёк (${user.walletTransactions.length})`],
          ["reports",    `Жалобы (${reports.length})`],
          ["moderation", `Модерация (${moderationLogs.length})`],
        ] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${tab === key ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-4 overflow-hidden rounded-[24px] border border-zinc-200 bg-white shadow-sm">
        {/* Listings */}
        {tab === "listings" && (
          user.listings.length === 0 ? <Empty text="Объявлений нет" /> : (
            <div className="divide-y divide-zinc-100">
              {user.listings.map((l) => (
                <div key={l.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-zinc-950">{l.title}</p>
                    <p className="text-xs text-zinc-400">{l.category?.nameRu} · {new Date(l.createdAt).toLocaleDateString("ru-RU")}</p>
                    {l.rejectionReason && <p className="mt-0.5 text-xs text-red-500">Причина: {l.rejectionReason}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-xs text-zinc-400">{l.uniqueViews} уник. / {l.views} всего</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[l.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                      {STATUS_LABEL[l.status] ?? l.status}
                    </span>
                    <Link href={`/listings/${l.id}`} target="_blank"
                      className="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-50">
                      ↗
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Sessions */}
        {tab === "sessions" && (
          user.sessions.length === 0 ? <Empty text="Активных сессий нет" /> : (
            <div className="divide-y divide-zinc-100">
              {user.sessions.map((s) => (
                <div key={s.id} className="px-5 py-3">
                  <p className="font-semibold text-zinc-950 text-sm">{s.device ?? s.userAgent?.slice(0, 60) ?? "Неизвестное устройство"}</p>
                  <p className="text-xs text-zinc-400">IP: {s.ip ?? "—"} · Последняя активность: {new Date(s.lastActiveAt).toLocaleString("ru-RU")}</p>
                  <p className="text-xs text-zinc-400">Истекает: {new Date(s.expiresAt).toLocaleString("ru-RU")}</p>
                </div>
              ))}
            </div>
          )
        )}

        {/* Payments */}
        {tab === "payments" && (
          user.payments.length === 0 ? <Empty text="Платежей нет" /> : (
            <div className="divide-y divide-zinc-100">
              {user.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="font-semibold text-zinc-950 text-sm">{p.serviceType}</p>
                    <p className="text-xs text-zinc-400">{p.orderId} · {new Date(p.createdAt).toLocaleString("ru-RU")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-zinc-950">{fmt(p.amount)}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.status === "paid" ? "bg-emerald-50 text-emerald-600" : p.status === "pending" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"}`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Wallet */}
        {tab === "wallet" && (
          user.walletTransactions.length === 0 ? <Empty text="Транзакций нет" /> : (
            <div className="divide-y divide-zinc-100">
              {user.walletTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="font-semibold text-zinc-950 text-sm">{tx.title ?? tx.type}</p>
                    <p className="text-xs text-zinc-400">{new Date(tx.createdAt).toLocaleString("ru-RU")}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-sm ${tx.amount > 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {tx.amount > 0 ? "+" : ""}{fmt(tx.amount)}
                    </p>
                    <p className="text-xs text-zinc-400">Баланс: {fmt(tx.balanceAfter)}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Reports */}
        {tab === "reports" && (
          reports.length === 0 ? <Empty text="Жалоб на этого пользователя нет" /> : (
            <div className="divide-y divide-zinc-100">
              {reports.map((r) => (
                <div key={r.id} className="px-5 py-3">
                  <p className="font-semibold text-zinc-950 text-sm">{r.listing?.title ?? r.listing?.id ?? "—"}</p>
                  <p className="text-sm text-zinc-600">{r.reason}</p>
                  {r.comment && <p className="text-xs text-zinc-400">«{r.comment}»</p>}
                  <p className="text-xs text-zinc-400">{new Date(r.createdAt).toLocaleDateString("ru-RU")} · {r.status}</p>
                </div>
              ))}
            </div>
          )
        )}

        {/* Moderation */}
        {tab === "moderation" && (
          moderationLogs.length === 0 ? <Empty text="Записей модерации нет" /> : (
            <div className="divide-y divide-zinc-100">
              {moderationLogs.map((m) => (
                <div key={m.id} className="flex items-start justify-between gap-4 px-5 py-3">
                  <div>
                    <p className="font-semibold text-zinc-950 text-sm">{m.listing?.title ?? "—"}</p>
                    {m.reason && <p className="text-xs text-zinc-500">Причина: {m.reason}</p>}
                    {(m.staff || m.moderator) && (
                      <p className="text-xs text-zinc-400">
                        Модератор: {m.staff?.displayName ?? m.staff?.login ?? m.moderator?.name ?? m.moderator?.phone}
                      </p>
                    )}
                    <p className="text-xs text-zinc-400">{new Date(m.createdAt).toLocaleString("ru-RU")}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${m.action === "APPROVED" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                    {m.action === "APPROVED" ? "Одобрено" : "Отклонено"}
                  </span>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <div className="py-12 text-center text-sm text-zinc-400">{text}</div>
}
