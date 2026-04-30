"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Logo } from "@/components/layout/Logo"

type LoginMode = "phone" | "email"

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

function saveDemoUser(user: { name: string; phone: string; email: string; city: string; about: string }) {
  window.localStorage.setItem("otiva-demo-user", JSON.stringify(user))
  window.dispatchEvent(new Event("otiva-auth-change"))
}

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<LoginMode>("phone")
  const [phone, setPhone] = useState("+7 ")
  const [email, setEmail] = useState("demo@otiva.ru")
  const [password, setPassword] = useState("123456")
  const [code, setCode] = useState("")
  const [codeSent, setCodeSent] = useState(false)
  const [message, setMessage] = useState("")

  function finishLogin(nextUser?: Partial<{ name: string; phone: string; email: string }>) {
    const user = {
      name: nextUser?.name || (email.includes("@") ? email.split("@")[0] : "Демо пользователь"),
      phone: nextUser?.phone || phone,
      email: nextUser?.email || email,
      city: "Санкт-Петербург",
      about: "Покупаю и продаю на Отиве.",
    }
    saveDemoUser(user)
    router.push("/profile/demo")
  }

  function submit() {
    setMessage("")

    if (mode === "phone") {
      const digits = phone.replace(/\D/g, "")

      if (!codeSent) {
        if (digits.length !== 11 || !digits.startsWith("7")) {
          setMessage("Введите номер телефона. Для демо подойдет +7 999 123-45-67.")
          return
        }
        setCode("123456")
        setCodeSent(true)
        setMessage("Демо-код уже подставлен: 123456. Нажмите «Войти».")
        return
      }

      if (code.trim() !== "123456") {
        setMessage("Для демо используйте код 123456.")
        return
      }

      finishLogin({ name: "Демо пользователь", phone, email: "" })
      return
    }

    if (!email.includes("@")) {
      setMessage("Введите почту. Для демо подойдет demo@otiva.ru.")
      return
    }

    if (password.trim().length < 3) {
      setMessage("Введите любой пароль от 3 символов. Для демо подойдет 123456.")
      return
    }

    finishLogin({ name: email.split("@")[0], email, phone: "" })
  }

  function switchMode(nextMode: LoginMode) {
    setMode(nextMode)
    setCodeSent(false)
    setCode("")
    setMessage("")
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 lg:grid lg:min-h-[720px] lg:grid-cols-[1fr_460px] lg:items-center lg:gap-10 lg:py-12">
      <div className="mb-10 flex justify-center pt-4 lg:hidden">
        <Logo />
      </div>

      <section className="hidden lg:block">
        <h1 className="max-w-2xl text-5xl font-semibold tracking-tight text-zinc-950 sm:text-6xl">Войдите в Отиву</h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-500">
          Демо-вход работает без сервера: можно войти по телефону, по почте или одной кнопкой.
        </p>
      </section>

      <section className="mx-auto w-full max-w-md rounded-[28px] border border-zinc-200 bg-zinc-50 p-4 shadow-inner sm:p-6 lg:max-w-none lg:rounded-[32px]">
        <div className="rounded-[24px] bg-white p-5 shadow-sm sm:rounded-[28px] sm:p-6">
          <div className="mb-6 lg:hidden">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Вход</h1>
            <p className="mt-2 text-sm leading-6 text-zinc-500">Войдите по телефону или почте. Демо работает без сервера.</p>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-zinc-100 p-1">
            <button
              type="button"
              onClick={() => switchMode("phone")}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${mode === "phone" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-950"}`}
            >
              Телефон
            </button>
            <button
              type="button"
              onClick={() => switchMode("email")}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${mode === "email" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-950"}`}
            >
              Почта
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {mode === "phone" ? (
              <>
                <label className="block">
                  <span className="text-sm font-medium text-zinc-600">Телефон</span>
                  <input
                    value={phone}
                    onChange={(event) => {
                      setPhone(formatRuPhone(event.target.value))
                      setCodeSent(false)
                      setMessage("")
                    }}
                    className="mt-2 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-[hsl(var(--otiva-orange))]"
                    placeholder="+7 999 123-45-67"
                    inputMode="tel"
                    maxLength={16}
                  />
                </label>
                {codeSent && (
                  <label className="block">
                    <span className="text-sm font-medium text-zinc-600">Код из SMS</span>
                    <input
                      value={code}
                      onChange={(event) => setCode(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-[hsl(var(--otiva-orange))]"
                      placeholder="123456"
                    />
                  </label>
                )}
              </>
            ) : (
              <>
                <label className="block">
                  <span className="text-sm font-medium text-zinc-600">Почта</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      setMessage("")
                    }}
                    className="mt-2 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-[hsl(var(--otiva-orange))]"
                    placeholder="demo@otiva.ru"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-zinc-600">Пароль</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value)
                      setMessage("")
                    }}
                    className="mt-2 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-[hsl(var(--otiva-orange))]"
                    placeholder="Любой пароль для демо"
                  />
                </label>
              </>
            )}

            <button
              type="button"
              onClick={submit}
              className="w-full rounded-2xl bg-[hsl(var(--otiva-orange))] px-5 py-3 text-sm font-semibold text-white hover:bg-[hsl(var(--otiva-orange)/0.9)]"
            >
              {mode === "phone" && !codeSent ? "Получить код" : "Войти"}
            </button>
            <button
              type="button"
              onClick={() => finishLogin({ name: "Демо пользователь", phone: "+7 999 123-45-67", email: "demo@otiva.ru" })}
              className="w-full rounded-2xl border border-zinc-200 px-5 py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-100"
            >
              Войти как демо-пользователь
            </button>
            {message && <p className="rounded-2xl bg-zinc-100 px-4 py-3 text-sm text-zinc-700">{message}</p>}
          </div>
          <p className="mt-6 text-sm text-zinc-500">
            Нет профиля?{" "}
            <Link href="/register" className="font-semibold text-zinc-950">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}
