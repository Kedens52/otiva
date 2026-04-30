"use client"

import { useEffect, useMemo, useState } from "react"
import { marketplaceCategories, formatPrice } from "@/lib/mock-marketplace"

type DraftListing = {
  title: string
  category: string
  price: string
  city: string
  description: string
  contact: string
}

const emptyDraft: DraftListing = {
  title: "",
  category: "cars",
  price: "",
  city: "Санкт-Петербург",
  description: "",
  contact: "+7 ",
}

const FREE_SLOTS = 3
const LISTING_PACKS = [
  { id: "pack5",  slots: 5,  price: 199,  label: "Стартовый",  desc: "+5 объявлений" },
  { id: "pack15", slots: 15, price: 399,  label: "Стандарт",   desc: "+15 объявлений", popular: true },
  { id: "pack30", slots: 30, price: 699,  label: "Про",         desc: "+30 объявлений" },
]

export default function CreateListingPage() {
  const [draft, setDraft] = useState(emptyDraft)
  const [saved, setSaved] = useState(false)
  const [balance, setBalance] = useState(500)
  const [extraSlots, setExtraSlots] = useState(0)
  const [usedSlots, setUsedSlots] = useState(2) // demo: 2 active listings
  const [packToast, setPackToast] = useState("")

  useEffect(() => {
    const raw = localStorage.getItem("otiva-balance")
    if (raw) setBalance(Number(raw))
    const extra = localStorage.getItem("otiva-extra-slots")
    if (extra) setExtraSlots(Number(extra))
  }, [])

  function buyPack(pack: typeof LISTING_PACKS[0]) {
    if (balance < pack.price) { setPackToast("Недостаточно средств — пополните баланс в профиле"); setTimeout(() => setPackToast(""), 3000); return }
    const newBalance = balance - pack.price
    const newExtra = extraSlots + pack.slots
    setBalance(newBalance)
    setExtraSlots(newExtra)
    localStorage.setItem("otiva-balance", String(newBalance))
    localStorage.setItem("otiva-extra-slots", String(newExtra))
    setPackToast(`+${pack.slots} слотов добавлено!`)
    setTimeout(() => setPackToast(""), 3000)
  }

  const totalSlots = FREE_SLOTS + extraSlots
  const slotsLeft = Math.max(0, totalSlots - usedSlots)

  const selectedCategory = marketplaceCategories.find((category) => category.slug === draft.category)
  const pricePreview = useMemo(() => {
    const value = Number(draft.price.replace(/\D/g, ""))
    return value > 0 ? formatPrice(value) : "Цена"
  }, [draft.price])

  function updateField(field: keyof DraftListing, value: string) {
    setDraft((current) => ({ ...current, [field]: value }))
    setSaved(false)
  }

  function saveDraft() {
    window.localStorage.setItem("otiva-demo-listing", JSON.stringify(draft))
    setSaved(true)
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 lg:py-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="rounded-[32px] border border-zinc-200 bg-zinc-50 p-6 shadow-inner">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">Разместить объявление</h1>
              <p className="mt-2 text-sm text-zinc-500">Демо-форма без базы. Черновик сохраняется в браузере.</p>
            </div>
            <button onClick={saveDraft} className="rounded-2xl bg-[hsl(var(--otiva-blue))] px-5 py-3 text-sm font-semibold text-white hover:bg-[hsl(var(--otiva-blue)/0.9)]">
              Сохранить черновик
            </button>
          </div>

          <div className="mt-8 grid gap-5">
            <label>
              <span className="text-sm font-medium text-zinc-600">Название</span>
              <input value={draft.title} onChange={(event) => updateField("title", event.target.value)} className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-sm outline-none" placeholder="Например, BMW 5 Series 2021" />
            </label>

            <div className="grid gap-5 sm:grid-cols-3">
              <label>
                <span className="text-sm font-medium text-zinc-600">Категория</span>
                <select value={draft.category} onChange={(event) => updateField("category", event.target.value)} className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-sm outline-none">
                  {marketplaceCategories.map((category) => (
                    <option key={category.slug} value={category.slug}>
                      {category.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="text-sm font-medium text-zinc-600">Цена</span>
                <input value={draft.price} onChange={(event) => updateField("price", event.target.value)} className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-sm outline-none" placeholder="2500000" />
              </label>
              <label>
                <span className="text-sm font-medium text-zinc-600">Город</span>
                <input value={draft.city} onChange={(event) => updateField("city", event.target.value)} className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-sm outline-none" />
              </label>
            </div>

            <label>
              <span className="text-sm font-medium text-zinc-600">Описание</span>
              <textarea value={draft.description} onChange={(event) => updateField("description", event.target.value)} className="mt-2 min-h-40 w-full rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-sm outline-none" placeholder="Расскажите о состоянии, комплектации, документах и условиях сделки." />
            </label>

            <div>
              <span className="text-sm font-medium text-zinc-600">Фотографии</span>
              <div className="mt-2 grid gap-3 sm:grid-cols-4">
                {[1, 2, 3, 4].map((item) => (
                  <button key={item} className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white text-sm font-medium text-zinc-400 hover:border-zinc-950 hover:text-zinc-950">
                    + Фото
                  </button>
                ))}
              </div>
            </div>

            <label>
              <span className="text-sm font-medium text-zinc-600">Контактный телефон</span>
              <input value={draft.contact} onChange={(event) => updateField("contact", event.target.value)} className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-sm outline-none" />
            </label>
          </div>

          {saved && (
            <p className="mt-5 rounded-2xl bg-[hsl(var(--otiva-mint)/0.12)] px-4 py-3 text-sm font-medium text-[hsl(var(--otiva-mint))]">
              Черновик сохранен. Подключение к API можно добавить следующим шагом.
            </p>
          )}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-6">
          {/* Preview */}
          <div className="h-fit rounded-[32px] border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">Предпросмотр</p>
            <div className={`mt-4 h-52 rounded-3xl bg-gradient-to-br ${selectedCategory?.tone ?? "from-zinc-950 to-zinc-300"}`} />
            <h2 className="mt-5 text-xl font-semibold text-zinc-950">{draft.title || "Название объявления"}</h2>
            <p className="mt-2 text-lg font-semibold text-zinc-950">{pricePreview}</p>
            <p className="mt-1 text-sm text-zinc-500">{draft.city || "Город"}</p>
            <p className="mt-4 line-clamp-3 text-sm leading-6 text-zinc-600">
              {draft.description || "Описание объявления появится здесь. Покупателю важно быстро понять состояние, детали и условия сделки."}
            </p>
            <div className="mt-5 rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-medium text-zinc-700">
              Категория: {selectedCategory?.title}
            </div>
          </div>

          {/* Slots & Packages */}
          <div className="rounded-[32px] border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-zinc-950">Слоты для объявлений</p>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${slotsLeft === 0 ? "bg-red-100 text-red-600" : "bg-zinc-100 text-zinc-600"}`}>
                {usedSlots} / {totalSlots} использовано
              </span>
            </div>

            {/* Slot bar */}
            <div className="mt-3 flex gap-1">
              {Array.from({ length: Math.min(totalSlots, 12) }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full ${i < usedSlots ? "bg-zinc-950" : "bg-zinc-100"}`}
                />
              ))}
              {totalSlots > 12 && <span className="text-xs text-zinc-400 ml-1">+{totalSlots - 12}</span>}
            </div>

            {slotsLeft === 0 && (
              <p className="mt-3 text-xs text-red-500 font-medium">Бесплатные слоты закончились. Купите пакет, чтобы разместить ещё.</p>
            )}

            <p className="mt-4 mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">Пакеты объявлений</p>
            <div className="space-y-2">
              {LISTING_PACKS.map((pack) => (
                <div key={pack.id} className={`relative rounded-2xl border p-3 ${pack.popular ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-200 bg-zinc-50"}`}>
                  {pack.popular && (
                    <span className="absolute -top-2 right-4 rounded-full bg-[hsl(var(--otiva-orange))] px-2 py-0.5 text-[10px] font-bold text-white">
                      Популярный
                    </span>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className={`text-sm font-semibold ${pack.popular ? "text-white" : "text-zinc-950"}`}>{pack.label}</p>
                      <p className={`text-xs ${pack.popular ? "text-zinc-300" : "text-zinc-500"}`}>{pack.desc}</p>
                    </div>
                    <button
                      onClick={() => buyPack(pack)}
                      className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${pack.popular ? "bg-white text-zinc-950 hover:bg-zinc-100" : "bg-zinc-950 text-white hover:bg-zinc-800"}`}
                    >
                      {pack.price} ₽
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-3 text-xs text-zinc-400">
              Баланс: <span className="font-semibold text-zinc-700">{balance.toLocaleString("ru-RU")} ₽</span>
            </p>

            {packToast && (
              <p className="mt-2 rounded-xl bg-[hsl(var(--otiva-mint)/0.12)] px-3 py-2 text-xs font-semibold text-[hsl(var(--otiva-mint))]">
                {packToast}
              </p>
            )}
          </div>
        </aside>
      </div>
    </main>
  )
}
