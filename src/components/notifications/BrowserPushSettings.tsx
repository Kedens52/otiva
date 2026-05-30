"use client"

import { useCallback, useEffect, useState } from "react"

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

export function BrowserPushSettings() {
  const [supported, setSupported] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [serverConfigured, setServerConfigured] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState<string | null>(null)

  const refreshSubscription = useCallback(async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return
    try {
      const regs = await navigator.serviceWorker.getRegistrations()
      const reg = regs.find((r) => r.active?.scriptURL?.includes("sw-push.js"))
      const sub = reg ? await reg.pushManager.getSubscription() : null
      setEnabled(Boolean(sub))
    } catch {
      setEnabled(false)
    }
  }, [])

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      (window.isSecureContext || window.location.hostname === "localhost")
    setSupported(ok)
    if (!ok) return
    void refreshSubscription()
    fetch("/api/push/vapid-public-key")
      .then((r) => r.json())
      .then((d) => setServerConfigured(Boolean(d.configured && d.publicKey)))
      .catch(() => setServerConfigured(false))
  }, [refreshSubscription])

  async function enable() {
    setHint(null)
    setBusy(true)
    try {
      const cfg = await fetch("/api/push/vapid-public-key").then((r) => r.json())
      if (!cfg.publicKey) {
        setHint("На сервере не заданы VAPID-ключи (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY).")
        return
      }

      const reg = await navigator.serviceWorker.register("/sw-push.js", { scope: "/" })
      await reg.update()
      await navigator.serviceWorker.ready

      const perm = await Notification.requestPermission()
      if (perm !== "granted") {
        setHint("Разрешите уведомления в настройках браузера.")
        return
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(cfg.publicKey),
      })
      const j = sub.toJSON()
      if (!j.endpoint || !j.keys?.p256dh || !j.keys?.auth) {
        setHint("Не удалось получить подписку.")
        return
      }

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: j.endpoint,
          keys: { p256dh: j.keys.p256dh, auth: j.keys.auth },
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setHint(typeof err.error === "string" ? err.error : "Ошибка сохранения подписки.")
        return
      }
      setEnabled(true)
    } catch (e) {
      console.error(e)
      setHint("Не удалось включить уведомления.")
    } finally {
      setBusy(false)
    }
  }

  async function disable() {
    setHint(null)
    setBusy(true)
    try {
      const regs = await navigator.serviceWorker.getRegistrations()
      const reg = regs.find((r) => r.active?.scriptURL?.includes("sw-push.js"))
      const sub = reg ? await reg.pushManager.getSubscription() : null
      if (sub) {
        const endpoint = sub.endpoint
        await sub.unsubscribe()
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        }).catch(() => {})
      }
      setEnabled(false)
    } catch (e) {
      console.error(e)
      setHint("Не удалось отключить.")
    } finally {
      setBusy(false)
    }
  }

  if (!supported) return null

  return (
    <div className="mb-4 rounded-[24px] border border-[hsl(var(--nashlo-orange)/0.16)] bg-[hsl(var(--nashlo-orange)/0.06)] p-4">
      <p className="text-sm font-semibold text-gray-900">Браузерные уведомления</p>
      <p className="mt-1 text-xs leading-snug text-gray-600">
        Пуши приходят, даже когда вкладка закрыта (если разрешено в браузере). Нужен HTTPS на сайте.
      </p>
      {serverConfigured === false && (
        <p className="mt-2 text-xs text-amber-800">Сервер пока без VAPID — администратору нужно сгенерировать ключи и прописать в .env.</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {!enabled ? (
          <button
            type="button"
            disabled={busy || serverConfigured === false}
            onClick={() => void enable()}
            className="rounded-2xl bg-[hsl(var(--nashlo-orange))] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[hsl(var(--nashlo-orange)/0.92)] disabled:opacity-50"
          >
            {busy ? "…" : "Включить в этом браузере"}
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => void disable()}
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            {busy ? "…" : "Отключить в этом браузере"}
          </button>
        )}
      </div>
      {hint && <p className="mt-2 text-xs text-red-600">{hint}</p>}
    </div>
  )
}
