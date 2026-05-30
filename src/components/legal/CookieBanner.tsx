"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { Settings2 } from "lucide-react"
import {
  type CookieConsentValue,
  getStoredCookieConsent,
} from "@/lib/cookie-consent"
import { persistCookieConsent } from "@/lib/cookie-consent-client"
import { LEGAL_LINKS } from "@/lib/legal-meta"

export function CookieBanner({ reserveMobileAdSpace = true }: { reserveMobileAdSpace?: boolean }) {
  const [visible, setVisible] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (getStoredCookieConsent() === null) setVisible(true)
  }, [])

  const applyChoice = useCallback(async (choice: CookieConsentValue) => {
    setSaving(true)
    await persistCookieConsent(choice, "cookie_banner")
    setSaving(false)
    setVisible(false)
  }, [])

  if (!visible) return null

  return (
    <div
      className={`fixed inset-x-3 z-[140] mx-auto max-w-lg rounded-[24px] border border-zinc-200/90 bg-white/95 p-4 shadow-[0_18px_52px_rgba(15,23,42,0.16)] backdrop-blur-md lg:bottom-3 lg:left-auto lg:right-4 lg:mx-0 lg:pb-4 ${
        reserveMobileAdSpace
          ? "bottom-[calc(env(safe-area-inset-bottom)+var(--nashlo-mobile-nav-h)+var(--nashlo-mobile-ad-h)+0.875rem)]"
          : "bottom-[calc(env(safe-area-inset-bottom)+var(--nashlo-mobile-nav-h)+0.875rem)]"
      }`}
      role="dialog"
      aria-label="Настройки cookie"
    >
      <p className="text-sm font-semibold text-zinc-900">Файлы cookie</p>
      <p className="mt-2 text-xs leading-relaxed text-zinc-600">
        Необходимые cookie нужны для входа и работы сайта — они всегда включены. Аналитические cookie
        помогают понимать посещаемость и улучшать сервис; их можно принять или отклонить.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => void applyChoice("analytics")}
          className="h-9 rounded-xl bg-[hsl(var(--nashlo-orange))] px-4 text-xs font-semibold text-white transition hover:bg-[hsl(var(--nashlo-orange)/0.92)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--nashlo-orange)/0.30)] disabled:opacity-50"
        >
          Принять все
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => void applyChoice("essential")}
          className="h-9 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/20 disabled:opacity-50"
        >
          Только необходимые
        </button>
        <Link
          href={LEGAL_LINKS.cookiePolicy}
          className="inline-flex h-9 items-center rounded-xl border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
        >
          Подробнее
        </Link>
      </div>
    </div>
  )
}

/** Блок смены выбора (страница политики cookie, футер помощи). */
export function CookiePreferencesPanel({ className = "" }: { className?: string }) {
  const [current, setCurrent] = useState<CookieConsentValue | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setCurrent(getStoredCookieConsent())
  }, [])

  async function save(choice: CookieConsentValue) {
    setSaving(true)
    setSaved(false)
    await persistCookieConsent(choice, "cookie_settings")
    setCurrent(choice)
    setSaving(false)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div
      className={`rounded-[24px] border border-zinc-200 bg-white p-5 shadow-sm ${className}`}
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
        <Settings2 className="h-4 w-4 text-[hsl(var(--nashlo-orange))]" aria-hidden />
        Настройки cookie на этом устройстве
      </div>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">
        Текущий выбор:{" "}
        <span className="font-medium text-zinc-900">
          {current === "analytics"
            ? "приняты аналитические cookie"
            : current === "essential"
              ? "только необходимые cookie"
              : "ещё не выбрано"}
        </span>
        .
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => void save("analytics")}
          className="btn-primary h-9 px-4 text-xs disabled:opacity-50"
        >
          Включить аналитику
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => void save("essential")}
          className="h-9 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
        >
          Только необходимые
        </button>
      </div>
      {saved ? (
        <p className="mt-3 text-xs font-medium text-emerald-700">Настройки сохранены.</p>
      ) : null}
    </div>
  )
}
