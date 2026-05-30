"use client"

import { useEffect, useRef, useState } from "react"

declare global {
  interface Window {
    PaymentIntegration?: {
      init: (config: Record<string, unknown>) => Promise<PaymentIntegrationInstance>
      Helpers?: new () => unknown
    }
    __nashloTbankIntegration?: Promise<PaymentIntegrationInstance>
  }
}

type PaymentIntegrationInstance = {
  payments: {
    setPaymentStartCallback: (callback: () => Promise<string>) => Promise<void>
    create: (
      name: string,
      config: Record<string, unknown>,
    ) => Promise<{
      mount: (container: HTMLElement) => Promise<void>
      updateWidgetTypes: (types: string[]) => Promise<void>
    }>
  }
}

const SCRIPT_SRC = "https://integrationjs.t-static.ru/integration.js"
const INTEGRATION_NAME = "nashlo-quick-pay"

/** Виджеты из ЛК T-Bank: sbp, tpay, mirpay, sberpay, bnpl — @see setup_speedpay */
export const TBANK_WIDGET_TYPES = ["sbp", "tpay", "mirpay", "sberpay", "bnpl"] as const
export type TbankWidgetType = (typeof TBANK_WIDGET_TYPES)[number]

const DEFAULT_WIDGET_TYPES: TbankWidgetType[] = ["sbp", "tpay", "mirpay"]

type TbankQuickPayProps = {
  amountRubles: number
  serviceType: string
  listingId?: string | null
  /** Какие кнопки показать; для только СБП: `['sbp']` */
  widgetTypes?: TbankWidgetType[]
  integrationName?: string
  disabled?: boolean
  compact?: boolean
  hideFallback?: boolean
  /** Уже созданный PaymentURL (не вызывать Init повторно) */
  existingPaymentUrl?: string | null
  onBeforePay?: () => boolean | Promise<boolean>
  onFallbackPay: () => void
}

function loadIntegrationScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve()
  if (window.PaymentIntegration) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`)
    if (existing) {
      if (window.PaymentIntegration) {
        resolve()
        return
      }
      existing.addEventListener("load", () => resolve(), { once: true })
      existing.addEventListener("error", () => reject(new Error("script load failed")), { once: true })
      return
    }
    const script = document.createElement("script")
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("script load failed"))
    document.body.appendChild(script)
  })
}

async function getPaymentIntegration(terminalKey: string): Promise<PaymentIntegrationInstance> {
  if (!window.__nashloTbankIntegration) {
    window.__nashloTbankIntegration = (async () => {
      await loadIntegrationScript()
      if (!window.PaymentIntegration) {
        throw new Error("PaymentIntegration unavailable")
      }
      return window.PaymentIntegration.init({
        terminalKey,
        product: "eacq",
        features: { payment: {} },
      })
    })()
  }
  return window.__nashloTbankIntegration
}

export function TbankQuickPay({
  amountRubles,
  serviceType,
  listingId,
  widgetTypes = DEFAULT_WIDGET_TYPES,
  integrationName = INTEGRATION_NAME,
  disabled = false,
  compact = false,
  hideFallback = false,
  existingPaymentUrl = null,
  onBeforePay,
  onFallbackPay,
}: TbankQuickPayProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const payContextRef = useRef({ amountRubles, serviceType, listingId })
  const [ready, setReady] = useState(false)
  const [error, setError] = useState("")

  const terminalKey = process.env.NEXT_PUBLIC_TBANK_TERMINAL_KEY

  payContextRef.current = { amountRubles, serviceType, listingId }

  useEffect(() => {
    if (!terminalKey || disabled) {
      setReady(false)
      setError("")
      return
    }

    let cancelled = false

    async function mountWidget() {
      try {
        const integration = await getPaymentIntegration(terminalKey)
        if (cancelled || !containerRef.current) return

        await integration.payments.setPaymentStartCallback(async () => {
          if (onBeforePay) {
            const ok = await onBeforePay()
            if (!ok) throw new Error("Оплата недоступна")
          }

          if (existingPaymentUrl) return existingPaymentUrl

          const ctx = payContextRef.current
          if (ctx.amountRubles < 100) {
            throw new Error("Минимальная сумма — 100 ₽")
          }

          const res = await fetch("/api/payments/tbank/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              serviceType: ctx.serviceType,
              listingId: ctx.listingId,
              amountRubles: ctx.amountRubles,
              connectionType: "Widget",
            }),
          })
          const data = await res.json()
          if (!res.ok || !data.paymentUrl) {
            throw new Error(data.error || "Не удалось создать платёж")
          }
          return data.paymentUrl as string
        })

        containerRef.current.innerHTML = ""
        const widget = await integration.payments.create(integrationName, {})
        await widget.mount(containerRef.current)
        await widget.updateWidgetTypes([...widgetTypes])

        if (!cancelled) {
          setReady(true)
          setError("")
        }
      } catch {
        if (!cancelled) {
          setReady(false)
          setError("Быстрая оплата временно недоступна. Используйте оплату картой ниже.")
        }
      }
    }

    mountWidget()
    return () => {
      cancelled = true
    }
  }, [terminalKey, disabled, onBeforePay, widgetTypes, integrationName, existingPaymentUrl])

  if (!terminalKey) return null

  return (
    <div className={compact ? "" : "mt-4"}>
      {!compact && <p className="text-xs font-semibold text-zinc-500 mb-2">Быстрая оплата</p>}
      <div
        ref={containerRef}
        className={
          disabled
            ? "pointer-events-none min-h-[60px] w-full opacity-50"
            : "min-h-[60px] w-full [&_button]:min-h-[48px] [&_button]:w-full"
        }
        aria-hidden={disabled}
      />
      {!disabled && !ready && !error && (
        <p className="mt-2 text-center text-sm text-zinc-400">Загружаем кнопку СБП…</p>
      )}
      {error && (
        <p className="mt-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">{error}</p>
      )}
      {disabled && !compact && (
        <p className="mt-2 text-sm text-zinc-500">Примите оферту выше, чтобы активировать быструю оплату.</p>
      )}
      {!hideFallback && (
        <button
          type="button"
          onClick={onFallbackPay}
          disabled={disabled}
          className="mt-3 w-full rounded-xl border border-zinc-200 bg-white px-5 py-3.5 text-sm font-semibold text-zinc-800 transition hover:border-zinc-300 disabled:opacity-50"
        >
          Оплатить банковской картой
        </button>
      )}
    </div>
  )
}
