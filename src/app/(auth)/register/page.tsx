"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Logo } from "@/components/layout/Logo"
import { getSupabase } from "@/lib/supabase"

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: "", email: "", password: "" })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [isError, setIsError] = useState(false)
  const [done, setDone] = useState(false)

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setMessage("")
    setIsError(false)

    if (form.name.trim().length < 2)    { setIsError(true); setMessage("Введите имя (минимум 2 символа)."); return }
    if (!form.email.includes("@"))      { setIsError(true); setMessage("Введите корректный email."); return }
    if (form.password.length < 6)       { setIsError(true); setMessage("Пароль не менее 6 символов."); return }

    setLoading(true)
    const supabase = getSupabase()
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { name: form.name.trim() },
      },
    })
    setLoading(false)

    if (error) {
      setIsError(true)
      if (error.message.includes("already registered")) setMessage("Этот email уже зарегистрирован. Войдите.")
      else setMessage(error.message)
      return
    }

    setDone(true)
  }

  if (done) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="mx-auto max-w-sm rounded-[32px] border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">✓</div>
          <h1 className="text-2xl font-semibold text-zinc-950">Почти готово!</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            Мы отправили письмо на <strong>{form.email}</strong>. Перейдите по ссылке, чтобы подтвердить аккаунт.
          </p>
          <Link href="/login" className="mt-6 block rounded-2xl bg-zinc-950 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800">
            Войти
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 lg:grid lg:min-h-[720px] lg:grid-cols-[1fr_460px] lg:items-center lg:gap-10 lg:py-12">
      <div className="mb-10 flex justify-center pt-4 lg:hidden">
        <Logo />
      </div>

      <section className="hidden lg:block">
        <h1 className="max-w-2xl text-5xl font-semibold tracking-tight text-zinc-950 sm:text-6xl">Создайте аккаунт</h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-500">
          Размещайте объявления, общайтесь с покупателями и ведите историю сделок.
        </p>
      </section>

      <section className="mx-auto w-full max-w-md rounded-[28px] border border-zinc-200 bg-zinc-50 p-4 shadow-inner sm:p-6 lg:max-w-none lg:rounded-[32px]">
        <div className="rounded-[24px] bg-white p-5 shadow-sm sm:rounded-[28px] sm:p-6">
          <div className="mb-6 lg:hidden">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Регистрация</h1>
          </div>
          <h2 className="hidden text-2xl font-semibold text-zinc-950 lg:block">Создать аккаунт</h2>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-zinc-600">Имя</span>
              <input
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Александр"
                className="mt-1.5 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-zinc-400 focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-zinc-600">Email</span>
              <input
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="you@example.com"
                className="mt-1.5 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-zinc-400 focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-zinc-600">Пароль</span>
              <input
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="Минимум 6 символов"
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
              {loading ? "Создаём аккаунт…" : "Зарегистрироваться"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-zinc-500">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="font-semibold text-zinc-950 hover:underline">
              Войти
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}
