"use client"

import { useEffect, useState } from "react"

type Session = {
  id: string
  device: string | null
  ip: string | null
  lastActiveAt: string
  createdAt: string
  current?: boolean
}

export default function ProfileSecurityPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [terminating, setTerminating] = useState<string | null>(null)
  const [terminatingAll, setTerminatingAll] = useState(false)

  const load = () => {
    fetch("/api/profile/sessions")
      .then((r) => r.json())
      .then((d) => {
        setSessions(d.sessions ?? d ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const terminateOne = async (id: string) => {
    setTerminating(id)
    await fetch(`/api/profile/sessions/${id}`, { method: "DELETE" })
    setSessions((prev) => prev.filter((s) => s.id !== id))
    setTerminating(null)
  }

  const terminateAll = async () => {
    if (!confirm("Завершить все сеансы? Вам потребуется войти снова.")) return
    setTerminatingAll(true)
    await fetch("/api/profile/sessions", { method: "DELETE" })
    window.location.href = "/login"
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
    if (diff < 60) return "только что"
    if (diff < 3600) return `${Math.floor(diff / 60)} мин. назад`
    if (diff < 86400) return `${Math.floor(diff / 3600)} ч. назад`
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
  }

  const getDeviceIcon = (device: string | null) => {
    if (!device) return "&#128187;"
    const d = device.toLowerCase()
    if (d.includes("iphone") || d.includes("android")) return "&#128241;"
    if (d.includes("ipad")) return "&#128187;"
    return "&#128187;"
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">Безопасность</h1>
      <p className="text-sm text-gray-500 mb-5">Управляйте активными сеансами вашего аккаунта</p>

      {/* Warning */}
      {sessions.length > 1 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-5 flex gap-3">
          <span className="text-yellow-500 text-xl shrink-0">&#9888;</span>
          <div>
            <p className="text-sm font-medium text-yellow-800">Несколько активных сеансов</p>
            <p className="text-xs text-yellow-700 mt-0.5">
              Если вы не узнаёте какое-то устройство — завершите его сеанс и смените пароль
            </p>
          </div>
        </div>
      )}

      {/* Sessions */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
        <div className="flex flex-col gap-2 border-b border-gray-100 px-4 py-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
          <h2 className="font-semibold text-gray-900 text-sm">Активные сеансы</h2>
          {sessions.length > 1 && (
            <button
              onClick={terminateAll}
              disabled={terminatingAll}
              className="text-xs text-red-500 hover:text-red-700 font-medium"
            >
              Завершить все
            </button>
          )}
        </div>

        {loading && (
          <div className="p-4 space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-lg shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div className="p-8 text-center text-sm text-gray-500">
            Нет активных сеансов
          </div>
        )}

        {!loading && sessions.map((session, idx) => (
          <div
            key={session.id}
            className={`flex flex-col gap-3 px-4 py-3 min-[520px]:flex-row min-[520px]:items-center ${idx !== sessions.length - 1 ? "border-b border-gray-50" : ""}`}
          >
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl shrink-0">
              <span dangerouslySetInnerHTML={{ __html: getDeviceIcon(session.device) }} />
            </div>
            <div className="min-w-0 flex-1 self-stretch min-[520px]:self-auto">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {session.device ?? "Неизвестное устройство"}
                </p>
                {session.current && (
                  <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                    текущий
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {session.ip ?? "IP неизвестен"} &middot; {formatDate(session.lastActiveAt)}
              </p>
            </div>
            {!session.current && (
              <button
                onClick={() => terminateOne(session.id)}
                disabled={terminating === session.id}
                className="w-full rounded border border-red-100 px-2 py-2 text-xs font-medium text-red-500 transition-colors hover:border-red-300 hover:text-red-700 min-[520px]:w-auto min-[520px]:shrink-0 min-[520px]:py-1"
              >
                {terminating === session.id ? "..." : "Завершить"}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Change phone hint */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="font-semibold text-gray-900 text-sm mb-1">Аутентификация</h2>
        <p className="text-xs text-gray-500 mb-3">
          Для смены номера телефона или привязки аккаунтов перейдите в настройки профиля
        </p>
        <a
          href="/profile/settings"
          className="text-sm text-orange-600 font-medium hover:text-orange-700"
        >
          Открыть настройки &#8594;
        </a>
      </div>
    </div>
  )
}
