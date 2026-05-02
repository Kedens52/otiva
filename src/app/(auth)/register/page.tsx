"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import { Logo } from "@/components/layout/Logo"

type Step = "phone" | "code" | "profile"

function normalizePhone(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 11)
  if (digits.startsWith("8")) return `+7${digits.slice(1)}`
  if (digits.startsWith("7") && digits.length === 11) return `+${digits}`
  if (digits.length === 10) return `+7${digits}`
  return raw
}

function RegisterForm() {
  const router = useRouter()
  const params = useSearchParams()
  const redirectTo = params.get("from") || "/profile"
  const [step, setStep] = useState<Step>("phone")
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [city, setCity] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const user = data?.user
        if (user) {
          setPhone(user.phone || "")
          setName(user.name || "")
          setCity(user.city || "")
          setDescription(user.description || "")
          setStep("profile")
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function sendCode(event: React.FormEvent) {
    event.preventDefault()
    setError("")

    const normalized = normalizePhone(phone)
    if (normalized.replace(/\D/g, "").length !== 11) {
      setError("Введите номер РФ в формате +7 999 000-00-00.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Не удалось отправить код")
      setPhone(data.phone || normalized)
      setStep("code")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка отправки кода")
    } finally {
      setSubmitting(false)
    }
  }

  async function verifyCode(event: React.FormEvent) {
    event.preventDefault()
    setError("")

    if (code.length !== 6) {
      setError("Введите 6-значный код.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizePhone(phone), code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Неверный код")

      const user = data.user
      setName(user?.name || "")
      window.dispatchEvent(new Event("nashlo-auth-change"))
      setStep("profile")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка проверки кода")
    } finally {
      setSubmitting(false)
    }
  }

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault()
    setError("")

    if (name.trim().length < 2) {
      setError("Введите имя, чтобы покупатели понимали, с кем общаются.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          city: city.trim(),
          description: description.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Не удалось сохранить профиль")

      window.dispatchEvent(new Event("nashlo-auth-change"))
      router.replace(redirectTo)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения профиля")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950" />
      </main>
    )
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-7xl px-4 py-8 lg:grid-cols-[1fr_460px] lg:items-center lg:gap-12 lg:py-12">
      <section className="hidden lg:block">
        <Logo />
        <h1 className="mt-10 max-w-2xl text-5xl font-semibold tracking-tight text-zinc-950 sm:text-6xl">
          Создайте профиль продавца
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-500">
          Один аккаунт для объявлений, сообщений, избранного и управления профилем на Нашло.
        </p>
      </section>

      <section className="mx-auto flex w-full max-w-md flex-col justify-center">
        <div className="mb-8 flex justify-center lg:hidden">
          <Logo />
        </div>
        <div className="rounded-[32px] border border-zinc-200 bg-zinc-50 p-4 shadow-inner">
          <div className="rounded-[28px] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--nashlo-orange))]">
                {step === "profile" ? "Профиль" : "Регистрация"}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
                {step === "phone" && "Введите телефон"}
                {step === "code" && "Подтвердите номер"}
                {step === "profile" && "Заполните профиль"}
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-zinc-500">
                {step === "phone" && "Мы отправим SMS-код. Если аккаунта ещё нет, создадим его автоматически."}
                {step === "code" && `Код отправлен на ${phone}.`}
                {step === "profile" && "Эти данные будут видны в ваших объявлениях и карточке продавца."}
              </p>
            </div>

            {step === "phone" && (
              <form onSubmit={sendCode} className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-zinc-700">Телефон</span>
                  <input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    type="tel"
                    autoComplete="tel"
                    placeholder="+7 (999) 000-00-00"
                    className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none transition focus:border-[hsl(var(--nashlo-orange))] focus:bg-white"
                    autoFocus
                  />
                </label>
                {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>}
                <button disabled={submitting} className="h-12 w-full rounded-2xl bg-[hsl(var(--nashlo-orange))] text-sm font-semibold text-white disabled:opacity-50">
                  {submitting ? "Отправляем..." : "Получить код"}
                </button>
              </form>
            )}

            {step === "code" && (
              <form onSubmit={verifyCode} className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-zinc-700">Код из SMS</span>
                  <input
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="000000"
                    className="mt-2 h-14 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-center text-2xl font-bold tracking-[0.35em] outline-none transition focus:border-[hsl(var(--nashlo-orange))] focus:bg-white"
                    autoFocus
                  />
                </label>
                {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>}
                <button disabled={submitting || code.length !== 6} className="h-12 w-full rounded-2xl bg-[hsl(var(--nashlo-orange))] text-sm font-semibold text-white disabled:opacity-50">
                  {submitting ? "Проверяем..." : "Продолжить"}
                </button>
                <button type="button" onClick={() => { setStep("phone"); setCode(""); setError("") }} className="w-full rounded-2xl py-2 text-sm font-medium text-zinc-500">
                  Изменить номер
                </button>
              </form>
            )}

            {step === "profile" && (
              <form onSubmit={saveProfile} className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-zinc-700">Имя *</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Как вас зовут"
                    className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none transition focus:border-[hsl(var(--nashlo-orange))] focus:bg-white"
                    autoFocus
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-zinc-700">Город</span>
                  <input
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    placeholder="Москва"
                    className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none transition focus:border-[hsl(var(--nashlo-orange))] focus:bg-white"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-zinc-700">О себе</span>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value.slice(0, 500))}
                    rows={3}
                    placeholder="Коротко о себе, опыте продаж или услугах"
                    className="mt-2 w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm outline-none transition focus:border-[hsl(var(--nashlo-orange))] focus:bg-white"
                  />
                </label>
                {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>}
                <button disabled={submitting} className="h-12 w-full rounded-2xl bg-[hsl(var(--nashlo-orange))] text-sm font-semibold text-white disabled:opacity-50">
                  {submitting ? "Сохраняем..." : "Сохранить профиль"}
                </button>
              </form>
            )}

            <p className="mt-5 text-center text-xs text-zinc-400">
              Уже есть аккаунт?{" "}
              <Link href={`/login?from=${encodeURIComponent(redirectTo)}`} className="font-semibold text-zinc-950 hover:underline">
                Войти
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
