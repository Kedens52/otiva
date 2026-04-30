"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

type RegisterMode = "email" | "phone"

function formatRuPhone(value: string) {
  const rawDigits = value.replace(/\D/g, "")
  const withoutCountry = rawDigits.replace(/^8/, "7").replace(/^7/, "").slice(0, 10)
  const parts = [
    withoutCountry.slice(0, 3),
    withoutCountry.slice(3, 6),
    withoutCountry.slice(6, 8),
    withoutCountry.slice(8, 10),
  ].filter(Boolean)

  if (parts.length === 0) return "+7 "
  if (parts.length === 1) return `+7 ${parts[0]}`
  if (parts.length === 2) return `+7 ${parts[0]} ${parts[1]}`
  if (parts.length === 3) return `+7 ${parts[0]} ${parts[1]}-${parts[2]}`
  return `+7 ${parts[0]} ${parts[1]}-${parts[2]}-${parts[3]}`
}

export default function RegisterPage() {
  const router = useRouter()
  const [mode, setMode] = useState<RegisterMode>("email")
  const [form, setForm] = useState({
    name: "Александр",
    phone: "+7 999 123-45-67",
    email: "demo@otiva.ru",
    city: "Санкт-Петербург",
    about: "Продаю и покупаю на Otiva.",
  })
  const [message, setMessage] = useState("")

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setMessage("")
  }

  function register() {
    const hasName = form.name.trim().length >= 2
    const hasEmail = form.email.includes("@")
    const phoneDigits = form.phone.replace(/\D/g, "")
    const hasPhone = phoneDigits.length === 11 && phoneDigits.startsWith("7")

    if (!hasName) {
      setMessage("Введите имя минимум из 2 символов.")
      return
    }

    if (mode === "email" && !hasEmail) {
      setMessage("Введите почту. Для демо подойдет demo@otiva.ru.")
      return
    }

    if (mode === "phone" && !hasPhone) {
      setMessage("Введите телефон. Для демо подойдет +7 999 123-45-67.")
      return
    }

    window.localStorage.setItem("otiva-demo-user", JSON.stringify(form))
    window.dispatchEvent(new Event("otiva-auth-change"))
    router.push("/profile/demo")
  }

  return (
    <main className="mx-auto grid min-h-[720px] max-w-7xl gap-10 px-4 py-12 lg:grid-cols-[1fr_520px] lg:items-center">
      <section>
        <h1 className="max-w-2xl text-5xl font-semibold tracking-tight text-zinc-950 sm:text-6xl">Создайте профиль Otiva</h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-500">
          Тестовая регистрация сохраняет профиль в браузере и сразу открывает страницу профиля.
        </p>
      </section>

      <section className="rounded-[32px] border border-zinc-200 bg-zinc-50 p-6 shadow-inner">
        <div className="space-y-4 rounded-[28px] bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-zinc-950">Регистрация</h2>

          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-zinc-100 p-1">
            <button
              type="button"
              onClick={() => setMode("email")}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${mode === "email" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-950"}`}
            >
              По почте
            </button>
            <button
              type="button"
              onClick={() => setMode("phone")}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${mode === "phone" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-950"}`}
            >
              По телефону
            </button>
          </div>

          <input className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-[hsl(var(--otiva-orange))]" placeholder="Имя" value={form.name} onChange={(event) => updateField("name", event.target.value)} />
          {mode === "email" ? (
            <input className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-[hsl(var(--otiva-orange))]" placeholder="Email" value={form.email} onChange={(event) => updateField("email", event.target.value)} />
          ) : (
            <input
              className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-[hsl(var(--otiva-orange))]"
              placeholder="Телефон"
              value={form.phone}
              onChange={(event) => updateField("phone", formatRuPhone(event.target.value))}
              inputMode="tel"
              maxLength={16}
            />
          )}
          <input className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-[hsl(var(--otiva-orange))]" placeholder="Город" value={form.city} onChange={(event) => updateField("city", event.target.value)} />
          <textarea className="min-h-28 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-[hsl(var(--otiva-orange))]" placeholder="О себе" value={form.about} onChange={(event) => updateField("about", event.target.value)} />
          <button onClick={register} className="w-full rounded-2xl bg-[hsl(var(--otiva-orange))] px-5 py-3 text-sm font-semibold text-white hover:bg-[hsl(var(--otiva-orange)/0.9)]">
            Создать профиль
          </button>
          {message && (
            <div className="rounded-2xl bg-[hsl(var(--otiva-mint)/0.12)] px-4 py-3 text-sm font-medium text-zinc-700">
              {message}
            </div>
          )}
          <p className="text-sm text-zinc-500">
            Уже есть профиль?{" "}
            <Link href="/login" className="font-semibold text-zinc-950">
              Войти
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}
