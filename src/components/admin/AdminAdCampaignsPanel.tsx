"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { AdCampaign, AdDevice, AdPlacement, AdStatus, AdType } from "@prisma/client"
import {
  AD_CATEGORY_OPTIONS,
  AD_CITY_OPTIONS,
  AD_DEVICE_OPTIONS,
  AD_STATUS_OPTIONS,
  AD_TYPE_OPTIONS,
  CAMPAIGN_PLACEMENT_GROUPS,
  getCampaignPlacementGuide,
} from "@/lib/ads/admin-options"

type CampaignDraft = {
  id?: string
  title: string
  description: string
  imageUrl: string
  targetUrl: string
  ctaText: string
  label: string
  city: string
  type: AdType
  placements: AdPlacement[]
  status: AdStatus
  categoryIds: string[]
  cityIds: string[]
  subcategoryIds: string[]
  regionIds: string[]
  districtIds: string[]
  device: AdDevice
  keywords: string
  interests: string
  startDate: string
  endDate: string
  budget: string
  dailyBudget: string
  maxImpressionsPerUserPerDay: number
  maxImpressionsPerSession: number
}

function emptyDraft(): CampaignDraft {
  return {
    title: "",
    description: "",
    imageUrl: "",
    targetUrl: "/advertising",
    ctaText: "Подробнее",
    label: "",
    city: "",
    type: "NATIVE_CARD",
    placements: ["MOBILE_FEED_INLINE", "SEARCH_FEED_INLINE"],
    status: "DRAFT",
    categoryIds: [],
    cityIds: [],
    subcategoryIds: [],
    regionIds: [],
    districtIds: [],
    device: "ALL",
    keywords: "",
    interests: "",
    startDate: "",
    endDate: "",
    budget: "",
    dailyBudget: "",
    maxImpressionsPerUserPerDay: 10,
    maxImpressionsPerSession: 3,
  }
}

function fromCampaign(c: AdCampaign): CampaignDraft {
  return {
    id: c.id,
    title: c.title,
    description: c.description ?? "",
    imageUrl: c.imageUrl ?? "",
    targetUrl: c.targetUrl,
    ctaText: c.ctaText ?? "",
    label: c.label ?? "",
    city: c.city ?? "",
    type: c.type,
    placements: c.placements,
    status: c.status,
    categoryIds: c.categoryIds,
    cityIds: c.cityIds,
    subcategoryIds: c.subcategoryIds,
    regionIds: c.regionIds,
    districtIds: c.districtIds,
    device: c.device,
    keywords: c.keywords.join(", "),
    interests: c.interests.join(", "),
    startDate: c.startDate ? String(c.startDate).slice(0, 10) : "",
    endDate: c.endDate ? String(c.endDate).slice(0, 10) : "",
    budget: c.budget != null ? String(c.budget) : "",
    dailyBudget: c.dailyBudget != null ? String(c.dailyBudget) : "",
    maxImpressionsPerUserPerDay: c.maxImpressionsPerUserPerDay,
    maxImpressionsPerSession: c.maxImpressionsPerSession,
  }
}

function splitCsv(value: string) {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

export function AdminAdCampaignsPanel() {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([])
  const [draft, setDraft] = useState<CampaignDraft>(emptyDraft)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/ad-campaigns")
      if (!res.ok) throw new Error("load failed")
      const data = await res.json()
      setCampaigns(data.campaigns ?? [])
    } catch {
      setMessage("Не удалось загрузить кампании")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const totals = useMemo(
    () => ({
      impressions: campaigns.reduce((s, c) => s + c.impressions, 0),
      clicks: campaigns.reduce((s, c) => s + c.clicks, 0),
    }),
    [campaigns],
  )

  function updateDraft<K extends keyof CampaignDraft>(key: K, value: CampaignDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
    setMessage("")
  }

  function togglePlacement(p: AdPlacement) {
    setDraft((d) => ({
      ...d,
      placements: d.placements.includes(p)
        ? d.placements.filter((x) => x !== p)
        : [...d.placements, p],
    }))
  }

  function toggleInList(key: "categoryIds" | "cityIds", value: string) {
    setDraft((d) => ({
      ...d,
      [key]: d[key].includes(value) ? d[key].filter((x) => x !== value) : [...d[key], value],
    }))
  }

  async function saveDraft() {
    if (!draft.title.trim() || !draft.targetUrl.trim() || draft.placements.length === 0) {
      setMessage("Заполните название, ссылку и хотя бы одно размещение")
      return
    }
    setSaving(true)
    setMessage("")
    try {
      const res = await fetch("/api/admin/ad-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          keywords: splitCsv(draft.keywords),
          interests: splitCsv(draft.interests),
          budget: draft.budget ? Number(draft.budget) : null,
          dailyBudget: draft.dailyBudget ? Number(draft.dailyBudget) : null,
          startDate: draft.startDate || null,
          endDate: draft.endDate || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "save failed")
      setDraft(emptyDraft())
      setMessage("Кампания сохранена")
      await load()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Ошибка сохранения")
    } finally {
      setSaving(false)
    }
  }

  async function setStatus(id: string, status: AdStatus) {
    await fetch(`/api/admin/ad-campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    await load()
  }

  async function removeCampaign(id: string) {
    if (!confirm("Удалить кампанию?")) return
    await fetch(`/api/admin/ad-campaigns/${id}`, { method: "DELETE" })
    await load()
  }

  return (
    <section id="feed-campaigns" className="scroll-mt-24 space-y-8">
      <div>
        <p className="text-sm font-semibold text-[hsl(var(--nashlo-blue))]">Раздел 3</p>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">Реклама в ленте объявлений</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Нативные карточки между объявлениями: главная (рекомендации и свежие), категории, поиск, карточка товара.
          Отметьте размещения при создании кампании.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">Кампаний</p>
          <p className="text-2xl font-semibold text-zinc-950">{campaigns.length}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">Показы</p>
          <p className="text-2xl font-semibold text-zinc-950">{totals.impressions.toLocaleString("ru-RU")}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">Клики</p>
          <p className="text-2xl font-semibold text-zinc-950">{totals.clicks.toLocaleString("ru-RU")}</p>
        </div>
      </div>

      <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-950">
          {draft.id ? "Редактирование кампании" : "Новая кампания"}
        </h2>
        {message ? <p className="mt-2 text-sm text-zinc-600">{message}</p> : null}

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Заголовок</span>
            <input value={draft.title} onChange={(e) => updateDraft("title", e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-zinc-200 px-3" />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Ссылка</span>
            <input value={draft.targetUrl} onChange={(e) => updateDraft("targetUrl", e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-zinc-200 px-3" />
          </label>
          <label className="block text-sm lg:col-span-2">
            <span className="font-medium text-zinc-700">Описание</span>
            <textarea value={draft.description} onChange={(e) => updateDraft("description", e.target.value)} rows={2} className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2" />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Изображение (URL)</span>
            <input value={draft.imageUrl} onChange={(e) => updateDraft("imageUrl", e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-zinc-200 px-3" />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Город на карточке</span>
            <input value={draft.city} onChange={(e) => updateDraft("city", e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-zinc-200 px-3" />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">CTA</span>
            <input value={draft.ctaText} onChange={(e) => updateDraft("ctaText", e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-zinc-200 px-3" />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Метка</span>
            <input value={draft.label} onChange={(e) => updateDraft("label", e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-zinc-200 px-3" />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Тип</span>
            <select value={draft.type} onChange={(e) => updateDraft("type", e.target.value as AdType)} className="mt-1 h-11 w-full rounded-xl border border-zinc-200 px-3">
              {AD_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Статус</span>
            <select value={draft.status} onChange={(e) => updateDraft("status", e.target.value as AdStatus)} className="mt-1 h-11 w-full rounded-xl border border-zinc-200 px-3">
              {AD_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Устройство</span>
            <select value={draft.device} onChange={(e) => updateDraft("device", e.target.value as AdDevice)} className="mt-1 h-11 w-full rounded-xl border border-zinc-200 px-3">
              {AD_DEVICE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Ключевые слова (через запятую)</span>
            <input value={draft.keywords} onChange={(e) => updateDraft("keywords", e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-zinc-200 px-3" />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Интересы (через запятую)</span>
            <input value={draft.interests} onChange={(e) => updateDraft("interests", e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-zinc-200 px-3" />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Старт</span>
            <input type="date" value={draft.startDate} onChange={(e) => updateDraft("startDate", e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-zinc-200 px-3" />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Окончание</span>
            <input type="date" value={draft.endDate} onChange={(e) => updateDraft("endDate", e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-zinc-200 px-3" />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Бюджет</span>
            <input value={draft.budget} onChange={(e) => updateDraft("budget", e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-zinc-200 px-3" />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Дневной бюджет</span>
            <input value={draft.dailyBudget} onChange={(e) => updateDraft("dailyBudget", e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-zinc-200 px-3" />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Лимит показов / день</span>
            <input type="number" value={draft.maxImpressionsPerUserPerDay} onChange={(e) => updateDraft("maxImpressionsPerUserPerDay", Number(e.target.value))} className="mt-1 h-11 w-full rounded-xl border border-zinc-200 px-3" />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Лимит показов / сессия</span>
            <input type="number" value={draft.maxImpressionsPerSession} onChange={(e) => updateDraft("maxImpressionsPerSession", Number(e.target.value))} className="mt-1 h-11 w-full rounded-xl border border-zinc-200 px-3" />
          </label>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <p className="text-sm font-medium text-zinc-700">Где показывать кампанию</p>
            <p className="mt-1 text-xs text-zinc-500">
              Карточка встраивается между объявлениями — это не баннеры с вкладки «Баннеры (главная)».
            </p>
          </div>
          {CAMPAIGN_PLACEMENT_GROUPS.map((group) => (
            <div key={group.id} className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">{group.label}</p>
              <div className="mt-2 space-y-2">
                {group.items.map((p) => {
                  const selected = draft.placements.includes(p.value)
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => togglePlacement(p.value)}
                      className={[
                        "w-full rounded-xl border px-3 py-2.5 text-left transition",
                        selected
                          ? "border-[hsl(var(--nashlo-orange))] bg-[hsl(var(--nashlo-orange)/0.08)] ring-1 ring-[hsl(var(--nashlo-orange)/0.2)]"
                          : "border-zinc-200 bg-white hover:border-zinc-300",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-zinc-900">{p.label}</span>
                        <span
                          className={[
                            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                            selected ? "bg-[hsl(var(--nashlo-orange))] text-white" : "bg-zinc-100 text-zinc-500",
                          ].join(" ")}
                        >
                          {selected ? "Вкл" : "Выкл"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">
                        <span className="font-medium text-zinc-600">{p.pages}</span>
                        {" — "}
                        {p.where}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
          {draft.placements.length > 0 ? (
            <p className="text-xs text-zinc-500">
              Выбрано:{" "}
              {draft.placements
                .map((p) => getCampaignPlacementGuide(p)?.label ?? p)
                .join(" · ")}
            </p>
          ) : null}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-zinc-700">Категории</p>
            <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-zinc-200 p-2">
              {AD_CATEGORY_OPTIONS.map((c) => (
                <label key={c.value} className="flex items-center gap-2 py-1 text-sm">
                  <input type="checkbox" checked={draft.categoryIds.includes(c.value)} onChange={() => toggleInList("categoryIds", c.value)} />
                  {c.label}
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-700">Города таргетинга</p>
            <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-zinc-200 p-2">
              {AD_CITY_OPTIONS.slice(0, 30).map((c) => (
                <label key={c.value} className="flex items-center gap-2 py-1 text-sm">
                  <input type="checkbox" checked={draft.cityIds.includes(c.value)} onChange={() => toggleInList("cityIds", c.value)} />
                  {c.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" disabled={saving} onClick={saveDraft} className="rounded-xl bg-[hsl(var(--nashlo-orange))] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            {saving ? "Сохранение…" : "Сохранить кампанию"}
          </button>
          {draft.id ? (
            <button type="button" onClick={() => setDraft(emptyDraft())} className="rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-700">
              Новая
            </button>
          ) : null}
        </div>
      </section>

      <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-950">Кампании</h2>
        {loading ? (
          <p className="mt-3 text-sm text-zinc-500">Загрузка…</p>
        ) : campaigns.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">Пока нет кампаний</p>
        ) : (
          <div className="mt-4 space-y-3">
            {campaigns.map((c) => (
              <div key={c.id} className="rounded-2xl border border-zinc-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-zinc-950">{c.title}</p>
                    <p className="text-xs text-zinc-500">
                      {c.status} · {c.type} ·{" "}
                      {c.placements
                        .map((p) => getCampaignPlacementGuide(p)?.label ?? p)
                        .join(" · ")}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Показы: {c.impressions} · Клики: {c.clicks}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setDraft(fromCampaign(c))} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold">Изменить</button>
                    {c.status !== "ACTIVE" ? (
                      <button type="button" onClick={() => setStatus(c.id, "ACTIVE")} className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">Включить</button>
                    ) : (
                      <button type="button" onClick={() => setStatus(c.id, "PAUSED")} className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">Пауза</button>
                    )}
                    <button type="button" onClick={() => removeCampaign(c.id)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">Удалить</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}
