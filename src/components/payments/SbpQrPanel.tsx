"use client"

import { useEffect, useState } from "react"
import { SbpLogo } from "@/components/payments/SbpLogo"
import { TbankQuickPay } from "@/components/payments/TbankQuickPay"

type SbpQrPanelProps = {
  amountRubles: number
  qrSvg: string | null
  paymentUrl: string | null
  onBeforePay?: () => boolean | Promise<boolean>
}

/** Блок с QR СБП (GetQr) или виджет T-Bank, если QR не получен */
export function SbpQrPanel({ amountRubles, qrSvg, paymentUrl, onBeforePay }: SbpQrPanelProps) {
  const [svg, setSvg] = useState(qrSvg)

  useEffect(() => {
    setSvg(qrSvg)
  }, [qrSvg])

  const hasWidget = Boolean(process.env.NEXT_PUBLIC_TBANK_TERMINAL_KEY)

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-zinc-100 p-4 sm:flex-row sm:items-center sm:p-5">
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2">
          <SbpLogo className="h-8 w-auto max-w-[140px] shrink-0 object-contain" />
          <p className="text-lg font-bold text-zinc-950">Подтвердите платёж по СБП</p>
        </div>
        <p className="text-sm leading-relaxed text-zinc-600">
          Отсканируйте QR-код камерой телефона или в приложении банка
        </p>
        {paymentUrl && (
          <a
            href={paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm font-medium text-zinc-950 underline underline-offset-2"
          >
            Открыть оплату в приложении банка
          </a>
        )}
      </div>

      <div className="mx-auto flex w-full max-w-[220px] shrink-0 flex-col items-center justify-center rounded-xl bg-white p-4 shadow-sm sm:mx-0">
        {svg ? (
          <div
            className="sbp-qr-svg flex h-[200px] w-[200px] items-center justify-center [&_svg]:h-full [&_svg]:w-full"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : hasWidget ? (
          <div className="w-full">
            <TbankQuickPay
              amountRubles={amountRubles}
              serviceType="wallet_topup"
              widgetTypes={["sbp"]}
              integrationName="nashlo-sbp-fallback"
              existingPaymentUrl={paymentUrl}
              onBeforePay={onBeforePay}
              onFallbackPay={() => {
                if (paymentUrl) window.open(paymentUrl, "_blank", "noopener,noreferrer")
              }}
              compact
              hideFallback={!paymentUrl}
            />
          </div>
        ) : (
          <p className="text-center text-sm text-zinc-500">
            QR временно недоступен. Попробуйте оплату картой или позже.
          </p>
        )}
      </div>
    </div>
  )
}
