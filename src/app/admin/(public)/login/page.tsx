"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Logo } from "@/components/layout/Logo"
import { getAdminCsrfFromDocument } from "@/lib/admin/csrf-client"

export default function AdminLoginPage() {
  const router = useRouter()
  const [login, setLogin]   = useState("")
  const [code, setCode]     = useState("")
  const [showCode, setShowCode] = useState(false)
  const [error, setError]   = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const csrfToken = getAdminCsrfFromDocument()

      const res = await fetch("/api/admin/auth/login", {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ login: login.trim(), code: code.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Ошибка входа")
        return
      }

      router.push(data.redirectTo ?? "/admin/dashboard")
    } catch {
      setError("Нет соединения с сервером")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,hsl(var(--nashlo-orange)/0.18),transparent_34%),#05070d] px-4 py-8">
      <div className="w-full max-w-[420px]">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-5 flex w-fit rounded-2xl bg-white px-4 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.25)]">
            <Logo />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Панель управления</h1>
          <p className="mt-2 text-sm leading-6 text-gray-400">Закрытый вход для сотрудников Нашло</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-[28px] border border-white/10 bg-white/[0.06] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.38)] backdrop-blur sm:p-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Логин
            </label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              autoComplete="username"
              autoFocus
              required
              placeholder="your.login"
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.07] px-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[hsl(var(--nashlo-orange))] focus:bg-white/[0.10] focus:shadow-[0_0_0_4px_hsl(var(--nashlo-orange)/0.12)]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Персональный код
            </label>
            <div className="relative">
              <input
                type={showCode ? "text" : "password"}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoComplete="current-password"
                required
                placeholder="NSH-XXXX-XXXX"
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.07] px-4 pr-11 font-mono text-sm tracking-widest text-white outline-none transition placeholder:text-gray-600 focus:border-[hsl(var(--nashlo-orange))] focus:bg-white/[0.10] focus:shadow-[0_0_0_4px_hsl(var(--nashlo-orange)/0.12)]"
              />
              <button
                type="button"
                onClick={() => setShowCode((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-gray-300"
                tabIndex={-1}
              >
                {showCode ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !login || !code}
            className="h-12 w-full rounded-2xl bg-[hsl(var(--nashlo-orange))] text-sm font-semibold text-white shadow-[0_12px_34px_hsl(var(--nashlo-orange)/0.24)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Входим...
              </span>
            ) : "Войти"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-600">
          Доступ только для сотрудников nashlo.ru
        </p>
      </div>
    </div>
  )
}
