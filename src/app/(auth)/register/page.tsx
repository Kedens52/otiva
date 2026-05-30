"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import { Logo } from "@/components/layout/Logo"
import { PAGE_CONTAINER_WIDE_CLASS } from "@/components/layout/PageContainer"
import { AuthSocialLoginSection } from "@/components/auth/AuthSocialLoginSection"
import { needsProfileCompletion } from "@/lib/auth-post-login"
import { oauthErrorMessage } from "@/lib/oauth-errors"
import { LEGAL_LINKS } from "@/lib/legal-meta"

type Step = "start" | "profile"

function RegisterForm() {
  const router = useRouter()
  const params = useSearchParams()
  const redirectTo = params.get("from") || "/profile"
  const completeOnly = params.get("complete") === "1"
  const [step, setStep] = useState<Step>(completeOnly ? "profile" : "start")
  const [hasSession, setHasSession] = useState(false)
  const [phone, setPhone] = useState("")
  const [name, setName] = useState("")
  const [city, setCity] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(oauthErrorMessage(params.get("error")) ?? "")

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const user = data?.user
        if (!user) {
          if (completeOnly) {
            router.replace(`/login?from=${encodeURIComponent(redirectTo)}`)
          }
          return
        }

        setHasSession(true)
        setPhone(user.phone || "")
        setName(user.name || "")
        setCity(user.city || "")
        setDescription(user.description || "")

        if (!needsProfileCompletion(user)) {
          router.replace(redirectTo)
          return
        }

        setStep("profile")
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [completeOnly, redirectTo, router])

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
    <main className={`${PAGE_CONTAINER_WIDE_CLASS} grid min-h-screen py-6 lg:grid-cols-[1fr_460px] lg:items-center lg:gap-12 lg:py-10`}>
      <section className="hidden lg:block">
        <Logo />
        <h1 className="mt-8 max-w-2xl text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
          {completeOnly || hasSession ? "Дополните профиль" : "Создайте профиль продавца"}
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-zinc-500">
          {completeOnly || hasSession
            ? "Осталось сохранить имя и город — после этого откроется ваш кабинет."
            : "Зарегистрируйтесь через VK или Яндекс ID. Вход по номеру телефона подключаем — скоро будет доступен."}
        </p>
      </section>

      <section className="mx-auto flex w-full max-w-md flex-col justify-center">
        <div className="mb-8 flex justify-center lg:hidden">
          <Logo />
        </div>
        <div className="rounded-2xl border border-white/80 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.05)] sm:p-5">
          <div className="rounded-2xl bg-white p-2 sm:p-3">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--nashlo-orange))]">
                {step === "profile" ? "Профиль" : "Регистрация"}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
                {step === "profile" ? "Заполните профиль" : "Регистрация"}
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-zinc-500">
                {step === "profile"
                  ? "Эти данные будут видны в ваших объявлениях и карточке продавца."
                  : "Выберите VK или Яндекс ID — после входа дополните профиль."}
              </p>
            </div>

            {step !== "profile" && !hasSession && (
              <>
                {error ? (
                  <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>
                ) : null}
                <AuthSocialLoginSection
                  redirectTo={redirectTo}
                  onAuthSuccess={async () => {
                    window.dispatchEvent(new Event("nashlo-auth-change"))
                    const res = await fetch("/api/auth/me")
                    const user = res.ok ? (await res.json())?.user : null
                    if (user && !needsProfileCompletion(user)) {
                      router.replace(redirectTo)
                      router.refresh()
                      return
                    }
                    setHasSession(true)
                    if (user) {
                      setName(user.name || "")
                      setCity(user.city || "")
                      setDescription(user.description || "")
                      setPhone(user.phone || "")
                    }
                    setStep("profile")
                  }}
                  onAuthError={(msg) => setError(msg)}
                />
                <p className="mt-4 text-xs leading-relaxed text-zinc-400">
                  Регистрируясь, вы принимаете{" "}
                  <Link href={LEGAL_LINKS.userAgreement} className="underline hover:text-zinc-700">
                    условия использования
                  </Link>
                  ,{" "}
                  <Link href={LEGAL_LINKS.privacyPolicy} className="underline hover:text-zinc-700">
                    политику конфиденциальности
                  </Link>{" "}
                  и даёте{" "}
                  <Link href={LEGAL_LINKS.personalDataConsent} className="underline hover:text-zinc-700">
                    согласие на обработку персональных данных
                  </Link>
                  .
                </p>
              </>
            )}

            {step === "profile" && (
              <form onSubmit={saveProfile} className="space-y-4">
                {hasSession && (
                  <p className="rounded-2xl bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
                    Вы уже вошли в аккаунт. Подтвердите или уточните данные профиля — повторная регистрация не нужна.
                  </p>
                )}
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
