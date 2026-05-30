"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { Logo } from "@/components/layout/Logo"
import { setStaffAppToken } from "@/lib/admin/staff-app-auth"
import { staffAppFetch } from "@/lib/admin/staff-app-fetch"

export function StaffAppLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get("next") || "/admin/app/support"

  const [login, setLogin] = useState("")
  const [code, setCode] = useState("")
  const [showCode, setShowCode] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/admin/auth/app/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: login.trim(), code: code.trim() }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error ?? "Ошибка входа")
        return
      }

      if (!data.accessToken) {
        setError("Нет токена сессии")
        return
      }

      setStaffAppToken(data.accessToken)

      const meRes = await staffAppFetch("/api/admin/auth/app/me")
      if (!meRes.ok) {
        setError("Сессия не подтверждена")
        setStaffAppToken(null)
        return
      }

      const target = nextPath.startsWith("/admin/app") ? nextPath : "/admin/app/support"
      router.replace(target)
      router.refresh()
    } catch {
      setError("Нет соединения с сервером")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex w-fit items-center gap-2">
            <Logo size="default" />
            <span className="rounded-lg bg-orange-500/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-orange-400">
              Staff PC
            </span>
          </div>
          <h1 className="text-xl font-semibold text-white">Приложение для сотрудников</h1>
          <p className="mt-1 text-sm text-zinc-400">Поддержка и администрирование · Windows / macOS</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500" htmlFor="staff-login">
              Логин
            </label>
            <input
              id="staff-login"
              autoComplete="username"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="h-11 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none ring-orange-500/40 focus:border-orange-500 focus:ring-2"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500" htmlFor="staff-code">
              Персональный код
            </label>
            <div className="relative">
              <input
                id="staff-code"
                type={showCode ? "text" : "password"}
                autoComplete="current-password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="h-11 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 pr-20 text-sm text-white outline-none ring-orange-500/40 focus:border-orange-500 focus:ring-2"
                required
              />
              <button
                type="button"
                onClick={() => setShowCode((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-medium text-zinc-400 hover:text-white"
              >
                {showCode ? "Скрыть" : "Показать"}
              </button>
            </div>
          </div>

          {error ? (
            <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full items-center justify-center rounded-xl bg-[hsl(var(--nashlo-orange))] text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-50"
          >
            {loading ? "Вход…" : "Войти"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-500">
          Полная панель в браузере:{" "}
          <a href="/admin/login" className="text-orange-400 hover:underline">
            admin/login
          </a>
        </p>
      </div>
    </main>
  )
}
