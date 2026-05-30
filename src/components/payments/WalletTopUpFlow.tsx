"use client"

import { useCallback, useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { ChevronLeft, X } from "lucide-react"
import { LEGAL_LINKS } from "@/lib/legal-meta"
import { recordLegalConsents } from "@/lib/legal-consent-client"
import { SbpLogo } from "@/components/payments/SbpLogo"
import { SbpQrPanel } from "@/components/payments/SbpQrPanel"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"

const PRESET_AMOUNTS = [300, 600, 900]
const MIN_AMOUNT = 100

type PayMethod = "sbp" | "card"

type WalletTopUpFlowProps = {
  balance: number
  onPaid?: () => void
}

function formatRub(n: number) {
  return n.toLocaleString("ru-RU") + " ₽"
}

function parseAmountInput(raw: string): number {
  const digits = raw.replace(/\D/g, "")
  return digits ? parseInt(digits, 10) : 0
}

export function WalletTopUpFlow({ balance, onPaid }: WalletTopUpFlowProps) {
  const hasQuickPay = Boolean(process.env.NEXT_PUBLIC_TBANK_TERMINAL_KEY)

  const [step, setStep] = useState<"amount" | "method" | "sbp">("amount")
  const [amountInput, setAmountInput] = useState("300")
  const [method, setMethod] = useState<PayMethod>("sbp")
  const [offerAccepted, setOfferAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
  const [qrSvg, setQrSvg] = useState<string | null>(null)
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)

  const amount = parseAmountInput(amountInput)

  useEffect(() => {
    if (!hasQuickPay && method === "sbp") setMethod("card")
  }, [hasQuickPay, method])

  const ensureValid = useCallback(() => {
    if (amount < MIN_AMOUNT) {
      setError(`Минимальная сумма пополнения — ${MIN_AMOUNT} ₽`)
      return false
    }
    if (!offerAccepted) {
      setError("Примите условия оферты для пополнения баланса.")
      return false
    }
    setError("")
    return true
  }, [amount, offerAccepted])

  function applyPreset(value: number) {
    setAmountInput(String(value))
    setError("")
  }

  function goToMethod() {
    if (!ensureValid()) return
    setStep("method")
  }

  async function createSbpPayment() {
    const res = await fetch("/api/payments/tbank/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceType: "wallet_topup",
        amountRubles: amount,
        connectionType: "Widget",
        withSbpQr: true,
      }),
    })
    const data = await res.json()
    if (!res.ok || !data.paymentUrl) {
      throw new Error(data.error || "Не удалось создать платёж")
    }
    return {
      paymentUrl: data.paymentUrl as string,
      qrSvg: (data.qrSvg as string) || null,
    }
  }

  async function createCardPayment() {
    const res = await fetch("/api/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    })
    const data = await res.json()
    if (!res.ok || !data.paymentUrl) {
      throw new Error(data.error || "Не удалось создать платёж")
    }
    return data.paymentUrl as string
  }

  async function handleProceedToPay() {
    if (!ensureValid()) return
    setLoading(true)
    setError("")
    try {
      await recordLegalConsents(["OFFER"], "wallet_top_up")

      if (method === "sbp" && hasQuickPay) {
        const sbp = await createSbpPayment()
        setPaymentUrl(sbp.paymentUrl)
        setQrSvg(sbp.qrSvg)
        setStep("sbp")
      } else {
        const url = await createCardPayment()
        window.location.href = url
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка при создании платежа")
    } finally {
      setLoading(false)
    }
  }

  const methodHint =
    method === "sbp"
      ? "Дальше будет QR для оплаты"
      : "Откроется защищённая форма банка"

  function leaveSbpScreen() {
    setLeaveDialogOpen(false)
    setPaymentUrl(null)
    setQrSvg(null)
    setStep("method")
  }

  if (step === "sbp" && paymentUrl) {
    return (
      <div className="space-y-5">
        <SbpLeaveDialog
          open={leaveDialogOpen}
          onOpenChange={setLeaveDialogOpen}
          onStay={() => setLeaveDialogOpen(false)}
          onLeave={leaveSbpScreen}
        />

        <button
          type="button"
          onClick={() => setLeaveDialogOpen(true)}
          className="inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-950"
        >
          <ChevronLeft className="h-4 w-4" />
          Назад
        </button>

        <div>
          <h2 className="text-2xl font-bold text-zinc-950">Пополнение кошелька</h2>
          <p className="mt-2 text-3xl font-bold text-zinc-950">{formatRub(amount)}</p>
        </div>

        <SbpQrPanel
          amountRubles={amount}
          qrSvg={qrSvg}
          paymentUrl={paymentUrl}
          onBeforePay={ensureValid}
        />

        <PaymentLegalNote />
        <button
          type="button"
          onClick={() => onPaid?.()}
          className="text-sm font-medium text-zinc-500 underline underline-offset-2 hover:text-zinc-800"
        >
          Уже оплатил — обновить баланс
        </button>
      </div>
    )
  }

  if (step === "method") {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => setStep("amount")}
          className="inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-950"
        >
          <ChevronLeft className="h-4 w-4" />
          Назад
        </button>

        <div>
          <h2 className="text-2xl font-bold text-zinc-950">Пополнение кошелька</h2>
          <p className="mt-2 text-3xl font-bold text-zinc-950">{formatRub(amount)}</p>
        </div>

        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 scrollbar-thin">
          {hasQuickPay && (
            <MethodCard
              selected={method === "sbp"}
              onClick={() => setMethod("sbp")}
              title="СБП"
              wide
              icon={<SbpLogo className="h-9 w-full max-w-[108px] object-contain object-center" />}
            />
          )}
          <MethodCard
            selected={method === "card"}
            onClick={() => setMethod("card")}
            title="Банковская карта"
            icon={
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 text-2xl">
                💳
              </span>
            }
          />
        </div>

        <p className="text-sm text-zinc-500">{methodHint}</p>

        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>}

        <button
          type="button"
          onClick={() => void handleProceedToPay()}
          disabled={loading}
          className="w-full rounded-2xl bg-zinc-950 px-6 py-4 text-base font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
        >
          {loading ? "Подготовка…" : "Перейти к оплате"}
        </button>

        <PaymentLegalNote />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-zinc-950 sm:text-2xl">Пополнение кошелька</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Текущий баланс: <span className="font-semibold text-zinc-800">{formatRub(balance)}</span>
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <div className="relative flex-1">
          <input
            type="text"
            inputMode="numeric"
            value={amountInput ? `${amountInput} ₽` : ""}
            onChange={(e) => {
              setAmountInput(String(parseAmountInput(e.target.value)))
              setError("")
            }}
            placeholder="0 ₽"
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-lg font-semibold text-zinc-950 outline-none transition focus:border-zinc-400 focus:bg-white"
          />
        </div>
        <button
          type="button"
          onClick={goToMethod}
          disabled={amount < MIN_AMOUNT}
          className="shrink-0 rounded-2xl bg-zinc-950 px-8 py-4 text-base font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50 sm:min-w-[160px]"
        >
          Подтвердить
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESET_AMOUNTS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => applyPreset(preset)}
            className={
              "rounded-full border px-4 py-2 text-sm font-medium transition " +
              (amount === preset
                ? "border-zinc-950 bg-zinc-100 text-zinc-950"
                : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300")
            }
          >
            {formatRub(preset)}
          </button>
        ))}
      </div>

      <label className="flex cursor-pointer gap-2.5 text-left text-xs leading-snug text-zinc-600">
        <input
          type="checkbox"
          checked={offerAccepted}
          onChange={(e) => {
            setOfferAccepted(e.target.checked)
            setError("")
          }}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300"
        />
        <span>
          Принимаю{" "}
          <Link href={LEGAL_LINKS.offer} className="font-medium text-zinc-950 underline underline-offset-2">
            оферту о платных услугах
          </Link>
          . Средства — для услуг на площадке (продвижение и т.п.).
        </span>
      </label>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>}

      <PaymentLegalNote />
    </div>
  )
}

function MethodCard({
  selected,
  onClick,
  title,
  icon,
  wide = false,
}: {
  selected: boolean
  onClick: () => void
  title: string
  icon: ReactNode
  wide?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex shrink-0 flex-col items-center gap-2 rounded-2xl border-2 bg-white p-3 transition " +
        (wide ? "w-[140px] " : "w-[120px] ") +
        (selected ? "border-zinc-950 shadow-sm" : "border-zinc-200 hover:border-zinc-300")
      }
    >
      <div className="flex min-h-[44px] w-full items-center justify-center">{icon}</div>
      <span className="text-center text-xs font-semibold leading-tight text-zinc-800">{title}</span>
    </button>
  )
}

function PaymentLegalNote() {
  return (
    <p className="text-[11px] leading-relaxed text-zinc-400">
      Платежи защищены шлюзом T-Bank. Данные карты не хранятся на сервере Нашло.{" "}
      <Link href={LEGAL_LINKS.privacyPolicy} className="underline underline-offset-2 hover:text-zinc-600">
        Политика конфиденциальности
      </Link>
      .
    </p>
  )
}

/** Подтверждение выхода с экрана СБП (пока QR ещё активен). */
function SbpLeaveDialog({
  open,
  onOpenChange,
  onStay,
  onLeave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onStay: () => void
  onLeave: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 rounded-2xl border-zinc-200 p-0 sm:rounded-2xl [&>button]:hidden">
        <div className="relative px-5 pb-5 pt-6">
          <button
            type="button"
            onClick={onStay}
            className="absolute right-4 top-4 rounded-lg p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
          <DialogTitle className="pr-8 text-xl font-bold text-zinc-950">Закрыть страницу?</DialogTitle>
          <DialogDescription className="mt-3 text-sm leading-relaxed text-zinc-600">
            Если вы уже отсканировали QR-код и подтвердили операцию в приложении банка, кошелёк скоро
            пополнится.
          </DialogDescription>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onStay}
              className="flex-1 rounded-2xl bg-zinc-950 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Остаться
            </button>
            <button
              type="button"
              onClick={onLeave}
              className="flex-1 rounded-2xl bg-zinc-100 px-4 py-3.5 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
            >
              Закрыть
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
