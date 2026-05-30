"use client"

import { useEffect, useMemo, useState } from "react"
import { AdminAdSlotLayoutMap } from "@/components/admin/AdminAdSlotLayoutMap"
import { AdminAdSlotPreview } from "@/components/admin/AdminAdSlotPreview"
import { AdminTopBannerManager } from "@/components/admin/AdminTopBannerManager"
import { AD_DISCLOSURE_MARK_OPTIONS, type AdDisclosureMark } from "@/lib/ads/disclosure-mark"
import { getAdminCsrfFromDocument } from "@/lib/admin/csrf-client"
import { AdminBannerSlotMediaUpload } from "@/components/admin/AdminBannerSlotMediaUpload"
import {
  adSlots,
  createDefaultAd,
  fetchAdminBannerSlots,
  getAdSlotDefinition,
  loadManagedAds,
  saveAdminBannerSlots,
  type AdSlotId,
  type ManagedAd,
} from "@/lib/ad-store"
import type { PlacementConfigDto } from "@/lib/ads/placement-config-service"
import { getPlacementConfigByCode } from "@/lib/ads/placement-config-service"

function today() {
  return new Date().toISOString().slice(0, 10)
}

function daysBetween(start: string, end: string) {
  return Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (24 * 60 * 60 * 1000))
}

export function AdminBannerSlotsPanel() {
  const [ads, setAds] = useState<ManagedAd[]>([])
  const [draft, setDraft] = useState<ManagedAd>(() => createDefaultAd("leaderboard"))
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [minDays, setMinDays] = useState(1)
  const [placementConfigs, setPlacementConfigs] = useState<PlacementConfigDto[]>([])

  const selectedSlotMeta = getAdSlotDefinition(draft.slot)
  const selectedPlacement = getPlacementConfigByCode(placementConfigs, draft.slot)
  const isEditing = ads.some((ad) => ad.id === draft.id)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        let serverAds = await fetchAdminBannerSlots()
        if (!serverAds.length) {
          const local = loadManagedAds()
          if (local.length) {
            const migrated = await saveAdminBannerSlots(local, getAdminCsrfFromDocument())
            if (migrated.ok && migrated.ads) {
              serverAds = migrated.ads
              setMessage("Реклама из браузера перенесена на сервер.")
            }
          }
        }
        setAds(serverAds)
      } catch {
        setMessage("Не удалось загрузить баннеры. Обновите страницу.")
      } finally {
        setLoading(false)
      }
    }
    load()
    fetch("/api/admin/ad-placements")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setPlacementConfigs(d?.placements ?? []))
      .catch(() => {})
  }, [])

  const activeBySlot = useMemo(() => {
    return Object.fromEntries(
      adSlots.map((slot) => [slot.id, ads.filter((ad) => ad.slot === slot.id && ad.active).length]),
    ) as Record<AdSlotId, number>
  }, [ads])

  const activeAdForSlot = useMemo(
    () => ads.find((ad) => ad.slot === draft.slot && ad.active) ?? null,
    [ads, draft.slot],
  )

  const totals = useMemo(
    () => ({
      impressions: ads.reduce((sum, ad) => sum + (ad.impressions || 0), 0),
      clicks: ads.reduce((sum, ad) => sum + (ad.clicks || 0), 0),
    }),
    [ads],
  )

  async function persist(next: ManagedAd[], successMessage?: string) {
    setSaving(true)
    setMessage("")
    const result = await saveAdminBannerSlots(next, getAdminCsrfFromDocument())
    setSaving(false)
    if (!result.ok) {
      setMessage(result.error || "Не удалось сохранить")
      return false
    }
    setAds(result.ads ?? next)
    if (successMessage) setMessage(successMessage)
    return true
  }

  function updateDraft<K extends keyof ManagedAd>(key: K, value: ManagedAd[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
    setMessage("")
  }

  function selectSlot(slot: AdSlotId) {
    setDraft((current) => ({ ...current, slot }))
    setMessage("")
  }

  async function saveDraft() {
    if (!draft.href?.trim()) {
      setMessage("Укажите ссылку, куда ведёт баннер.")
      return
    }

    const imageOnly = Boolean(draft.imageOnly && draft.image?.trim())
    if (!imageOnly && !draft.title?.trim()) {
      setMessage("Укажите заголовок или включите режим «только картинка».")
      return
    }

    if (!draft.startsAt || !draft.endsAt) {
      setMessage("Укажите даты показа.")
      return
    }

    if (daysBetween(draft.startsAt, draft.endsAt) < minDays) {
      setMessage(`Срок показа должен быть минимум ${minDays} ${minDays === 1 ? "день" : "дня"}.`)
      return
    }

    if (draft.active) {
      const hasActiveInSlot = ads.some((ad) => ad.id !== draft.id && ad.slot === draft.slot && ad.active)
      if (hasActiveInSlot) {
        setMessage("В одном слоте может быть только одна активная реклама. Сначала выключите старую.")
        return
      }
    }

    const normalizedDraft = {
      ...draft,
      status: draft.active ? ("approved" as const) : draft.status || ("draft" as const),
    }
    const exists = ads.some((ad) => ad.id === draft.id)
    const next = exists
      ? ads.map((ad) => (ad.id === draft.id ? normalizedDraft : ad))
      : [normalizedDraft, ...ads]
    const ok = await persist(
      next,
      isEditing
        ? `Баннер «${normalizedDraft.title}» обновлён.`
        : `Сохранено для слота «${getAdSlotDefinition(normalizedDraft.slot).label}».`,
    )
    if (ok && !isEditing) setDraft(createDefaultAd(draft.slot))
  }

  function editAd(ad: ManagedAd) {
    setDraft({
      ...ad,
      imageOnly: Boolean(ad.image?.trim() && (!ad.subtitle || ad.subtitle === ad.title)),
    })
    setMessage("")
    requestAnimationFrame(() => {
      document.getElementById("banner-editor")?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  function cancelEdit() {
    setDraft(createDefaultAd(draft.slot))
    setMessage("")
  }

  function duplicateAd(ad: ManagedAd) {
    setDraft({
      ...ad,
      id: crypto.randomUUID(),
      active: false,
      status: "draft",
      imageOnly: Boolean(ad.image?.trim()),
    })
    setMessage("Копия в форме — измените и сохраните.")
    document.getElementById("banner-editor")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  function removeMedia() {
    setDraft((current) => ({
      ...current,
      image: undefined,
      imageOnly: false,
      mediaType: undefined,
      mediaMimeType: undefined,
      mediaWidth: undefined,
      mediaHeight: undefined,
      mediaDuration: undefined,
    }))
    setMessage("")
  }

  async function toggleAd(ad: ManagedAd) {
    if (!ad.active) {
      const hasActiveInSlot = ads.some((item) => item.id !== ad.id && item.slot === ad.slot && item.active)
      if (hasActiveInSlot) {
        setMessage("В этом слоте уже есть активная реклама.")
        return
      }
    }

    await persist(
      ads.map((item) =>
        item.id === ad.id
          ? { ...item, active: !item.active, status: !item.active ? "approved" : "draft" }
          : item,
      ),
      !ad.active ? "Реклама включена." : "Реклама выключена.",
    )
  }

  async function approveAd(ad: ManagedAd) {
    const hasActiveInSlot = ads.some((item) => item.id !== ad.id && item.slot === ad.slot && item.active)
    if (hasActiveInSlot) {
      setMessage("В этом слоте уже есть активная реклама. Сначала выключите старую.")
      return
    }

    await persist(
      ads.map((item) =>
        item.id === ad.id ? { ...item, status: "approved", active: true, moderationComment: "" } : item,
      ),
      "Реклама одобрена и включена.",
    )
  }

  async function rejectAd(ad: ManagedAd) {
    await persist(
      ads.map((item) =>
        item.id === ad.id
          ? {
              ...item,
              status: "rejected",
              active: false,
              moderationComment:
                "Нужны правки креатива или данных. Исправьте материалы и отправьте повторно.",
            }
          : item,
      ),
      "Реклама отклонена.",
    )
  }

  async function deleteAd(id: string) {
    await persist(ads.filter((ad) => ad.id !== id), "Запись удалена.")
  }

  return (
    <div className="space-y-10">
      <div id="site-strip" className="scroll-mt-24">
        <div className="mb-4">
          <p className="text-sm font-semibold text-[hsl(var(--nashlo-orange))]">Раздел 1</p>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">Полоса над шапкой</h2>
          <p className="mt-1 text-sm text-zinc-500">На всех страницах сайта, кроме админки и бизнес-зоны.</p>
        </div>
        <AdminTopBannerManager />
      </div>

      <div id="banner-slots" className="scroll-mt-24">
        <div className="mb-4">
          <p className="text-sm font-semibold text-[hsl(var(--nashlo-orange))]">Раздел 2</p>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">Баннеры на главной</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Мобильный и десктопный лидерборд, сайдбар — отдельный баннер в каждом слоте.
          </p>
        </div>

      <AdminAdSlotLayoutMap
        selectedSlot={draft.slot}
        onSelectSlot={selectSlot}
        activeBySlot={activeBySlot}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {adSlots.map((slot) => (
          <button
            key={slot.id}
            type="button"
            onClick={() => selectSlot(slot.id)}
            className={[
              "rounded-2xl border px-4 py-4 text-left shadow-sm transition",
              draft.slot === slot.id
                ? "border-[hsl(var(--nashlo-orange))] bg-[hsl(var(--nashlo-orange)/0.06)] ring-2 ring-[hsl(var(--nashlo-orange)/0.2)]"
                : "border-zinc-200 bg-white hover:border-zinc-300",
            ].join(" ")}
          >
            <p className="text-2xl font-semibold text-zinc-950">{activeBySlot[slot.id]}</p>
            <p className="mt-1 text-sm font-semibold text-zinc-800">{slot.label}</p>
            <span className="mt-2 inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600">
              {slot.zoneLabel}
            </span>
            <p className="mt-1 text-xs text-zinc-500">{slot.size}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-zinc-400">Показы</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-950">
            {totals.impressions.toLocaleString("ru-RU")}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-zinc-400">Переходы</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-950">
            {totals.clicks.toLocaleString("ru-RU")}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-zinc-400">CTR</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-950">
            {totals.impressions ? ((totals.clicks / totals.impressions) * 100).toFixed(1) : "0"}%
          </p>
        </div>
      </div>

      <section id="banner-editor" className="scroll-mt-24 grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            saveDraft()
          }}
          className={[
            "h-fit rounded-[28px] border bg-white p-5 shadow-sm",
            isEditing ? "border-[hsl(var(--nashlo-orange))] ring-2 ring-[hsl(var(--nashlo-orange)/0.15)]" : "border-zinc-200",
          ].join(" ")}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              {isEditing ? (
                <span className="inline-flex rounded-full bg-[hsl(var(--nashlo-orange)/0.12)] px-2.5 py-0.5 text-xs font-bold text-[hsl(var(--nashlo-orange))]">
                  Редактирование
                </span>
              ) : null}
              <p className="text-sm font-semibold text-[hsl(var(--nashlo-orange))]">
                {selectedSlotMeta.zoneLabel}
              </p>
              <h2 className="text-xl font-semibold text-zinc-950">
                {isEditing ? draft.title || selectedSlotMeta.label : selectedSlotMeta.label}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                <span className="font-medium text-zinc-700">{selectedSlotMeta.page}</span>
                {" · "}
                {selectedSlotMeta.placement}
              </p>
              <p className="mt-1 text-xs text-amber-800/90">{selectedSlotMeta.adminHint}</p>
              <p className="mt-1 text-xs font-medium text-zinc-400">{selectedSlotMeta.imageHint}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {isEditing ? (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600"
                >
                  Отмена
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setDraft(createDefaultAd(draft.slot))}
                className="rounded-xl bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-600"
              >
                Новая в слоте
              </button>
            </div>
          </div>

          {activeAdForSlot && activeAdForSlot.id !== draft.id && (
            <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              В этом слоте уже активна реклама «{activeAdForSlot.title}». При включении новой старую нужно
              выключить.
            </p>
          )}

          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            {adSlots.map((slot) => (
              <button
                key={slot.id}
                type="button"
                onClick={() => selectSlot(slot.id)}
                className={[
                  "rounded-2xl border px-3 py-3 text-left text-sm transition",
                  draft.slot === slot.id
                    ? "border-[hsl(var(--nashlo-orange))] bg-orange-50 font-semibold text-zinc-900"
                    : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-white",
                ].join(" ")}
              >
                <span className="block text-xs text-zinc-400">{slot.size}</span>
                {slot.shortLabel}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Гибкие настройки</p>
              <div className="mt-3 flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    checked={Boolean(draft.imageOnly)}
                    disabled={!draft.image?.trim()}
                    onChange={(event) => updateDraft("imageOnly", event.target.checked)}
                    className="h-4 w-4 accent-[hsl(var(--nashlo-orange))]"
                  />
                  Только картинка (без текста)
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-700">
                  <span className="text-zinc-500">Мин. срок:</span>
                  <select
                    value={minDays}
                    onChange={(event) => setMinDays(Number(event.target.value))}
                    className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm"
                  >
                    <option value={1}>1 день</option>
                    <option value={7}>7 дней</option>
                    <option value={30}>30 дней</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-medium text-zinc-600">Старт</span>
                <input
                  type="date"
                  value={draft.startsAt || today()}
                  onChange={(event) => updateDraft("startsAt", event.target.value)}
                  className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-zinc-600">Конец</span>
                <input
                  type="date"
                  value={draft.endsAt}
                  onChange={(event) => updateDraft("endsAt", event.target.value)}
                  className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-zinc-600">Ссылка *</span>
              <input
                value={draft.href}
                onChange={(event) => updateDraft("href", event.target.value)}
                placeholder="/advertising или https://..."
                className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]"
              />
            </label>

            <AdminBannerSlotMediaUpload
              slot={draft.slot}
              slotSizeLabel={selectedSlotMeta.size}
              placementConfig={selectedPlacement}
              image={draft.image}
              mediaType={draft.mediaType}
              mediaWidth={draft.mediaWidth}
              mediaHeight={draft.mediaHeight}
              mediaSize={undefined}
              onUploaded={(payload) => {
                setDraft((current) => ({
                  ...current,
                  ...payload,
                  imageOnly: true,
                }))
                setMessage("Медиа загружено.")
              }}
              onClear={removeMedia}
            />

            <label className="block">
              <span className="text-sm font-medium text-zinc-600">Пометка в углу баннера</span>
              <select
                value={draft.disclosureMark ?? "ad"}
                onChange={(event) =>
                  updateDraft("disclosureMark", event.target.value as AdDisclosureMark)
                }
                className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]"
              >
                {AD_DISCLOSURE_MARK_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-zinc-500">
                Для маркировки по закону: «Реклама» или «Партнёр сервиса» (без ERID).
              </p>
            </label>

            {!draft.imageOnly ? (
              <>
                <label className="block">
                  <span className="text-sm font-medium text-zinc-600">Заголовок</span>
                  <input
                    value={draft.title}
                    onChange={(event) => updateDraft("title", event.target.value)}
                    className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-zinc-600">Описание</span>
                  <textarea
                    value={draft.subtitle}
                    onChange={(event) => updateDraft("subtitle", event.target.value)}
                    rows={2}
                    className="mt-2 w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-sm font-medium text-zinc-600">Кнопка</span>
                    <input
                      value={draft.cta}
                      onChange={(event) => updateDraft("cta", event.target.value)}
                      className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-zinc-600">Рекламодатель</span>
                    <input
                      value={draft.advertiser}
                      onChange={(event) => updateDraft("advertiser", event.target.value)}
                      className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-sm font-medium text-zinc-600">ERID</span>
                    <input
                      value={draft.erid}
                      onChange={(event) => updateDraft("erid", event.target.value)}
                      placeholder="необязательно"
                      className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-zinc-600">ОРД</span>
                    <input
                      value={draft.ordName}
                      onChange={(event) => updateDraft("ordName", event.target.value)}
                      placeholder="необязательно"
                      className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]"
                    />
                  </label>
                </div>
              </>
            ) : (
              <label className="block">
                <span className="text-sm font-medium text-zinc-600">Подпись (alt, необязательно)</span>
                <input
                  value={draft.title}
                  onChange={(event) => updateDraft("title", event.target.value)}
                  placeholder="Для доступности"
                  className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]"
                />
              </label>
            )}
            <label className="flex items-center gap-3 rounded-2xl bg-zinc-50 p-3">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(event) => updateDraft("active", event.target.checked)}
                className="h-4 w-4 accent-[hsl(var(--nashlo-orange))]"
              />
              <span className="text-sm font-medium text-zinc-700">
                Показывать в слоте «{selectedSlotMeta.shortLabel}» после сохранения
              </span>
            </label>
          </div>

          {message && (
            <p className="mt-4 rounded-2xl bg-[hsl(var(--nashlo-orange)/0.08)] px-4 py-3 text-sm text-[hsl(var(--nashlo-orange))]">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={saving || loading}
            className="mt-5 w-full rounded-2xl bg-[hsl(var(--nashlo-orange))] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Сохраняем..." : isEditing ? "Сохранить изменения" : `Создать в ${selectedSlotMeta.shortLabel}`}
          </button>
        </form>

        <div className="space-y-4">
          <AdminAdSlotPreview ad={draft} />
        </div>
      </section>

      <section className="rounded-[28px] border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-5 py-4">
          <h2 className="font-semibold text-zinc-950">Все размещения по слотам</h2>
          <p className="mt-1 text-sm text-zinc-500">Сгруппировано по зонам на главной.</p>
        </div>
        {ads.length === 0 ? (
          <div className="px-5 py-16 text-center text-zinc-400">
            <p className="font-medium">Реклам пока нет</p>
            <p className="mt-1 text-sm">Выберите слот на схеме и создайте первый баннер.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {ads.map((ad) => {
              const slot = getAdSlotDefinition(ad.slot)
              return (
                <article
                  key={ad.id}
                  className={[
                    "grid gap-4 px-5 py-4 xl:grid-cols-[100px_minmax(0,1fr)_160px] xl:items-center",
                    draft.id === ad.id ? "bg-[hsl(var(--nashlo-orange)/0.04)]" : "",
                  ].join(" ")}
                >
                  <div className="space-y-1">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        slot.tone === "orange"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-sky-100 text-sky-700"
                      }`}
                    >
                      {slot.zoneLabel}
                    </span>
                    <div className="h-20 overflow-hidden rounded-xl bg-zinc-100">
                      {ad.image ? (
                        <img src={ad.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-zinc-300">—</div>
                      )}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold text-zinc-950">{ad.title}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          ad.active ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"
                        }`}
                      >
                        {ad.active ? "На сайте" : "Выключена"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">
                      {slot.label} · {slot.size}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {ad.startsAt} — {ad.endsAt}
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <button
                      type="button"
                      onClick={() => editAd(ad)}
                      className="rounded-xl bg-zinc-950 px-3 py-2 text-xs font-semibold text-white"
                    >
                      {draft.id === ad.id ? "В форме ↑" : "Редактировать"}
                    </button>
                    <button
                      type="button"
                      onClick={() => duplicateAd(ad)}
                      className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700"
                    >
                      Копировать
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleAd(ad)}
                      className="rounded-xl bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-700"
                    >
                      {ad.active ? "Выключить" : "Включить"}
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => approveAd(ad)}
                        className="rounded-xl bg-emerald-50 px-2 py-2 text-xs font-semibold text-emerald-700"
                      >
                        Одобрить
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteAd(ad.id)}
                        className="rounded-xl bg-red-50 px-2 py-2 text-xs font-semibold text-red-600"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
      </div>
    </div>
  )
}
