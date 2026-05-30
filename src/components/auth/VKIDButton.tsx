"use client"

import { useEffect, useRef, useState } from "react"
import { loadVkIdSdk } from "@/lib/load-vkid-sdk"
import { getVkIdRedirectUrl } from "@/lib/oauth-browser"

type VKIDButtonProps = {
  enabled?: boolean
  redirectTo?: string
  onSuccess?: () => void
  onError?: (message: string) => void
  onBusyChange?: (busy: boolean) => void
  className?: string
}

function vkStartHref(redirectTo: string) {
  return `/api/auth/vk?next=${encodeURIComponent(redirectTo || "/profile")}`
}

type VkConfig = {
  enabled: boolean
  appId: number | null
  redirectUrl: string
}

/** На телефонах OneTap ненадёжен — сразу редирект через id.vk.com. */
function prefersVkServerRedirect(): boolean {
  if (typeof window === "undefined") return false
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod|Android|Mobile/i.test(ua)) return true
  if (window.matchMedia("(max-width: 768px)").matches) return true
  return navigator.maxTouchPoints > 1 && window.innerWidth < 1024
}

function readVkCode(payload?: Record<string, string>): string {
  return payload?.code?.trim() ?? ""
}

function readVkDeviceId(payload?: Record<string, string>): string {
  return payload?.device_id?.trim() ?? (payload as { deviceId?: string })?.deviceId?.trim() ?? ""
}

export function VKIDButton({
  enabled = true,
  redirectTo = "/profile",
  onSuccess,
  onError,
  onBusyChange,
  className = "",
}: VKIDButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const useServerRedirect = prefersVkServerRedirect()
  const [widgetFailed, setWidgetFailed] = useState(useServerRedirect)
  const [fallbackBusy, setFallbackBusy] = useState(false)

  useEffect(() => {
    onBusyChange?.(fallbackBusy)
  }, [fallbackBusy, onBusyChange])

  async function finishSession(redirectPath?: string) {
    window.dispatchEvent(new Event("nashlo-auth-change"))
    if (redirectPath && redirectPath.startsWith("/")) {
      window.location.assign(redirectPath)
      return
    }
    onSuccess?.()
  }

  async function exchangeViaSdk(
    VKID: NonNullable<typeof window.VKIDSDK>,
    code: string,
    deviceId: string,
  ) {
    const exchanged = await VKID.Auth.exchangeCode(code, deviceId)
    const res = await fetch("/api/auth/vk/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ...exchanged, next: redirectTo }),
    })
    const data = (await res.json().catch(() => ({}))) as {
      error?: string
      redirect?: string
    }
    if (!res.ok) {
      throw new Error(data.error || "vk_token_failed")
    }
    await finishSession(data.redirect)
  }

  async function exchangeViaServer(code: string, deviceId: string) {
    const res = await fetch("/api/auth/vk/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ code, device_id: deviceId, next: redirectTo }),
    })
    const data = (await res.json().catch(() => ({}))) as {
      error?: string
      redirect?: string
    }
    if (!res.ok) {
      throw new Error(data.error || "vk_exchange_failed")
    }
    await finishSession(data.redirect)
  }

  async function handleVkPayload(payload?: Record<string, string>) {
    const code = readVkCode(payload)
    const deviceId = readVkDeviceId(payload)
    if (!code || !deviceId) {
      throw new Error("vk_payload_incomplete")
    }

    const VKID = window.VKIDSDK
    if (VKID?.Auth?.exchangeCode) {
      try {
        await exchangeViaSdk(VKID, code, deviceId)
        return
      } catch {
        /* fallback: серверный обмен */
      }
    }
    await exchangeViaServer(code, deviceId)
  }

  useEffect(() => {
    if (!enabled || widgetFailed) return

    let cancelled = false
    setWidgetFailed(false)

    async function initOneTap() {
      try {
        const configRes = await fetch("/api/auth/vk/config", { cache: "no-store" })
        const config = (await configRes.json()) as VkConfig
        if (!config.enabled || !config.appId || !containerRef.current) {
          if (!cancelled) setWidgetFailed(true)
          return
        }

        await loadVkIdSdk()
        if (cancelled || !window.VKIDSDK || !containerRef.current) return

        const VKID = window.VKIDSDK
        containerRef.current.innerHTML = ""

        VKID.Config.init({
          app: config.appId,
          redirectUrl: config.redirectUrl || getVkIdRedirectUrl(),
          responseMode: VKID.ConfigResponseMode.Callback,
          source: VKID.ConfigSource.LOWCODE,
          scope: "",
        })

        const oneTap = new VKID.OneTap()
        oneTap
          .render({
            container: containerRef.current,
            showAlternativeLogin: true,
            styles: { width: "100%", height: 48 },
          })
          .on(VKID.WidgetEvents.ERROR, () => {
            if (!cancelled) setWidgetFailed(true)
          })
          .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, async (payload) => {
            if (cancelled) return
            onBusyChange?.(true)
            try {
              await handleVkPayload(payload)
            } catch {
              if (!cancelled) {
                setWidgetFailed(true)
                onError?.("Не удалось завершить вход через VK. Нажмите кнопку ниже.")
              }
            } finally {
              onBusyChange?.(false)
            }
          })
      } catch {
        if (!cancelled) setWidgetFailed(true)
      }
    }

    void initOneTap()

    return () => {
      cancelled = true
      if (containerRef.current) containerRef.current.innerHTML = ""
    }
  }, [enabled, widgetFailed, redirectTo, onSuccess, onError, onBusyChange])

  if (!enabled) return null

  if (widgetFailed) {
    return (
      <div className={className}>
        <button
          type="button"
          disabled={fallbackBusy}
          onClick={() => {
            setFallbackBusy(true)
            window.location.href = vkStartHref(redirectTo)
          }}
          className="flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl bg-[#0077FF] px-4 text-sm font-semibold text-white transition hover:bg-[#0066DD] disabled:opacity-70"
        >
          {fallbackBusy ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.523-2.049-1.713-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.204.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.049.17.49-.085.745-.576.745z" />
            </svg>
          )}
          Войти через VK ID
        </button>
      </div>
    )
  }

  return (
    <div className={className}>
      <div ref={containerRef} className="min-h-[48px] w-full [&_iframe]:max-w-full" />
    </div>
  )
}
