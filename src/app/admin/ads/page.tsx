"use client"

import { useEffect, useMemo, useState } from "react"
import { adSlots, createDefaultAd, loadManagedAds, saveManagedAds, type AdSlotId, type ManagedAd } from "@/lib/ad-store"

function today() {
  return new Date().toISOString().slice(0, 10)
}

function daysBetween(start: string, end: string) {
  return Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (24 * 60 * 60 * 1000))
}

function emptyAd(): ManagedAd {
  return createDefaultAd("leaderboard")
}

export default function AdminAdsPage() {
  const [ads, setAds] = useState<ManagedAd[]>([])
  const [draft, setDraft] = useState<ManagedAd>(emptyAd)
  const [message, setMessage] = useState("")

  useEffect(() => {
    setAds(loadManagedAds())
  }, [])

  const activeBySlot = useMemo(() => {
    return Object.fromEntries(adSlots.map((slot) => [
      slot.id,
      ads.filter((ad) => ad.slot === slot.id && ad.active).length,
    ])) as Record<AdSlotId, number>
  }, [ads])

  function persist(next: ManagedAd[]) {
    setAds(next)
    saveManagedAds(next)
  }

  function updateDraft<K extends keyof ManagedAd>(key: K, value: ManagedAd[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
    setMessage("")
  }

  function saveDraft() {
    const required = [draft.title, draft.subtitle, draft.cta, draft.href, draft.advertiser, draft.startsAt, draft.endsAt, draft.erid, draft.ordName]

    if (required.some((value) => !String(value).trim())) {
      setMessage("Заполните все обязательные поля рекламы.")
      return
    }

    if (daysBetween(draft.startsAt, draft.endsAt) < 30) {
      setMessage("Срок рекламы должен быть минимум 30 дней.")
      return
    }

    if (draft.active) {
      const hasActiveInSlot = ads.some((ad) => ad.id !== draft.id && ad.slot === draft.slot && ad.active)
      if (hasActiveInSlot) {
        setMessage("В одном слоте может быть только одна активная реклама. Сначала выключите старую.")
        return
      }
    }

    const exists = ads.some((ad) => ad.id === draft.id)
    const next = exists ? ads.map((ad) => ad.id === draft.id ? draft : ad) : [draft, ...ads]
    persist(next)
    setDraft(createDefaultAd(draft.slot))
    setMessage("Сохранено. Активная реклама сразу появится на главной.")
  }

  function editAd(ad: ManagedAd) {
    setDraft(ad)
    setMessage("")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function toggleAd(ad: ManagedAd) {
    if (!ad.active) {
      const hasActiveInSlot = ads.some((item) => item.id !== ad.id && item.slot === ad.slot && item.active)
      if (hasActiveInSlot) {
        setMessage("В этом слоте уже есть активная реклама.")
        return
      }
    }

    persist(ads.map((item) => item.id === ad.id ? { ...item, active: !item.active } : item))
  }

  function deleteAd(id: string) {
    persist(ads.filter((ad) => ad.id !== id))
  }

  function handleImage(file: File | undefined) {
    if (!file) return

    if (file.size > 900_000) {
      setMessage("Картинка слишком большая. Для демо используйте файл до 900 КБ.")
      return
    }

    const reader = new FileReader()
    reader.onload = () => updateDraft("image", String(reader.result))
    reader.readAsDataURL(file)
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Рекламные места</h1>
          <p className="mt-1 text-sm text-zinc-500">Управление баннерами на главной: загрузка, срок, ERID, включение и выключение слотов.</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {adSlots.map((slot) => (
            <div key={slot.id} className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-center shadow-sm">
              <p className="text-lg font-semibold text-zinc-950">{activeBySlot[slot.id]}</p>
              <p className="text-xs text-zinc-400">{slot.size}</p>
            </div>
          ))}
        </div>
      </div>

      <section className="mt-8 grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            saveDraft()
          }}
          className="h-fit rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-zinc-950">Карточка рекламы</h2>
              <p className="mt-1 text-sm text-zinc-500">Минимальный срок размещения — 30 дней.</p>
            </div>
            <button type="button" onClick={() => setDraft(createDefaultAd(draft.slot))} className="rounded-xl bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-600">
              Новая
            </button>
          </div>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-zinc-600">Слот *</span>
              <select value={draft.slot} onChange={(event) => updateDraft("slot", event.target.value as AdSlotId)} className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]">
                {adSlots.map((slot) => (
                  <option key={slot.id} value={slot.id}>{slot.label} · {slot.size}</option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-medium text-zinc-600">Старт *</span>
                <input type="date" value={draft.startsAt || today()} onChange={(event) => updateDraft("startsAt", event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-zinc-600">Конец *</span>
                <input type="date" value={draft.endsAt} onChange={(event) => updateDraft("endsAt", event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]" />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-zinc-600">Рекламодатель *</span>
              <input value={draft.advertiser} onChange={(event) => updateDraft("advertiser", event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-zinc-600">Заголовок *</span>
              <input value={draft.title} onChange={(event) => updateDraft("title", event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-zinc-600">Описание *</span>
              <textarea value={draft.subtitle} onChange={(event) => updateDraft("subtitle", event.target.value)} rows={3} className="mt-2 w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-medium text-zinc-600">Кнопка *</span>
                <input value={draft.cta} onChange={(event) => updateDraft("cta", event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-zinc-600">Ссылка *</span>
                <input value={draft.href} onChange={(event) => updateDraft("href", event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]" />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-medium text-zinc-600">ERID *</span>
                <input value={draft.erid} onChange={(event) => updateDraft("erid", event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-zinc-600">ОРД *</span>
                <input value={draft.ordName} onChange={(event) => updateDraft("ordName", event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]" />
              </label>
            </div>
            <label className="block">
              <span className="text-sm font-medium text-zinc-600">Картинка</span>
              <input type="file" accept="image/*" onChange={(event) => handleImage(event.target.files?.[0])} className="mt-2 block w-full text-sm text-zinc-500 file:mr-3 file:rounded-xl file:border-0 file:bg-zinc-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white" />
            </label>
            {draft.image && (
              <div className="overflow-hidden rounded-2xl border border-zinc-200">
                <img src={draft.image} alt="" className="h-36 w-full object-cover" />
              </div>
            )}
            <label className="flex items-center gap-3 rounded-2xl bg-zinc-50 p-3">
              <input type="checkbox" checked={draft.active} onChange={(event) => updateDraft("active", event.target.checked)} className="h-4 w-4 accent-[hsl(var(--nashlo-orange))]" />
              <span className="text-sm font-medium text-zinc-700">Активировать после сохранения</span>
            </label>
          </div>

          {message && <p className="mt-4 rounded-2xl bg-[hsl(var(--nashlo-orange)/0.08)] px-4 py-3 text-sm text-[hsl(var(--nashlo-orange))]">{message}</p>}

          <button type="submit" className="mt-5 w-full rounded-2xl bg-[hsl(var(--nashlo-orange))] px-5 py-3 text-sm font-semibold text-white">
            Сохранить рекламу
          </button>
        </form>

        <section className="rounded-[28px] border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-100 px-5 py-4">
            <h2 className="font-semibold text-zinc-950">Все размещения</h2>
            <p className="mt-1 text-sm text-zinc-500">Активный слот сразу меняет карточку на главной странице.</p>
          </div>
          {ads.length === 0 ? (
            <div className="px-5 py-16 text-center text-zinc-400">
              <p className="text-4xl">↗</p>
              <p className="mt-3 font-medium">Реклам пока нет</p>
              <p className="mt-1 text-sm">Создайте первое размещение и включите его.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {ads.map((ad) => {
                const slot = adSlots.find((item) => item.id === ad.slot)
                return (
                  <article key={ad.id} className="grid gap-4 px-5 py-4 xl:grid-cols-[120px_minmax(0,1fr)_180px] xl:items-center">
                    <div className="h-24 overflow-hidden rounded-2xl bg-zinc-100">
                      {ad.image ? <img src={ad.image} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-2xl text-zinc-300">♥</div>}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold text-zinc-950">{ad.title}</p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ad.active ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
                          {ad.active ? "Активна" : "Выключена"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-zinc-500">{ad.advertiser} · {slot?.label} · {slot?.size}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{ad.subtitle}</p>
                      <p className="mt-1 text-xs text-zinc-300">{ad.startsAt} — {ad.endsAt} · {ad.erid}</p>
                    </div>
                    <div className="grid gap-2">
                      <button onClick={() => editAd(ad)} className="rounded-xl bg-zinc-950 px-3 py-2 text-xs font-semibold text-white">
                        Редактировать
                      </button>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => toggleAd(ad)} className="rounded-xl bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-700">
                          {ad.active ? "Выключить" : "Включить"}
                        </button>
                        <button onClick={() => deleteAd(ad.id)} className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
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
      </section>
    </div>
  )
}
