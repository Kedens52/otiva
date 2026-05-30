"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { AdDevice, AdPricingModel } from "@prisma/client"
import { AD_FORMAT_OPTIONS } from "@/lib/ads/ad-formats"
import { AD_CATEGORY_OPTIONS, AD_CITY_OPTIONS } from "@/lib/ads/admin-options"
import { AdCampaignPreview } from "@/components/ads/cabinet/AdCampaignPreview"
import { AdMediaUpload, type AdMediaDraft } from "@/components/ads/cabinet/AdMediaUpload"
import { AdPlacementRequirements } from "@/components/ads/cabinet/AdPlacementRequirements"
import { LegalConsentNotice } from "@/components/legal/LegalConsentNotice"
import { usePublicPlacementConfigs } from "@/hooks/usePublicPlacementConfigs"
import { resolveCreativeRequirements } from "@/lib/ads/placement-requirements"
import type { AdMediaType } from "@prisma/client"

const STEPS = ["Формат", "Креатив", "Аудитория", "Бюджет", "Оплата", "Модерация"]

type Draft = {
  formatId: string
  title: string
  description: string
  media: AdMediaDraft
  targetUrl: string
  ctaText: string
  companyName: string
  phone: string
  city: string
  categoryIds: string[]
  cityIds: string[]
  districtIds: string
  regionIds: string
  device: AdDevice
  keywords: string
  startDate: string
  endDate: string
  pricingModel: AdPricingModel
  budget: string
  dailyBudget: string
}

const initialDraft: Draft = {
  formatId: "native_feed",
  title: "",
  description: "",
  media: {
    mediaType: "NONE" as AdMediaType,
    mediaUrl: null,
    mediaPosterUrl: null,
    mediaAlt: null,
    mediaWidth: null,
    mediaHeight: null,
    mediaDuration: null,
    mediaSize: null,
    mediaMimeType: null,
  },
  targetUrl: "/advertising",
  ctaText: "Подробнее",
  companyName: "",
  phone: "",
  city: "",
  categoryIds: [],
  cityIds: [],
  districtIds: "",
  regionIds: "",
  device: "ALL",
  keywords: "",
  startDate: "",
  endDate: "",
  pricingModel: "FIXED",
  budget: "5000",
  dailyBudget: "",
}

export function AdCreateWizard() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<Draft>(initialDraft)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [campaignId, setCampaignId] = useState<string | null>(null)

  const format = AD_FORMAT_OPTIONS.find((f) => f.id === draft.formatId)
  const { placements: placementCatalog } = usePublicPlacementConfigs()
  const formatRequirements = useMemo(
    () =>
      format
        ? resolveCreativeRequirements(placementCatalog, format.placements, format.type)
        : null,
    [format, placementCatalog],
  )

  const previewCampaign = useMemo(
    () => ({
      id: "preview",
      title: draft.title || "Заголовок рекламы",
      description: draft.description || null,
      imageUrl:
        draft.media.mediaType === "IMAGE" || draft.media.mediaType === "GIF"
          ? draft.media.mediaUrl
          : null,
      mediaType: draft.media.mediaType,
      mediaUrl: draft.media.mediaUrl,
      mediaPosterUrl: draft.media.mediaPosterUrl,
      mediaAlt: draft.media.mediaAlt ?? draft.title,
      mediaWidth: draft.media.mediaWidth,
      mediaHeight: draft.media.mediaHeight,
      mediaDuration: draft.media.mediaDuration,
      targetUrl: draft.targetUrl,
      ctaText: draft.ctaText || null,
      label: null,
      city: draft.city || null,
      type: format?.type ?? "NATIVE_CARD",
    }),
    [draft, format],
  )

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
    setError("")
  }

  function toggleCategory(id: string) {
    setDraft((d) => ({
      ...d,
      categoryIds: d.categoryIds.includes(id)
        ? d.categoryIds.filter((x) => x !== id)
        : [...d.categoryIds, id],
    }))
  }

  function toggleCity(id: string) {
    setDraft((d) => ({
      ...d,
      cityIds: d.cityIds.includes(id) ? d.cityIds.filter((x) => x !== id) : [...d.cityIds, id],
    }))
  }

  async function createCampaign(submitForPayment: boolean) {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/profile/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formatId: draft.formatId,
          title: draft.title,
          description: draft.description,
          ...draft.media,
          mediaAlt: draft.media.mediaAlt ?? draft.title,
          targetUrl: draft.targetUrl,
          ctaText: draft.ctaText,
          companyName: draft.companyName || undefined,
          phone: draft.phone || undefined,
          city: draft.city || undefined,
          categoryIds: draft.categoryIds,
          cityIds: draft.cityIds,
          regionIds: draft.regionIds.split(",").map((s) => s.trim()).filter(Boolean),
          districtIds: draft.districtIds.split(",").map((s) => s.trim()).filter(Boolean),
          device: draft.device,
          keywords: draft.keywords.split(",").map((s) => s.trim()).filter(Boolean),
          startDate: draft.startDate || undefined,
          endDate: draft.endDate || undefined,
          pricingModel: draft.pricingModel,
          budget: Number(draft.budget),
          dailyBudget: draft.dailyBudget ? Number(draft.dailyBudget) : undefined,
          submitForPayment,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Ошибка создания")
      setCampaignId(data.campaign.id)
      return data.campaign.id as string
    } finally {
      setLoading(false)
    }
  }

  async function payCampaign(id: string) {
    const res = await fetch(`/api/profile/ads/${id}/pay`, { method: "POST" })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? "Ошибка оплаты")
  }

  async function handleNext() {
    if (step === 0 && !draft.formatId) {
      setError("Выберите формат")
      return
    }
    if (step === 1 && (!draft.title.trim() || !draft.targetUrl.trim())) {
      setError("Заполните заголовок и ссылку")
      return
    }
    if (step === 3 && (!draft.budget || Number(draft.budget) <= 0)) {
      setError("Укажите бюджет")
      return
    }
    if (step < 4) {
      setStep((s) => s + 1)
      return
    }
    if (step === 4) {
      try {
        const id = campaignId ?? (await createCampaign(true))
        await payCampaign(id)
        setStep(5)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка")
      }
      return
    }
    router.push(`/profile/ads/${campaignId}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {STEPS.map((label, i) => (
          <span
            key={label}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              i === step ? "bg-[hsl(var(--nashlo-orange))] text-white" : i < step ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"
            }`}
          >
            {i + 1}. {label}
          </span>
        ))}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {step === 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {AD_FORMAT_OPTIONS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => update("formatId", f.id)}
              className={`rounded-2xl border p-4 text-left transition ${
                draft.formatId === f.id
                  ? "border-[hsl(var(--nashlo-orange))] bg-[hsl(var(--nashlo-orange)/0.06)]"
                  : "border-zinc-200 hover:border-zinc-300"
              }`}
            >
              <p className="font-semibold text-zinc-950">{f.label}</p>
              <p className="mt-1 text-sm text-zinc-500">{f.description}</p>
            </button>
          ))}
        </div>
      ) : null}

      {step === 0 && format && formatRequirements ? (
        <AdPlacementRequirements requirements={formatRequirements} adType={format.type} />
      ) : null}

      {step === 1 ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <input value={draft.title} onChange={(e) => update("title", e.target.value)} placeholder="Заголовок" className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm" />
            <textarea value={draft.description} onChange={(e) => update("description", e.target.value)} placeholder="Описание" rows={3} className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm" />
            <AdMediaUpload
              value={draft.media}
              onChange={(media) => setDraft((d) => ({ ...d, media }))}
              adType={format?.type}
              placementCodes={format?.placements}
              placementBanner={format?.type === "BANNER"}
            />
            <input value={draft.targetUrl} onChange={(e) => update("targetUrl", e.target.value)} placeholder="Ссылка" className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm" />
            <input value={draft.ctaText} onChange={(e) => update("ctaText", e.target.value)} placeholder="Текст кнопки" className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm" />
            <input value={draft.companyName} onChange={(e) => update("companyName", e.target.value)} placeholder="Компания" className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm" />
            <input value={draft.phone} onChange={(e) => update("phone", e.target.value)} placeholder="Телефон" className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm" />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-700">Превью</p>
            <AdCampaignPreview campaign={previewCampaign} />
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <select value={draft.device} onChange={(e) => update("device", e.target.value as AdDevice)} className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm">
            <option value="ALL">Все устройства</option>
            <option value="MOBILE">Мобильные</option>
            <option value="DESKTOP">Десктоп</option>
            <option value="TABLET">Планшеты</option>
          </select>
          <input value={draft.keywords} onChange={(e) => update("keywords", e.target.value)} placeholder="Ключевые слова (через запятую)" className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm" />
          <input value={draft.regionIds} onChange={(e) => update("regionIds", e.target.value)} placeholder="Регионы (через запятую)" className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm" />
          <input value={draft.districtIds} onChange={(e) => update("districtIds", e.target.value)} placeholder="Районы (через запятую)" className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm" />
          <div className="grid max-h-40 gap-2 overflow-y-auto sm:grid-cols-2">
            {AD_CATEGORY_OPTIONS.map((c) => (
              <label key={c.value} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={draft.categoryIds.includes(c.value)} onChange={() => toggleCategory(c.value)} />
                {c.label}
              </label>
            ))}
          </div>
          <div className="grid max-h-40 gap-2 overflow-y-auto sm:grid-cols-2">
            {AD_CITY_OPTIONS.slice(0, 24).map((c) => (
              <label key={c.value} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={draft.cityIds.includes(c.value)} onChange={() => toggleCity(c.value)} />
                {c.label}
              </label>
            ))}
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-3">
          <select value={draft.pricingModel} onChange={(e) => update("pricingModel", e.target.value as AdPricingModel)} className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm">
            <option value="FIXED">Фиксированная цена (MVP)</option>
            <option value="CPM" disabled>CPM — скоро</option>
            <option value="CPC" disabled>CPC — скоро</option>
          </select>
          <input value={draft.budget} onChange={(e) => update("budget", e.target.value)} type="number" placeholder="Общий бюджет, ₽" className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm" />
          <input value={draft.dailyBudget} onChange={(e) => update("dailyBudget", e.target.value)} type="number" placeholder="Дневной бюджет, ₽ (опционально)" className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm" />
          <input value={draft.startDate} onChange={(e) => update("startDate", e.target.value)} type="date" className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm" />
          <input value={draft.endDate} onChange={(e) => update("endDate", e.target.value)} type="date" className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm" />
        </div>
      ) : null}

      {step === 4 ? (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-700">
          <p className="font-semibold text-zinc-950">Оплата (демо)</p>
          <p className="mt-2">Сумма к оплате: <strong>{Number(draft.budget).toLocaleString("ru-RU")} ₽</strong></p>
          <p className="mt-2 text-zinc-500">После оплаты кампания автоматически отправится на модерацию. Подключение T-Bank можно добавить позже через модель AdPayment.</p>
        </div>
      ) : null}

      {step === 5 ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          <p className="font-semibold">Реклама проверяется</p>
          <p className="mt-2">Обычно это занимает немного времени. Вы получите уведомление в кабинете после решения модератора.</p>
        </div>
      ) : null}

      {(step === 0 || step === 4) && <LegalConsentNotice variant="advertising" className="mt-1" />}

      <div className="flex gap-2">
        {step > 0 && step < 5 ? (
          <button type="button" onClick={() => setStep((s) => s - 1)} className="rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-700">
            Назад
          </button>
        ) : null}
        {step < 5 ? (
          <button type="button" disabled={loading} onClick={handleNext} className="rounded-xl bg-[hsl(var(--nashlo-orange))] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            {loading ? "Подождите…" : step === 4 ? "Оплатить и отправить" : "Далее"}
          </button>
        ) : (
          <button type="button" onClick={() => router.push(`/profile/ads/${campaignId}`)} className="rounded-xl bg-[hsl(var(--nashlo-orange))] px-5 py-2.5 text-sm font-semibold text-white">
            К кампании
          </button>
        )}
      </div>
    </div>
  )
}
