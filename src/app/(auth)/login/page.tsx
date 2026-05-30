"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import { Logo } from "@/components/layout/Logo"
import { PAGE_CONTAINER_WIDE_CLASS } from "@/components/layout/PageContainer"
import { AuthSocialLoginSection } from "@/components/auth/AuthSocialLoginSection"
import { needsProfileCompletion } from "@/lib/auth-post-login"
import { oauthErrorMessage } from "@/lib/oauth-errors"

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const redirectTo = params.get("from") || "/profile"
  const [error, setError] = useState(oauthErrorMessage(params.get("error")) ?? "")

  async function onOAuthSuccess() {
    window.dispatchEvent(new Event("nashlo-auth-change"))
    const res = await fetch("/api/auth/me")
    const user = res.ok ? (await res.json())?.user : null
    if (user && needsProfileCompletion(user)) {
      router.replace(`/register?from=${encodeURIComponent(redirectTo)}&complete=1`)
    } else {
      router.replace(redirectTo)
    }
    router.refresh()
  }

  return (
    <main className={`${PAGE_CONTAINER_WIDE_CLASS} flex min-h-screen flex-col py-6 lg:grid lg:min-h-[720px] lg:grid-cols-[1fr_460px] lg:items-center lg:gap-10 lg:py-10`}>
      <div className="mb-10 flex justify-center pt-4 lg:hidden">
        <Logo />
      </div>

      <section className="hidden lg:block">
        <div className="mb-8">
          <Logo />
        </div>
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">Добро пожаловать</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-zinc-500">
          Войдите через VK или Яндекс ID. Вход по номеру телефона мы подключаем — скоро будет доступен.
        </p>
      </section>

      <section className="mx-auto w-full max-w-md rounded-2xl border border-white/80 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)] sm:p-7 lg:max-w-none">
        <div>
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Вход или регистрация</h1>
            <p className="mt-1.5 text-sm text-zinc-500">Выберите VK или Яндекс ID</p>
          </div>

          {error ? (
            <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>
          ) : null}
          <AuthSocialLoginSection
            redirectTo={redirectTo}
            onAuthSuccess={onOAuthSuccess}
            onAuthError={(msg) => setError(msg)}
          />

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
