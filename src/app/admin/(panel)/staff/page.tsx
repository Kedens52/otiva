"use client"

import { useEffect, useState, useCallback } from "react"
import { getAdminCsrfFromDocument } from "@/lib/admin/csrf-client"

type StaffMember = {
  id:          string
  login:       string
  displayName: string | null
  role:        string
  status:      string
  lastLoginAt: string | null
  createdAt:   string
}

const ROLE_LABELS: Record<string, string> = {
  OWNER:            "Владелец",
  ADMIN:            "Администратор",
  MODERATOR:        "Модератор",
  SUPPORT:          "Поддержка",
  BUSINESS_MANAGER: "Бизнес-менеджер",
  FINANCE:          "Финансы",
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:    "bg-green-500/15 text-green-400",
  SUSPENDED: "bg-yellow-500/15 text-yellow-400",
  REVOKED:   "bg-red-500/15 text-red-400",
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE:    "Активен",
  SUSPENDED: "Заблокирован",
  REVOKED:   "Отозван",
}

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

export default function AdminStaffPage() {
  const [items, setItems]       = useState<StaffMember[]>([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState("")
  const [actionMsg, setActionMsg] = useState("")

  // Create form
  const [showCreate, setShowCreate] = useState(false)
  const [createLogin, setCreateLogin]   = useState("")
  const [createName, setCreateName]     = useState("")
  const [createRole, setCreateRole]     = useState("MODERATOR")
  const [creating, setCreating]         = useState(false)
  const [newCode, setNewCode]           = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await adminFetch("/api/admin/staff?take=100")
      const data = await res.json()
      setItems(data.items ?? [])
      setTotal(data.total ?? 0)
    } catch {
      setError("Не удалось загрузить список")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function action(staffId: string, endpoint: string, body?: object) {
    setActionMsg("")
    const res  = await adminFetch(`/api/admin/staff/${staffId}/${endpoint}`, {
      method: "PATCH",
      body:   body ? JSON.stringify(body) : undefined,
    })
    const data = await res.json()
    if (!res.ok) { setActionMsg(data.error ?? "Ошибка"); return }
    if (data.code) {
      setNewCode(data.code)
    } else {
      setActionMsg("Готово")
      load()
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError("")
    const res  = await adminFetch("/api/admin/staff", {
      method: "POST",
      body:   JSON.stringify({ login: createLogin, displayName: createName || undefined, role: createRole }),
    })
    const data = await res.json()
    setCreating(false)
    if (!res.ok) { setError(data.error ?? "Ошибка создания"); return }
    setNewCode(data.code)
    setShowCreate(false)
    setCreateLogin(""); setCreateName(""); setCreateRole("MODERATOR")
    load()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Сотрудники</h1>
          <p className="text-gray-500 text-sm mt-1">{total} аккаунтов</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600
            text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Добавить
        </button>
      </div>

      {/* Action message */}
      {actionMsg && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
          {actionMsg}
        </div>
      )}

      {/* One-time code modal */}
      {newCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-sm w-full text-center">
            <div className="w-12 h-12 rounded-full bg-orange-500/15 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Сохраните код!</h3>
            <p className="text-sm text-gray-400 mb-5">Он будет показан только один раз</p>
            <div className="bg-gray-800 rounded-xl px-6 py-4 mb-6 font-mono text-xl font-bold text-orange-400 tracking-widest select-all">
              {newCode}
            </div>
            <button
              onClick={() => { navigator.clipboard?.writeText(newCode); }}
              className="w-full mb-3 py-2.5 rounded-lg border border-gray-700 text-sm text-gray-300
                hover:bg-gray-800 transition-colors"
            >
              Скопировать
            </button>
            <button
              onClick={() => { setNewCode(null); load() }}
              className="w-full py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors"
            >
              Я сохранил
            </button>
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-white mb-4">Новый сотрудник</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                value={createLogin}
                onChange={(e) => setCreateLogin(e.target.value)}
                placeholder="Логин (a-z 0-9 . _ -)"
                required
                pattern="^[a-z0-9._-]{3,32}$"
                className="w-full h-10 px-3 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm
                  focus:outline-none focus:border-orange-500"
              />
              <input
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="Отображаемое имя (необязательно)"
                className="w-full h-10 px-3 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm
                  focus:outline-none focus:border-orange-500"
              />
              <select
                value={createRole}
                onChange={(e) => setCreateRole(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm
                  focus:outline-none focus:border-orange-500"
              >
                {Object.entries(ROLE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-700 text-sm text-gray-300 hover:bg-gray-800">
                  Отмена
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium disabled:opacity-50">
                  {creating ? "Создаём..." : "Создать"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map((i) => (
            <div key={i} className="h-16 bg-gray-900 rounded-xl animate-pulse border border-gray-800" />
          ))}
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Сотрудник</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Роль</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">Последний вход</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((s, idx) => (
                <tr key={s.id} className={`border-b border-gray-800 last:border-0 ${idx % 2 === 1 ? "bg-gray-900/50" : ""}`}>
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-white">{s.displayName ?? s.login}</div>
                    {s.displayName && <div className="text-xs text-gray-500">{s.login}</div>}
                  </td>
                  <td className="px-5 py-3.5 text-gray-300">{ROLE_LABELS[s.role] ?? s.role}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[s.status] ?? ""}`}>
                      {STATUS_LABELS[s.status] ?? s.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs hidden xl:table-cell">
                    {s.lastLoginAt ? new Date(s.lastLoginAt).toLocaleString("ru-RU") : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 justify-end flex-wrap">
                      <button
                        onClick={() => action(s.id, "reset-code")}
                        className="px-2.5 py-1 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-700 transition-colors"
                        title="Сбросить код"
                      >
                        Сброс кода
                      </button>
                      {s.status === "ACTIVE" && (
                        <button
                          onClick={() => action(s.id, "suspend")}
                          className="px-2.5 py-1 rounded-lg text-xs text-yellow-400 hover:bg-yellow-500/10 border border-yellow-500/30 transition-colors"
                        >
                          Блок
                        </button>
                      )}
                      {s.status === "SUSPENDED" && (
                        <button
                          onClick={() => action(s.id, "activate")}
                          className="px-2.5 py-1 rounded-lg text-xs text-green-400 hover:bg-green-500/10 border border-green-500/30 transition-colors"
                        >
                          Активировать
                        </button>
                      )}
                      {s.status !== "REVOKED" && (
                        <button
                          onClick={() => { if (confirm(`Отозвать "${s.login}"?`)) action(s.id, "revoke") }}
                          className="px-2.5 py-1 rounded-lg text-xs text-red-400 hover:bg-red-500/10 border border-red-500/30 transition-colors"
                        >
                          Отозвать
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
