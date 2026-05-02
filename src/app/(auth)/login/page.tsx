"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useRef, useState } from "react"
import { Logo } from "@/components/layout/Logo"

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    VKIDSDK?: any
  }
}

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const vkContainerRef = useRef<HTMLDivElement>(null)
  const redirectTo = params.get("from") || "/"
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [step, setStep] = useState<"phone" | "code">("phone")
  const [loading, setLoading] = useState(false)

  const OAUTH_ERRORS: Record<string, string> = {
    banned:        "Ваш аккаунт заблокирован.",
    yandex_denied: "Вы отменили вход через Яндекс.",
    yandex_token:  "Ошибка авторизации через Яндекс. Попробуйте ещё раз.",
    yandex_user:   "Не удалось получить данные от Яндекса.",
    yandex_error:  "Ошибка входа через Яндекс. Попробуйте позже.",
    vk_denied:     "Вы отменили вход через VK.",
    vk_token:      "Ошибка авторизации через VK. Попробуйте ещё раз.",
    vk_user:       "Не удалось получить данные от VK.",
    vk_error:      "Ошибка входа через VK. Попробуйте позже.",
  }
  const oauthError = params.get("error")
  const [error, setError] = useState(oauthError ? (OAUTH_ERRORS[oauthError] ?? "Ошибка авторизации.") : "")

  useEffect(() => {
    let cancelled = false

    function initVKID() {
      if (cancelled || !window.VKIDSDK || !vkContainerRef.current) return

      const VKID = window.VKIDSDK
      vkContainerRef.current.innerHTML = ""

      VKID.Config.init({
        app: 54574778,
        redirectUrl: "https://nashlo.ru/api/auth/vk/callback",
        responseMode: VKID.ConfigResponseMode.Callback,
        source: VKID.ConfigSource.LOWCODE,
        scope: "email phone",
      })

      const oneTap = new VKID.OneTap()
      oneTap
        .render({
          container: vkContainerRef.current,
          showAlternativeLogin: true,
        })
        .on(VKID.WidgetEvents.ERROR, () => {
          setError("VK не загрузил кнопку. Попробуйте вход через запасную кнопку ниже.")
        })
        .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, (payload: Record<string, string>) => {
          VKID.Auth.exchangeCode(payload.code, payload.device_id)
            .then(async (data: Record<string, unknown>) => {
              const res = await fetch("/api/auth/vk/token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
              })

              if (!res.ok) {
                setError("VK вернул данные, но вход не завершился. Попробуйте ещё раз.")
                return
              }

              window.dispatchEvent(new Event("nashlo-auth-change"))
              router.replace(redirectTo)
              router.refresh()
            })
            .catch(() => {
              setError("Не удалось завершить вход через VK.")
            })
        })
    }

    const existing = document.getElementById("vkid-sdk-script") as HTMLScriptElement | null
    if (existing) {
      if (window.VKIDSDK) initVKID()
      else existing.addEventListener("load", initVKID, { once: true })
      return () => {
        cancelled = true
        existing.removeEventListener("load", initVKID)
      }
    }

    const script = document.createElement("script")
    script.id = "vkid-sdk-script"
    script.src = "https://unpkg.com/@vkid/sdk@2/dist-sdk/umd/index.js"
    script.async = true
    script.onload = initVKID
    script.onerror = () => setError("Не удалось загрузить VK ID. Попробуйте запасной вход через VK.")
    document.body.appendChild(script)

    return () => {
      cancelled = true
      script.onload = null
      script.onerror = null
    }
  }, [router, redirectTo])

  function formatPhone(raw: string) {
    const digits = raw.replace(/\D/g, "")
    if (digits.startsWith("8")) return `+7${digits.slice(1)}`
    if (digits.startsWith("7") && digits.length === 11) return `+${digits}`
    if (digits.length === 10) return `+7${digits}`
    return raw
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const digits = phone.replace(/\D/g, "")
    if (digits.length < 10) { setError("Введите корректный номер телефона"); return }

    setLoading(true)
    const res = await fetch("/api/auth/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: formatPhone(phone) }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error || "Ошибка отправки кода"); return }
    setStep("code")
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (code.length !== 6) { setError("Введите 6-значный код"); return }

    setLoading(true)
    const res = await fetch("/api/auth/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: formatPhone(phone), code }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error || "Неверный код"); return }

    window.dispatchEvent(new Event("nashlo-auth-change"))
    router.replace(data.isNew ? `/register?from=${encodeURIComponent(redirectTo)}&complete=1` : redirectTo)
    router.refresh()
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 lg:grid lg:min-h-[720px] lg:grid-cols-[1fr_460px] lg:items-center lg:gap-10 lg:py-12">
      <div className="mb-10 flex justify-center pt-4 lg:hidden">
        <Logo />
      </div>

      <section className="hidden lg:block">
        <div className="mb-8">
          <Logo />
        </div>
        <h1 className="max-w-2xl text-5xl font-semibold tracking-tight text-zinc-950 sm:text-6xl">Добро пожаловать</h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-500">
          Войдите, чтобы управлять объявлениями, переписываться с покупателями и отслеживать сделки.
        </p>
      </section>

      <section className="mx-auto w-full max-w-md rounded-[28px] border border-zinc-200 bg-zinc-50 p-4 shadow-inner sm:p-6 lg:max-w-none lg:rounded-[32px]">
        <div className="rounded-[24px] bg-white p-5 shadow-sm sm:rounded-[28px] sm:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
              {step === "phone" ? "Вход или регистрация" : "Введите код"}
            </h1>
            {step === "phone" ? (
              <p className="mt-1.5 text-sm text-zinc-500">Введите номер телефона — вышлем SMS с кодом</p>
            ) : (
              <p className="mt-1.5 text-sm text-zinc-500">
                Мы отправили код на <span className="font-semibold text-zinc-950">{phone}</span>
              </p>
            )}
          </div>

          {step === "phone" ? (
            <form onSubmit={sendCode} className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-zinc-600">Номер телефона</span>
                <input
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (999) 000-00-00"
                  className="mt-1.5 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-zinc-400 focus:bg-white"
                  autoFocus
                />
              </label>

              {error && (
                <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-zinc-950 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
              >
                {loading ? "Отправляем…" : "Получить код"}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyCode} className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-zinc-600">Код из SMS</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="mt-1.5 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-center text-2xl font-bold tracking-[0.35em] outline-none transition focus:border-zinc-400 focus:bg-white"
                  autoFocus
                />
              </label>

              {error && (
                <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full rounded-2xl bg-zinc-950 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
              >
                {loading ? "Проверяем…" : "Войти"}
              </button>

              <button
                type="button"
                onClick={() => { setStep("phone"); setCode(""); setError("") }}
                className="w-full rounded-2xl py-2.5 text-sm font-medium text-zinc-500 hover:text-zinc-950"
              >
                ← Изменить номер
              </button>
            </form>
          )}

          <div className="mt-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-100" />
            <span className="text-xs text-zinc-400">Или продолжить через</span>
            <div className="h-px flex-1 bg-zinc-100" />
          </div>

          <div className="mt-4">
            <div ref={vkContainerRef} />
          </div>

          <div className="mt-3 flex justify-center gap-3">
            {/* VK */}
            <button
              type="button"
              onClick={() => { window.location.href = `/api/auth/vk?next=${encodeURIComponent(redirectTo)}` }}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0077FF] text-white shadow-sm transition hover:brightness-110"
              aria-label="Войти через ВКонтакте"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.523-2.049-1.713-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.204.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.049.17.49-.085.745-.576.745z"/>
              </svg>
            </button>

            {/* Yandex */}
            <button
              type="button"
              onClick={() => { window.location.href = "/api/auth/yandex" }}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FC3F1D] text-white shadow-sm transition hover:brightness-110"
              aria-label="Войти через Яндекс"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14.006 20.832V13.02h1.045c1.766 0 2.702-.99 2.702-2.634 0-1.81-1.1-2.737-2.798-2.737h-.949v13.183h-2.076V5.834h3.025c2.937 0 4.765 1.762 4.765 4.49 0 2.39-1.296 3.986-3.457 4.368l3.8 6.14h-2.37l-3.687-6.14v6.14zM2 12c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12z"/>
              </svg>
            </button>
          </div>

          <p className="mt-5 text-center text-xs text-zinc-400">
            Нет аккаунта?{" "}
            <Link href={`/register?from=${encodeURIComponent(redirectTo)}`} className="font-semibold text-zinc-950 hover:underline">
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
