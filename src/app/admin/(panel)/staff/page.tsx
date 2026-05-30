"use client"

import { useEffect, useState, useCallback } from "react"
import { getAdminCsrfFromDocument } from "@/lib/admin/csrf-client"
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader"
import { AdminPageShell } from "@/components/admin/layout/AdminPageShell"
import { AdminStatusBadge } from "@/components/admin/ui/AdminStatusBadge"

type StaffMember = {
  id: string
  login: string
  displayName: string | null
  role: string
  status: string
  lastLoginAt: string | null
  createdAt: string
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Владелец",
  ADMIN: "Администратор",
  MODERATOR: "Модератор",
  SUPPORT: "Поддержка",
  BUSINESS_MANAGER: "Бизнес-менеджер",
  B2B_MODERATOR: "B2B модерация",
  FINANCE: "Финансы",
}

const CREATABLE_ROLES = ["MODERATOR", "SUPPORT", "BUSINESS_MANAGER", "B2B_MODERATOR", "FINANCE", "ADMIN"] as const

async function adminFetch(url: string, options: RequestInit = {}) {
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": getAdminCsrfFromDocument(),
      ...(options.headers ?? {}),
    },
  })
}

function StaffActions({
  member,
  onResetCode,
  onSuspend,
  onActivate,
  onRevoke,
}: {
  member: StaffMember
  onResetCode: () => void
  onSuspend: () => void
  onActivate: () => void
  onRevoke: () => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        onClick={onResetCode}
        className="rounded-xl border border-zinc-200 px-2.5 py-1.5 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50"
        title="Сбросить код"
      >
        Сброс кода
      </button>
      {member.status === "ACTIVE" && (
        <button
          type="button"
          onClick={onSuspend}
          className="rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
        >
          Блок
        </button>
      )}
      {member.status === "SUSPENDED" && (
        <button
          type="button"
          onClick={onActivate}
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100"
        >
          Активировать
        </button>
      )}
      {member.status !== "REVOKED" && (
        <button
          type="button"
          onClick={onRevoke}
          className="rounded-xl border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
        >
          Отозвать
        </button>
      )}
    </div>
  )
}

export default function AdminStaffPage() {
  const [items, setItems] = useState<StaffMember[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionMsg, setActionMsg] = useState("")

  const [showCreate, setShowCreate] = useState(false)
  const [createLogin, setCreateLogin] = useState("")
  const [createName, setCreateName] = useState("")
  const [createRole, setCreateRole] = useState<string>("MODERATOR")
  const [creating, setCreating] = useState(false)
  const [newCode, setNewCode] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminFetch("/api/admin/staff?take=100")
      const data = await res.json()
      setItems(data.items ?? [])
      setTotal(data.total ?? 0)
    } catch {
      setError("Не удалось загрузить список")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function action(staffId: string, endpoint: string, body?: object) {
    setActionMsg("")
    const res = await adminFetch(`/api/admin/staff/${staffId}/${endpoint}`, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = await res.json()
    if (!res.ok) {
      setActionMsg(data.error ?? "Ошибка")
      return
    }
    if (data.code) {
      setNewCode(data.code)
    } else {
      setActionMsg("Готово")
      void load()
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError("")
    const res = await adminFetch("/api/admin/staff", {
      method: "POST",
      body: JSON.stringify({
        login: createLogin,
        displayName: createName || undefined,
        role: createRole,
      }),
    })
    const data = await res.json()
    setCreating(false)
    if (!res.ok) {
      setError(data.error ?? "Ошибка создания")
      return
    }
    setNewCode(data.code)
    setShowCreate(false)
    setCreateLogin("")
    setCreateName("")
    setCreateRole("MODERATOR")
    void load()
  }

  function bindActions(s: StaffMember) {
    return {
      onResetCode: () => void action(s.id, "reset-code"),
      onSuspend: () => void action(s.id, "suspend"),
      onActivate: () => void action(s.id, "activate"),
      onRevoke: () => {
        if (confirm(`Отозвать «${s.login}»?`)) void action(s.id, "revoke")
      },
    }
  }

  return (
    <AdminPageShell className="py-8">
      <AdminPageHeader
        title="Сотрудники"
        description={`${total} аккаунтов · управление доступом и кодами входа`}
        actions={
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-2xl bg-[hsl(var(--nashlo-orange))] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Добавить
          </button>
        }
      />

      {actionMsg && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {actionMsg}
        </div>
      )}

      {error && !showCreate && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {newCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-sm rounded-[28px] border border-zinc-200 bg-white p-8 text-center shadow-xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--nashlo-orange)/0.12)]">
              <svg
                className="h-6 w-6 text-[hsl(var(--nashlo-orange))]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-zinc-950">Сохраните код</h3>
            <p className="mt-1 text-sm text-zinc-500">Он будет показан только один раз</p>
            <div className="mb-6 mt-5 select-all rounded-2xl bg-zinc-50 px-6 py-4 font-mono text-xl font-bold tracking-widest text-[hsl(var(--nashlo-orange))]">
              {newCode}
            </div>
            <button
              type="button"
              onClick={() => void navigator.clipboard?.writeText(newCode)}
              className="mb-3 w-full rounded-2xl border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
            >
              Скопировать
            </button>
            <button
              type="button"
              onClick={() => {
                setNewCode(null)
                void load()
              }}
              className="w-full rounded-2xl bg-zinc-950 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Я сохранил
            </button>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-sm rounded-[28px] border border-zinc-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-zinc-950">Новый сотрудник</h3>
            <form onSubmit={handleCreate} className="mt-4 space-y-3">
              <input
                value={createLogin}
                onChange={(e) => setCreateLogin(e.target.value)}
                placeholder="Логин (a-z 0-9 . _ -)"
                required
                pattern="^[a-z0-9._-]{3,32}$"
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-[hsl(var(--nashlo-orange))]"
              />
              <input
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="Отображаемое имя (необязательно)"
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-[hsl(var(--nashlo-orange))]"
              />
              <select
                value={createRole}
                onChange={(e) => setCreateRole(e.target.value)}
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-[hsl(var(--nashlo-orange))]"
              >
                {CREATABLE_ROLES.map((v) => (
                  <option key={v} value={v}>
                    {ROLE_LABELS[v] ?? v}
                  </option>
                ))}
              </select>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 rounded-2xl border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 rounded-2xl bg-zinc-950 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {creating ? "Создаём..." : "Создать"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-[24px] border border-zinc-200 bg-white shadow-sm">
        {loading ? (
          <div className="space-y-0 divide-y divide-zinc-100 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-zinc-100" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-400">Сотрудников нет</div>
        ) : (
          <>
            <div className="hidden lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">
                      Сотрудник
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">
                      Роль
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">
                      Статус
                    </th>
                    <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400 xl:table-cell">
                      Последний вход
                    </th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {items.map((s) => (
                    <tr key={s.id} className="hover:bg-zinc-50/80">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-zinc-950">{s.displayName ?? s.login}</div>
                        {s.displayName && <div className="text-xs text-zinc-500">{s.login}</div>}
                      </td>
                      <td className="px-5 py-3.5 text-zinc-700">{ROLE_LABELS[s.role] ?? s.role}</td>
                      <td className="px-5 py-3.5">
                        <AdminStatusBadge variant="staff" status={s.status} />
                      </td>
                      <td className="hidden px-5 py-3.5 text-xs text-zinc-500 xl:table-cell">
                        {s.lastLoginAt ? new Date(s.lastLoginAt).toLocaleString("ru-RU") : "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end">
                          <StaffActions member={s} {...bindActions(s)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-zinc-100 lg:hidden">
              {items.map((s) => (
                <article key={s.id} className="space-y-3 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-950">{s.displayName ?? s.login}</p>
                      {s.displayName && <p className="text-xs text-zinc-500">{s.login}</p>}
                      <p className="mt-1 text-sm text-zinc-600">{ROLE_LABELS[s.role] ?? s.role}</p>
                    </div>
                    <AdminStatusBadge variant="staff" status={s.status} className="shrink-0" />
                  </div>
                  <p className="text-xs text-zinc-500">
                    Последний вход:{" "}
                    {s.lastLoginAt ? new Date(s.lastLoginAt).toLocaleString("ru-RU") : "—"}
                  </p>
                  <StaffActions member={s} {...bindActions(s)} />
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </AdminPageShell>
  )
}
