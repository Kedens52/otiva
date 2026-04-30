"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { Logo } from "@/components/layout/Logo"

export default function AdminLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit() {
    setError("")
    setLoading(true)

    const response = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })

    setLoading(false)

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      setError(data?.error || "Доступ запрещен")
      return
    }

    router.push(searchParams.get("next") || "/admin/moderation")
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-10">
      <section className="w-full max-w-md rounded-[32px] border border-zinc-200 bg-zinc-50 p-5 shadow-inner">
        <div className="rounded-[28px] bg-white p-6 shadow-sm">
          <div className="flex justify-center">
            <Logo />
          </div>
          <h1 className="mt-8 text-3xl font-semibold tracking-tight text-zinc-950">Вход разработчика</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Админ-панель скрыта от пользователей. Введите код разработчика для доступа к модерации.
          </p>
          <label className="mt-6 block">
            <span className="text-sm font-medium text-zinc-600">Код доступа</span>
            <input
              value={code}
              onChange={(event) => {
                setCode(event.target.value)
                setError("")
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") submit()
              }}
              className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none transition focus:border-[hsl(var(--otiva-orange))]"
              placeholder="Введите код"
              type="password"
              autoFocus
            />
          </label>
          <button
            type="button"
            onClick={submit}
            disabled={loading || code.trim().length === 0}
            className="mt-4 h-12 w-full rounded-2xl bg-[hsl(var(--otiva-orange))] px-5 text-sm font-semibold text-white transition hover:bg-[hsl(var(--otiva-orange)/0.9)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Проверяем..." : "Открыть админ-панель"}
          </button>
          {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
          <p className="mt-5 text-xs leading-5 text-zinc-400">
            Для локального демо код по умолчанию: otiva-dev. Для рабочего режима задайте OTIVA_ADMIN_CODE и OTIVA_ADMIN_TOKEN в окружении.
          </p>
        </div>
      </section>
    </main>
  )
}
