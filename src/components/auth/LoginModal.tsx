"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

interface LoginModalProps {
  open: boolean
  onClose: () => void
}

export function LoginModal({ open, onClose }: LoginModalProps) {
  const router = useRouter()
  const vkContainerRef = useRef<HTMLDivElement>(null)
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [step, setStep] = useState<"phone" | "code" | "name">("phone")
  const [name, setName] = useState("")
  const [isNew, setIsNew] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Закрытие по Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  // Блокировка скролла
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  // VK SDK
  useEffect(() => {
    if (!open) return
    const existing = document.getElementById("vkid-sdk-script")
    const init = () => {
      setTimeout(() => {
        if (!("VKIDSDK" in window) || !vkContainerRef.current) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const VKID = (window as any).VKIDSDK
        vkContainerRef.current.innerHTML = ""
        VKID.Config.init({
          app: 54574778,
          redirectUrl: "https://nashlo.ru/api/auth/vk/callback",
          responseMode: VKID.ConfigResponseMode.Callback,
          source: VKID.ConfigSource.LOWCODE,
          scope: "",
        })
        const oneTap = new VKID.OneTap()
        oneTap
          .render({
            container: vkContainerRef.current,
            showAlternativeLogin: true,
          })
          .on(VKID.WidgetEvents.ERROR, () => {
            setError("VK не загрузил кнопку. Попробуйте запасной вход через VK.")
          })
          .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, (payload: Record<string, string>) => {
            VKID.Auth.exchangeCode(payload.code, payload.device_id)
              .then(async (data: Record<string, unknown>) => {
                const res = await fetch("/api/auth/vk/token", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(data),
                })
                if (res.ok) {
                  window.dispatchEvent(new Event("nashlo-auth-change"))
                  onClose()
                  router.refresh()
                } else {
                  setError("VK вернул данные, но вход не завершился. Попробуйте ещё раз.")
                }
              })
              .catch(() => setError("Не удалось завершить вход через VK."))
          })
      }, 150)
    }

    if (existing) {
      init()
    } else {
      const script = document.createElement("script")
      script.id = "vkid-sdk-script"
      script.src = "https://unpkg.com/@vkid/sdk@2/dist-sdk/umd/index.js"
      script.async = true
      script.onload = init
      document.body.appendChild(script)
    }
  }, [open, router, onClose])

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
    if (digits.length < 10) { setError("Введите корректный номер"); return }
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

    // Если новый пользователь — спросим имя
    if (data.isNew) {
      setIsNew(true)
      setStep("name")
      return
    }

    window.dispatchEvent(new Event("nashlo-auth-change"))
    onClose()
    router.refresh()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-[420px] overflow-hidden rounded-3xl bg-white shadow-2xl mx-4">
        {/* Кнопка закрытия */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
        >
          ✕
        </button>

        {/* Верхняя часть — форма */}
        <div className="px-7 pt-7 pb-6">
          <h2 className="text-2xl font-bold text-zinc-950">Вход</h2>

          {step === "name" ? (
            <form onSubmit={async (e) => {
              e.preventDefault()
              if (name.trim().length < 2) { setError("Введите имя (минимум 2 символа)"); return }
              setLoading(true)
              await fetch("/api/auth/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim() }),
              })
              setLoading(false)
              window.dispatchEvent(new Event("nashlo-auth-change"))
              onClose()
              router.refresh()
            }} className="mt-5 space-y-3">
              <p className="text-sm text-zinc-500">Как вас зовут?</p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ваше имя"
                className="h-13 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
                autoFocus
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-2xl bg-blue-500 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? "Сохраняем…" : "Продолжить"}
              </button>
            </form>
          ) : step === "phone" ? (
            <form onSubmit={sendCode} className="mt-5 space-y-3">
              <input
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 999 000-00-00"
                className="h-13 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
                autoFocus
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="h-12 w-auto rounded-2xl bg-blue-500 px-8 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? "Отправляем…" : "Получить код"}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyCode} className="mt-5 space-y-3">
              <p className="text-sm text-zinc-500">Код отправлен на <span className="font-semibold text-zinc-950">{phone}</span></p>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="h-13 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-center text-2xl font-bold tracking-[0.3em] outline-none transition focus:border-blue-400 focus:bg-white"
                autoFocus
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="h-12 rounded-2xl bg-blue-500 px-8 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? "Проверяем…" : "Войти"}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep("phone"); setCode(""); setError("") }}
                  className="h-12 rounded-2xl px-4 text-sm text-zinc-500 hover:text-zinc-950"
                >
                  ← Назад
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Нижняя часть — соцсети */}
        <div className="bg-zinc-50 px-7 py-6">
          <p className="text-sm text-zinc-500">Или продолжить через</p>
          <div className="mt-3" ref={vkContainerRef} />
          <a
            href="/api/auth/vk"
            className="mt-2 flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition hover:border-[#0077FF] hover:bg-[#0077FF]/5 hover:text-[#0077FF]"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0077FF] text-xs font-bold text-white">VK</span>
            Запасной вход через VK
          </a>
          <a
            href="/api/auth/yandex"
            className="mt-2 flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition hover:border-[#FC3F1D] hover:bg-[#FC3F1D]/5 hover:text-[#FC3F1D]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.04 12c0-5.523 4.476-10 9.998-10C17.522 2 22 6.477 22 12s-4.478 10-9.962 10C6.516 22 2.04 17.523 2.04 12zm11.05 3.692V8.308h1.12c1.517 0 2.326.85 2.326 2.268 0 1.56-.95 2.354-2.835 2.354h-.61v2.762h-1.001zm0-3.578h.554c1.191 0 1.866-.497 1.866-1.47 0-.93-.596-1.39-1.782-1.39h-.638v2.86z"/>
            </svg>
            Войти через Яндекс
          </a>
          <p className="mt-5 text-xs text-zinc-400">
            Входя, вы принимаете{" "}
            <a href="/terms" className="underline hover:text-zinc-700">условия использования</a>{" "}
            и{" "}
            <a href="/privacy" className="underline hover:text-zinc-700">политику конфиденциальности</a>
          </p>
        </div>
      </div>
    </div>
  )
}
