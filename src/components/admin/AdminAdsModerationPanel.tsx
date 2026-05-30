"use client"

import { useEffect, useState } from "react"
import { AdCampaignPreview } from "@/components/ads/cabinet/AdCampaignPreview"
import { AdCampaignStatusBadge } from "@/components/ads/cabinet/AdCampaignStatusBadge"
import { AdMediaPreview } from "@/components/ads/AdMediaPreview"
import { getCampaignPlacementGuide } from "@/lib/ads/admin-options"
import { AD_MEDIA_REJECT_REASONS, resolveCampaignMedia } from "@/lib/ads/media"
import type { AdCampaign, AdCampaignChangeLog, AdPayment } from "@prisma/client"

type Row = AdCampaign & {
  ctr: number
  budgetRemaining: number | null
  owner: { id: string; name: string | null; phone: string | null; email: string | null } | null
  changeLogs: AdCampaignChangeLog[]
  lastPayment: AdPayment | null
}

export function AdminAdsModerationPanel() {
  const [campaigns, setCampaigns] = useState<Row[]>([])
  const [note, setNote] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const res = await fetch("/api/admin/ads/moderation")
    if (res.ok) {
      const d = await res.json()
      setCampaigns(d.campaigns ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function moderate(id: string, action: string) {
    const res = await fetch(`/api/admin/ads/moderation/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, note: note[id] }),
    })
    const data = await res.json()
    if (!res.ok) {
      alert(data.error ?? "Ошибка")
      return
    }
    await load()
  }

  return (
    <section id="moderation" className="scroll-mt-24">
      <div className="mb-4">
        <p className="text-sm font-semibold text-[hsl(var(--nashlo-blue))]">Раздел 4</p>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">Модерация очереди</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Кампании рекламодателей после оплаты — карточки в ленте объявлений. Баннеры слотов модерируются в разделе 2.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Загрузка…</p>
      ) : campaigns.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-10 text-center text-sm text-zinc-500">
          Очередь пуста — нет кампаний на проверке
        </div>
      ) : (
        <div className="space-y-6">
          {campaigns.map((c) => (
            <article key={c.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{c.title}</h3>
                  <AdCampaignStatusBadge status={c.status} />
                  <p className="mt-2 text-sm text-zinc-600">
                    {c.owner?.name ?? "Без имени"} · {c.owner?.phone ?? c.owner?.email ?? "—"}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Бюджет {c.budget?.toLocaleString("ru-RU")} ₽ ·{" "}
                    {c.placements
                      .map((p) => getCampaignPlacementGuide(p)?.label ?? p)
                      .join(" · ")}
                  </p>
                </div>
                <AdCampaignPreview campaign={c} />
              </div>
              {(() => {
                const m = resolveCampaignMedia(c)
                return m.hasMedia ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <AdMediaPreview
                      mediaType={m.mediaType}
                      mediaUrl={m.mediaUrl}
                      mediaPosterUrl={m.mediaPosterUrl}
                      mediaAlt={m.mediaAlt}
                      aspectClass="aspect-video"
                    />
                    <dl className="space-y-1 text-xs text-zinc-600">
                      <div>
                        <dt className="font-medium text-zinc-800">Тип медиа</dt>
                        <dd>{m.mediaType}</dd>
                      </div>
                      {m.mediaMimeType ? (
                        <div>
                          <dt className="font-medium text-zinc-800">MIME</dt>
                          <dd>{m.mediaMimeType}</dd>
                        </div>
                      ) : null}
                      {m.mediaSize ? (
                        <div>
                          <dt className="font-medium text-zinc-800">Размер</dt>
                          <dd>{(m.mediaSize / 1024).toFixed(0)} KB</dd>
                        </div>
                      ) : null}
                      {m.mediaWidth && m.mediaHeight ? (
                        <div>
                          <dt className="font-medium text-zinc-800">Разрешение</dt>
                          <dd>
                            {m.mediaWidth}×{m.mediaHeight}
                            {m.mediaDuration ? ` · ${m.mediaDuration} сек` : ""}
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-zinc-500">Медиа не загружено (текстовая реклама)</p>
                )
              })()}
              <p className="mt-3 text-sm text-zinc-700">{c.description}</p>
              <p className="text-xs text-zinc-500">Ссылка: {c.targetUrl}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {AD_MEDIA_REJECT_REASONS.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setNote((n) => ({ ...n, [c.id]: reason }))}
                    className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-700 hover:bg-white"
                  >
                    {reason}
                  </button>
                ))}
              </div>
              <textarea
                value={note[c.id] ?? ""}
                onChange={(e) => setNote((n) => ({ ...n, [c.id]: e.target.value }))}
                placeholder="Комментарий для отклонения / доработки"
                className="mt-3 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                rows={2}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => moderate(c.id, "approve")}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Одобрить
                </button>
                <button
                  type="button"
                  onClick={() => moderate(c.id, "needs_changes")}
                  className="rounded-lg bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800"
                >
                  На доработку
                </button>
                <button
                  type="button"
                  onClick={() => moderate(c.id, "reject")}
                  className="rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-700"
                >
                  Отклонить
                </button>
                <button
                  type="button"
                  onClick={() => moderate(c.id, "block")}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold"
                >
                  Заблокировать
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
