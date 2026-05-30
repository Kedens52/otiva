"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { ReferralStatus } from "@prisma/client"
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader"
import { AdminPageShell } from "@/components/admin/layout/AdminPageShell"
import { AdminStatusBadge } from "@/components/admin/ui/AdminStatusBadge"

type RefUser = {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  referralCode: string | null
  createdAt: string
}

type ReferralRow = {
  id: string
  status: ReferralStatus
  createdAt: string
  activatedAt: string | null
  referrer: RefUser
  referredUser: RefUser
}

type Stats = {
  PENDING: number
  ACTIVE: number
  REJECTED: number
  total: number
}

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: "", label: "Все" },
  { value: "PENDING", label: "Ожидают" },
  { value: "ACTIVE", label: "Активные" },
  { value: "REJECTED", label: "Отклонённые" },
]

function formatDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function userLabel(u: RefUser) {
  return u.name?.trim() || u.phone || u.email || u.id.slice(0, 8)
}

function UserCell({ user, role }: { user: RefUser; role: "referrer" | "referred" }) {
  return (
    <div>
      <Link
        href={`/admin/users/${user.id}`}
        className="font-semibold text-zinc-950 hover:text-[hsl(var(--nashlo-orange))]"
      >
        {userLabel(user)}
      </Link>
      <p className="mt-0.5 text-xs text-zinc-500">
        {role === "referrer" ? "Пригласил" : "Приглашён"}
        {user.phone ? ` · ${user.phone}` : ""}
      </p>
      {user.referralCode && role === "referrer" && (
        <p className="mt-1 font-mono text-[11px] text-zinc-400">Код: {user.referralCode}</p>
      )}
    </div>
  )
}

export default function AdminReferralsPage() {
  const [items, setItems] = useState<ReferralRow[]>([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState("")
  const [search, setSearch] = useState("")
  const [debounced, setDebounced] = useState("")
  const [page, setPage] = useState(1)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 400)
    return () => clearTimeout(t)
  }, [search])

  async function load(p = page, st = status, q = debounced) {
    setLoading(true)
    const params = new URLSearchParams()
    if (st) params.set("status", st)
    if (q) params.set("q", q)
    params.set("page", String(p))
    const res = await fetch(`/api/admin/referrals?${params}`)
    if (res.ok) {
      const d = await res.json()
      setItems(d.items ?? [])
      setTotal(d.total ?? 0)
      setStats(d.stats ?? null)
    }
    setLoading(false)
  }

  useEffect(() => {
    load(page, status, debounced)
  }, [page, status, debounced])

  const pages = Math.max(1, Math.ceil(total / 50))

  return (
    <AdminPageShell className="py-8">
      <AdminPageHeader
        title="Рефералы"
        description="Кто кого пригласил по реферальной программе"
      />

      {stats && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Всего приглашений" value={stats.total} />
          <StatCard label="Ожидают объявления" value={stats.PENDING} tone="amber" />
          <StatCard label="Активированы" value={stats.ACTIVE} tone="emerald" />
          <StatCard label="Отклонены" value={stats.REJECTED} tone="red" />
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск: имя, телефон, email, код…"
          className="h-11 flex-1 rounded-xl border border-zinc-200 px-4 text-sm outline-none focus:border-zinc-400"
        />
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((st) => (
          <button
            key={st.value}
            type="button"
            onClick={() => {
              setStatus(st.value)
              setPage(1)
            }}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              status === st.value ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-sm text-zinc-400">Загрузка…</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-500">Приглашений не найдено</div>
        ) : (
          <>
          <div className="divide-y divide-zinc-100 lg:hidden">
            {items.map((row) => (
              <article key={row.id} className="space-y-3 px-4 py-4">
                <UserCell user={row.referrer} role="referrer" />
                <div className="border-t border-zinc-100 pt-3">
                  <UserCell user={row.referredUser} role="referred" />
                </div>
                <AdminStatusBadge variant="referral" status={row.status} />
                <div className="grid grid-cols-2 gap-2 text-xs text-zinc-500">
                  <div className="rounded-xl bg-zinc-50 px-3 py-2">
                    <p className="font-semibold text-zinc-700">Связь</p>
                    <p className="mt-0.5">{formatDate(row.createdAt)}</p>
                  </div>
                  <div className="rounded-xl bg-zinc-50 px-3 py-2">
                    <p className="font-semibold text-zinc-700">Активация</p>
                    <p className="mt-0.5">{formatDate(row.activatedAt)}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Кто пригласил</th>
                  <th className="px-4 py-3">Кого пригласил</th>
                  <th className="px-4 py-3">Статус</th>
                  <th className="px-4 py-3">Регистрация связи</th>
                  <th className="px-4 py-3">Активация</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {items.map((row) => (
                  <tr key={row.id} className="hover:bg-zinc-50/80">
                    <td className="px-4 py-3">
                      <UserCell user={row.referrer} role="referrer" />
                    </td>
                    <td className="px-4 py-3">
                      <UserCell user={row.referredUser} role="referred" />
                    </td>
                    <td className="px-4 py-3">
                      <AdminStatusBadge variant="referral" status={row.status} />
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{formatDate(row.createdAt)}</td>
                    <td className="px-4 py-3 text-zinc-600">{formatDate(row.activatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>

      {total > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-zinc-500">
          <span>
            Показано {items.length} из {total}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 disabled:opacity-40"
            >
              Назад
            </button>
            <span className="px-2 py-1.5">
              {page} / {pages}
            </span>
            <button
              type="button"
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 disabled:opacity-40"
            >
              Вперёд
            </button>
          </div>
        </div>
      )}
    </AdminPageShell>
  )
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: "amber" | "emerald" | "red"
}) {
  const toneClass =
    tone === "amber"
      ? "text-amber-700"
      : tone === "emerald"
        ? "text-emerald-700"
        : tone === "red"
          ? "text-red-600"
          : "text-zinc-950"
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${toneClass}`}>{value}</p>
    </div>
  )
}
