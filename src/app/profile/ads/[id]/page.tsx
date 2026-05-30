"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { CabinetPage } from "@/components/profile/CabinetPage"
import { AdCampaignPreview } from "@/components/ads/cabinet/AdCampaignPreview"
import { AdCampaignStatusBadge } from "@/components/ads/cabinet/AdCampaignStatusBadge"
import { AD_STATUS_HINTS } from "@/lib/ads/campaign-status"
import type { AdCampaign, AdCampaignChangeLog, AdPayment } from "@prisma/client"

type Payload = {
  campaign: AdCampaign & { ctr: number; budgetRemaining: number | null }
  payments: AdPayment[]
  changeLogs: AdCampaignChangeLog[]
}

export default function ProfileAdDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<Payload | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  async function load() {
    const res = await fetch(`/api/profile/ads/${id}`)
    if (res.status === 404) {
      router.replace("/profile/ads")
      return
    }
    if (res.ok) setData(await res.json())
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [id])

  async function action(name: string) {
    setBusy(true)
    try {
      const res = await fetch(`/api/profile/ads/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: name }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error)
      if (name === "duplicate" && body.campaign?.id) {
        router.push(`/profile/ads/${body.campaign.id}/edit`)
        return
      }
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Ошибка")
    } finally {
      setBusy(false)
    }
  }

  async function pay() {
    setBusy(true)
    try {
      const res = await fetch(`/api/profile/ads/${id}/pay`, { method: "POST" })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error)
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Ошибка оплаты")
    } finally {
      setBusy(false)
    }
  }

  const c = data?.campaign

  return (
    <CabinetPage
        title={c?.title ?? "Кампания"}
        subtitle="Управление рекламным размещением"
        action={
          <Link href="/profile/ads" className="text-sm font-medium text-[hsl(var(--nashlo-orange))]">
            ← Все кампании
          </Link>
        }
      >
        {loading || !c ? (
          <p className="text-sm text-zinc-500">Загрузка…</p>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <AdCampaignStatusBadge status={c.status} />
              {AD_STATUS_HINTS[c.status] ? <p className="text-sm text-zinc-600">{AD_STATUS_HINTS[c.status]}</p> : null}
            </div>
            {c.moderationNote ? (
              <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{c.moderationNote}</p>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-semibold text-zinc-800">Превью</p>
                <AdCampaignPreview campaign={c} />
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="text-zinc-500">Показы:</span> {c.impressions}</p>
                <p><span className="text-zinc-500">Клики:</span> {c.clicks}</p>
                <p><span className="text-zinc-500">CTR:</span> {c.ctr}%</p>
                <p><span className="text-zinc-500">Бюджет:</span> {c.budget?.toLocaleString("ru-RU") ?? "—"} ₽</p>
                <p><span className="text-zinc-500">Расход:</span> {c.spent.toLocaleString("ru-RU")} ₽</p>
                <p><span className="text-zinc-500">Остаток:</span> {c.budgetRemaining?.toLocaleString("ru-RU") ?? "—"} ₽</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href={`/profile/ads/${id}/edit`} className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold">
                Редактировать
              </Link>
              <Link href={`/profile/ads/${id}/stats`} className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold">
                Статистика
              </Link>
              {c.status === "WAITING_PAYMENT" || c.status === "DRAFT" ? (
                <button type="button" disabled={busy} onClick={pay} className="rounded-xl bg-[hsl(var(--nashlo-orange))] px-4 py-2 text-sm font-semibold text-white">
                  Оплатить
                </button>
              ) : null}
              {c.status === "ACTIVE" ? (
                <button type="button" disabled={busy} onClick={() => action("pause")} className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold">
                  Приостановить
                </button>
              ) : null}
              {c.status === "PAUSED" ? (
                <button type="button" disabled={busy} onClick={() => action("resume")} className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold">
                  Возобновить
                </button>
              ) : null}
              <button type="button" disabled={busy} onClick={() => action("finish")} className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold">
                Завершить
              </button>
              <button type="button" disabled={busy} onClick={() => action("duplicate")} className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold">
                Дублировать
              </button>
            </div>

            {data.changeLogs.length ? (
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">История изменений</h3>
                <ul className="mt-2 space-y-2 text-xs text-zinc-600">
                  {data.changeLogs.map((log) => (
                    <li key={log.id} className="rounded-lg bg-zinc-50 px-3 py-2">
                      {log.action} · {new Date(log.createdAt).toLocaleString("ru-RU")}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
    </CabinetPage>
  )
}
