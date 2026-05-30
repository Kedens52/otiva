"use client"

import { useEffect, useState } from "react"
import { VKIDButton } from "@/components/auth/VKIDButton"

type Providers = { vk: boolean; yandex: boolean }

type OAuthLoginButtonsProps = {
  redirectTo?: string
  onBusyChange?: (busy: boolean) => void
  onAuthSuccess?: () => void
  onAuthError?: (message: string) => void
}

function oauthHref(provider: "yandex", redirectTo: string) {
  const next = encodeURIComponent(redirectTo || "/profile")
  return `/api/auth/${provider}?next=${next}`
}

export function OAuthLoginButtons({
  redirectTo = "/profile",
  onBusyChange,
  onAuthSuccess,
  onAuthError,
}: OAuthLoginButtonsProps) {
  const [providers, setProviders] = useState<Providers | null>(null)
  const [yandexBusy, setYandexBusy] = useState(false)
  const [vkBusy, setVkBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch("/api/auth/providers")
      .then((r) => (r.ok ? r.json() : { vk: false, yandex: false }))
      .then((data) => {
        if (!cancelled) {
          setProviders({ vk: Boolean(data.vk), yandex: Boolean(data.yandex) })
        }
      })
      .catch(() => {
        if (!cancelled) setProviders({ vk: false, yandex: false })
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    onBusyChange?.(vkBusy || yandexBusy)
  }, [vkBusy, yandexBusy, onBusyChange])

  if (providers === null) {
    return (
      <div className="grid gap-2">
        <div className="h-12 animate-pulse rounded-2xl bg-zinc-100" />
        <div className="h-12 animate-pulse rounded-2xl bg-zinc-100" />
      </div>
    )
  }

  /** /api/auth/providers — VK: app id; Яндекс: id + secret */
  const showVk = providers.vk
  const showYandex = providers.yandex

  if (!showVk && !showYandex) {
    return (
      <p className="text-xs leading-relaxed text-zinc-500">
        Вход через VK и Яндекс ID временно недоступен. Мы подключаем авторизацию — попробуйте
        позже или напишите в{" "}
        <a href="/support" className="font-semibold text-zinc-700 underline">
          поддержку
        </a>
        .
      </p>
    )
  }

  return (
    <div className="grid gap-2">
      {showVk ? (
        <VKIDButton
          enabled
          redirectTo={redirectTo}
          onSuccess={onAuthSuccess}
          onError={onAuthError}
          onBusyChange={setVkBusy}
        />
      ) : null}

      {showYandex ? (
        <button
          type="button"
          disabled={vkBusy || yandexBusy}
          onClick={() => {
            setYandexBusy(true)
            window.location.href = oauthHref("yandex", redirectTo)
          }}
          className="flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-60"
        >
          {yandexBusy ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-600" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#FC3F1D" aria-hidden>
              <path d="M2.04 12c0-5.523 4.476-10 9.998-10C17.522 2 22 6.477 22 12s-4.478 10-9.962 10C6.516 22 2.04 17.523 2.04 12zm11.05 3.692V8.308h1.12c1.517 0 2.326.85 2.326 2.268 0 1.56-.95 2.354-2.835 2.354h-.61v2.762h-1.001zm0-3.578h.554c1.191 0 1.866-.497 1.866-1.47 0-.93-.596-1.39-1.782-1.39h-.638v2.86z" />
            </svg>
          )}
          Войти через Яндекс ID
        </button>
      ) : null}
    </div>
  )
}
