"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import { Logo } from "@/components/layout/Logo"
import { getSupabase } from "@/lib/supabase"

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const redirectTo = params.get("from") || "/"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [isError, setIsError] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setMessage("")
    setIsError(false)

    if (!email.includes("@")) { setIsError(true); setMessage("Введите корректный email."); return }
    if (password.length < 6)  { setIsError(true); setMessage("Пароль не менее 6 символов."); return }

    setLoading(true)
    const supabase = getSupabase()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (error) {
      setIsError(true)
      if (error.message.includes("Invalid login")) setMessage("Неверный email или пароль.")
      else if (error.message.includes("Email not confirmed")) setMessage("Подтвердите почту — проверьте входящие.")
      else setMessage(error.message)
      return
    }

    router.replace(redirectTo)
    router.refresh()
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 lg:grid lg:min-h-[720px] lg:grid-cols-[1fr_460px] lg:items-center lg:gap-10 lg:py-12">
      <div className="mb-10 flex justify-center pt-4 lg:hidden">
        <Logo />
      </div>

      <section className="hidden lg:block">
        <h1 className="max-w-2xl text-5xl font-semibold tracking-tight text-zinc-950 sm:text-6xl">Добро пожаловать</h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-500">
          Войдите, чтобы управлять объявлениями, переписываться с покупателями и отслеживать сделки.
        </p>
      </section>

      <section className="mx-auto w-full max-w-md rounded-[28px] border border-zinc-200 bg-zinc-50 p-4 shadow-inner sm:p-6 lg:max-w-none lg:rounded-[32px]">
        <div className="rounded-[24px] bg-white p-5 shadow-sm sm:rounded-[28px] sm:p-6">
          <div className="mb-6 lg:hidden">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Вход</h1>
          </div>
          <h2 className="hidden text-2xl font-semibold text-zinc-950 lg:block">Вход в аккаунт</h2>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-zinc-600">Email</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1.5 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-zinc-400 focus:bg-white"
              />
            </label>

            <label className="block">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-600">Пароль</span>
                <button type="button" onClick={async () => {
                  if (!email.includes("@")) { setIsError(true); setMessage("Введите email для сброса пароля."); return }
                  setLoading(true)
                  const { error } = await getSupabase().auth.resetPasswordForEmail(email)
                  setLoading(false)
                  setIsError(!!error)
                  setMessage(error ? error.message : "Письмо со сбросом пароля отправлено.")
                }} className="text-xs font-medium text-zinc-400 hover:text-zinc-700">
                  Забыли пароль?
                </button>
              </div>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-zinc-400 focus:bg-white"
              />
            </label>

            {message && (
              <p className={`rounded-2xl px-4 py-3 text-sm font-medium ${isError ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"}`}>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-zinc-950 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
            >
              {loading ? "Входим…" : "Войти"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-zinc-500">
            Нет аккаунта?{" "}
            <Link href="/register" className="font-semibold text-zinc-950 hover:underline">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
