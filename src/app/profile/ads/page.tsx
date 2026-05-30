"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CabinetPage } from "@/components/profile/CabinetPage"
import { AdCampaignStatusBadge } from "@/components/ads/cabinet/AdCampaignStatusBadge"
import { AD_STATUS_HINTS } from "@/lib/ads/campaign-status"
import { AD_PLACEMENT_OPTIONS } from "@/lib/ads/admin-options"
import type { AdCampaign } from "@prisma/client"

type CampaignRow = AdCampaign & { ctr: number; budgetRemaining: number | null }

function placementLabel(p: string) {
  return AD_PLACEMENT_OPTIONS.find((o) => o.value === p)?.label ?? p
}

export default function ProfileAdsPage() {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/profile/ads")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setCampaigns(d?.campaigns ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <CabinetPage
        title="Моя реклама"
        subtitle="Рекламные размещения на Нашло — отдельно от обычных объявлений"
        action={
          <Link
            href="/profile/ads/create"
            className="rounded-xl bg-[hsl(var(--nashlo-orange))] px-4 py-2.5 text-sm font-semibold text-white"
          >
            Создать рекламу
          </Link>
        }
      >
        {loading ? (
          <p className="text-sm text-zinc-500">Загрузка…</p>
        ) : campaigns.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center">
            <p className="text-sm text-zinc-600">У вас пока нет рекламных кампаний</p>
            <Link href="/profile/ads/create" className="mt-4 inline-block text-sm font-semibold text-[hsl(var(--nashlo-orange))]">
              Запустить первую кампанию
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((c) => (
              <article key={c.id} className="rounded-2xl border border-zinc-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/profile/ads/${c.id}`} className="text-base font-semibold text-zinc-950 hover:underline">
                      {c.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <AdCampaignStatusBadge status={c.status} />
                      <span className="text-xs text-zinc-500">{c.type}</span>
                    </div>
                    {AD_STATUS_HINTS[c.status] ? (
                      <p className="mt-2 text-xs text-zinc-500">{AD_STATUS_HINTS[c.status]}</p>
                    ) : null}
                    {c.moderationNote && ["REJECTED", "NEEDS_CHANGES"].includes(c.status) ? (
                      <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800">{c.moderationNote}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/profile/ads/${c.id}`} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold">
                      Управление
                    </Link>
                    <Link href={`/profile/ads/${c.id}/stats`} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold">
                      Статистика
                    </Link>
                    {c.status === "WAITING_PAYMENT" ? (
                      <Link href={`/profile/ads/${c.id}`} className="rounded-lg bg-[hsl(var(--nashlo-orange))] px-3 py-1.5 text-xs font-semibold text-white">
                        Оплатить
                      </Link>
                    ) : null}
                    {c.budgetRemaining === 0 && c.status === "ACTIVE" ? (
                      <Link href={`/profile/ads/${c.id}/edit`} className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
                        Пополнить
                      </Link>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-600 sm:grid-cols-3 lg:grid-cols-6">
                  <div><span className="text-zinc-400">Бюджет</span><p className="font-medium">{c.budget?.toLocaleString("ru-RU") ?? "—"} ₽</p></div>
                  <div><span className="text-zinc-400">Остаток</span><p className="font-medium">{c.budgetRemaining?.toLocaleString("ru-RU") ?? "—"} ₽</p></div>
                  <div><span className="text-zinc-400">Показы</span><p className="font-medium">{c.impressions}</p></div>
                  <div><span className="text-zinc-400">Клики</span><p className="font-medium">{c.clicks}</p></div>
                  <div><span className="text-zinc-400">CTR</span><p className="font-medium">{c.ctr}%</p></div>
                  <div className="col-span-2 sm:col-span-1"><span className="text-zinc-400">Период</span><p className="font-medium break-words">{c.startDate ? String(c.startDate).slice(0, 10) : "—"} — {c.endDate ? String(c.endDate).slice(0, 10) : "—"}</p></div>
                </div>
                <p className="mt-2 text-xs text-zinc-400">
                  {c.placements.slice(0, 3).map(placementLabel).join(" · ")}
                  {c.placements.length > 3 ? ` +${c.placements.length - 3}` : ""}
                </p>
              </article>
            ))}
          </div>
        )}
        <p className="mt-4 text-xs text-zinc-400">
          <Link href="/profile/ads/payments" className="font-medium text-[hsl(var(--nashlo-orange))] hover:underline">
            История платежей
          </Link>
        </p>
    </CabinetPage>
  )
}
