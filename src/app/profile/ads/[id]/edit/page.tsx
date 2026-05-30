"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import type { AdCampaign } from "@prisma/client"
import { CabinetPage } from "@/components/profile/CabinetPage"
import { AdCampaignPreview } from "@/components/ads/cabinet/AdCampaignPreview"
import { AdMediaUpload, type AdMediaDraft } from "@/components/ads/cabinet/AdMediaUpload"
import { resolveCampaignMedia } from "@/lib/ads/media"

function mediaFromCampaign(c: AdCampaign): AdMediaDraft {
  const m = resolveCampaignMedia(c)
  return {
    mediaType: m.mediaType,
    mediaUrl: m.mediaUrl,
    mediaPosterUrl: m.mediaPosterUrl,
    mediaAlt: m.mediaAlt,
    mediaWidth: m.mediaWidth,
    mediaHeight: m.mediaHeight,
    mediaDuration: m.mediaDuration,
    mediaSize: m.mediaSize,
    mediaMimeType: m.mediaMimeType,
  }
}

export default function ProfileAdEditPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [campaign, setCampaign] = useState<AdCampaign | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [media, setMedia] = useState<AdMediaDraft | null>(null)
  const [targetUrl, setTargetUrl] = useState("")
  const [ctaText, setCtaText] = useState("")
  const [budget, setBudget] = useState("")
  const [endDate, setEndDate] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`/api/profile/ads/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const c = d?.campaign as AdCampaign | undefined
        if (!c) return
        setCampaign(c)
        setTitle(c.title)
        setDescription(c.description ?? "")
        setMedia(mediaFromCampaign(c))
        setTargetUrl(c.targetUrl)
        setCtaText(c.ctaText ?? "")
        setBudget(c.budget != null ? String(c.budget) : "")
        setEndDate(c.endDate ? String(c.endDate).slice(0, 10) : "")
      })
  }, [id])

  async function save() {
    if (!media) return
    setSaving(true)
    setError("")
    try {
      const res = await fetch(`/api/profile/ads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          ...media,
          mediaAlt: media.mediaAlt ?? title,
          targetUrl,
          ctaText,
          budget: budget ? Number(budget) : undefined,
          endDate: endDate || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push(`/profile/ads/${id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка")
    } finally {
      setSaving(false)
    }
  }

  const preview = campaign && media
    ? {
        ...campaign,
        title,
        description,
        targetUrl,
        ctaText,
        ...media,
        mediaAlt: media.mediaAlt ?? title,
      }
    : null

  return (
    <CabinetPage
        title="Редактирование"
        subtitle="Изменение креатива или таргетинга может отправить кампанию на повторную модерацию"
        action={
          <Link href={`/profile/ads/${id}`} className="text-sm font-medium text-[hsl(var(--nashlo-orange))]">
            ← Назад
          </Link>
        }
      >
        {campaign && media ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm"
                placeholder="Заголовок"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                placeholder="Описание"
              />
              <AdMediaUpload
                value={media}
                onChange={setMedia}
                adType={campaign.type}
                placementCodes={campaign.placements}
                placementBanner={campaign.type === "BANNER"}
              />
              <input
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm"
                placeholder="Ссылка"
              />
              <input
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm"
                placeholder="Кнопка"
              />
              <input
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                type="number"
                className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm"
                placeholder="Бюджет"
              />
              <input
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                type="date"
                className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm"
              />
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <button
                type="button"
                disabled={saving}
                onClick={save}
                className="rounded-xl bg-[hsl(var(--nashlo-orange))] px-5 py-2.5 text-sm font-semibold text-white"
              >
                {saving ? "Сохранение…" : "Сохранить"}
              </button>
            </div>
            {preview ? <AdCampaignPreview campaign={preview} /> : null}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Загрузка…</p>
        )}
    </CabinetPage>
  )
}
