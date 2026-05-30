"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CabinetPage } from "@/components/profile/CabinetPage"
type PaymentRow = {
  id: string
  amount: number
  currency: string
  status: string
  provider: string
  createdAt: string
  paidAt: string | null
  adCampaign: { id: string; title: string; status: string }
}

export default function ProfileAdPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/profile/ads/payments")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setPayments(d?.payments ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <CabinetPage
        title="Платежи за рекламу"
        action={<Link href="/profile/ads" className="text-sm font-medium text-[hsl(var(--nashlo-orange))]">← Моя реклама</Link>}
      >
        {loading ? (
          <p className="text-sm text-zinc-500">Загрузка…</p>
        ) : payments.length === 0 ? (
          <p className="text-sm text-zinc-500">Платежей пока нет</p>
        ) : (
          <div className="space-y-2">
            {payments.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 px-4 py-3 text-sm">
                <div>
                  <Link href={`/profile/ads/${p.adCampaign.id}`} className="font-semibold text-zinc-950 hover:underline">
                    {p.adCampaign.title}
                  </Link>
                  <p className="text-xs text-zinc-500">{new Date(p.createdAt).toLocaleString("ru-RU")} · {p.provider} · {p.status}</p>
                </div>
                <p className="font-semibold">{p.amount.toLocaleString("ru-RU")} {p.currency}</p>
              </div>
            ))}
          </div>
        )}
    </CabinetPage>
  )
}
