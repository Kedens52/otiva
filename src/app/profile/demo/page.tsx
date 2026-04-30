"use client"

import { useEffect, useState } from "react"
import { listings } from "@/lib/mock-marketplace"

type Profile = {
  name: string
  phone: string
  email: string
  city: string
  about: string
}

const defaultProfile: Profile = {
  name: "ANTONOV I",
  phone: "+7 900 000-00-00",
  email: "demo@otiva.ru",
  city: "Санкт-Петербург",
  about: "Графический дизайн, логотипы и аккуратные объявления на Otiva.",
}

const TOPUP_AMOUNTS = [300, 500, 1000, 2000, 5000]

const PROMO_PLANS = [
  { id: "top7",  label: "Поднять в топ",  days: 7,  price: 99,  desc: "7 дней в топе категории" },
  { id: "top14", label: "Выделить",       days: 14, price: 149, desc: "14 дней + выделение цветом" },
  { id: "turbo", label: "Турбо-продажа", days: 30, price: 299, desc: "30 дней + все форматы" },
]

type ActivePromo = { listingId: string; planId: string; until: string }
type ActiveSellerCabinet = { planId: string; until: string }

const DEMO_START_BALANCE = 500
const SELLER_CABINET_PLAN = {
  id: "seller-pro",
  label: "Кабинет продавца Pro",
  price: 499,
  days: 30,
  desc: "Мониторинг объявлений, динамика спроса и подсказки по продвижению",
}

function loadBalance(): number {
  if (typeof window === "undefined") return DEMO_START_BALANCE
  const raw = localStorage.getItem("otiva-balance")
  if (raw === null) {
    localStorage.setItem("otiva-balance", String(DEMO_START_BALANCE))
    return DEMO_START_BALANCE
  }
  return Number(raw)
}

function loadPromos(): ActivePromo[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem("otiva-promos") || "[]") } catch { return [] }
}

function loadSellerCabinet(): ActiveSellerCabinet | null {
  if (typeof window === "undefined") return null
  try { return JSON.parse(localStorage.getItem("otiva-seller-cabinet") || "null") } catch { return null }
}

export default function DemoProfilePage() {
  const [profile, setProfile] = useState(defaultProfile)
  const [isEditing, setIsEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [balance, setBalance] = useState(DEMO_START_BALANCE)
  const [promos, setPromos] = useState<ActivePromo[]>([])
  const [sellerCabinet, setSellerCabinet] = useState<ActiveSellerCabinet | null>(null)
  const [topupOpen, setTopupOpen] = useState(false)
  const [promoOpen, setPromoOpen] = useState<string | null>(null)
  const [toast, setToast] = useState("")

  useEffect(() => {
    const stored = localStorage.getItem("otiva-demo-user")
    if (stored) setProfile({ ...defaultProfile, ...JSON.parse(stored) })
    setBalance(loadBalance())
    setPromos(loadPromos())
    setSellerCabinet(loadSellerCabinet())
  }, [])

  function saveBalance(v: number) {
    setBalance(v)
    localStorage.setItem("otiva-balance", String(v))
  }

  function savePromos(p: ActivePromo[]) {
    setPromos(p)
    localStorage.setItem("otiva-promos", JSON.stringify(p))
  }

  function saveSellerCabinet(p: ActiveSellerCabinet | null) {
    setSellerCabinet(p)
    if (p) localStorage.setItem("otiva-seller-cabinet", JSON.stringify(p))
    else localStorage.removeItem("otiva-seller-cabinet")
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(""), 3000)
  }

  function updateField(field: keyof Profile, value: string) {
    setProfile((c) => ({ ...c, [field]: value }))
    setSaved(false)
  }

  function saveProfile() {
    localStorage.setItem("otiva-demo-user", JSON.stringify(profile))
    setIsEditing(false)
    setSaved(true)
  }

  function topup(amount: number) {
    saveBalance(balance + amount)
    setTopupOpen(false)
    showToast("Пополнено на " + amount + " ₽")
  }

  function buyPromo(listingId: string, plan: typeof PROMO_PLANS[0]) {
    if (balance < plan.price) {
      setPromoOpen(null)
      setTopupOpen(true)
      showToast("Недостаточно средств — пополните баланс")
      return
    }
    const until = new Date(Date.now() + plan.days * 86400000).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })
    saveBalance(balance - plan.price)
    savePromos([...promos.filter((p) => p.listingId !== listingId), { listingId, planId: plan.id, until }])
    setPromoOpen(null)
    showToast("Продвижение активно до " + until)
  }

  function cancelPromo(listingId: string) {
    savePromos(promos.filter((p) => p.listingId !== listingId))
    showToast("Продвижение отключено")
  }

  function buySellerCabinet() {
    if (balance < SELLER_CABINET_PLAN.price) {
      setTopupOpen(true)
      showToast("Недостаточно средств — пополните баланс")
      return
    }
    const until = new Date(Date.now() + SELLER_CABINET_PLAN.days * 86400000).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })
    saveBalance(balance - SELLER_CABINET_PLAN.price)
    saveSellerCabinet({ planId: SELLER_CABINET_PLAN.id, until })
    showToast("Кабинет продавца активен до " + until)
  }

  function cancelSellerCabinet() {
    saveSellerCabinet(null)
    showToast("Кабинет продавца отключен")
  }

  const myListings = listings.slice(0, 4)
  const listingViews = [3706, 1290, 842, 515]
  const listingFavorites = [1763, 428, 219, 96]
  const listingChats = [34, 18, 9, 5]
  const totalViews = myListings.reduce((sum, _listing, index) => sum + (listingViews[index] || 0), 0)
  const totalFavorites = myListings.reduce((sum, _listing, index) => sum + (listingFavorites[index] || 0), 0)
  const totalChats = myListings.reduce((sum, _listing, index) => sum + (listingChats[index] || 0), 0)
  const conversion = totalViews ? Math.round((totalChats / totalViews) * 1000) / 10 : 0
  const sellerCabinetActive = Boolean(sellerCabinet)
  const monitoredListings = myListings.map((listing, index) => {
    const views = listingViews[index] || 0
    const favorites = listingFavorites[index] || 0
    const chats = listingChats[index] || 0
    const demand = views > 2500 ? "Высокий" : views > 900 ? "Средний" : "Нужен буст"
    const recommendation = chats < 10 ? "Поднять в топ" : favorites > 300 ? "Ответить покупателям" : "Обновить описание"

    return { listing, views, favorites, chats, demand, recommendation }
  })
  const profileStats = [
    { value: "4.9", label: "рейтинг", hint: "21 отзыв" },
    { value: String(myListings.length), label: "активные объявления", hint: `${promos.length} продвигается` },
    { value: totalViews.toLocaleString("ru-RU"), label: "просмотры", hint: "за 30 дней" },
    { value: totalFavorites.toLocaleString("ru-RU"), label: "в избранном", hint: "по всем объявлениям" },
    { value: String(totalChats), label: "новые чаты", hint: "за месяц" },
    { value: `${conversion}%`, label: "конверсия", hint: "из просмотра в чат" },
    { value: `${balance.toLocaleString("ru-RU")} ₽`, label: "баланс", hint: "демо-счет" },
    { value: promos.length ? String(promos.length) : "0", label: "продвижения", hint: promos.length ? "активны" : "не запущены" },
    { value: sellerCabinetActive ? "Pro" : "Нет", label: "кабинет продавца", hint: sellerCabinetActive ? `до ${sellerCabinet?.until}` : "не подключен" },
  ]

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[200] w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 rounded-2xl bg-zinc-950 px-5 py-3 text-center text-sm font-medium text-white shadow-xl">
          {toast}
        </div>
      )}

      {/* Topup modal */}
      {topupOpen && (
        <div
          className="fixed inset-0 z-[190] flex items-center justify-center bg-zinc-950/50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setTopupOpen(false) }}
        >
          <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5">
              <div>
                <h3 className="text-xl font-semibold text-zinc-950">Пополнить баланс</h3>
                <p className="mt-0.5 text-sm text-zinc-500">Сейчас: {balance} ₽</p>
              </div>
              <button onClick={() => setTopupOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200">✕</button>
            </div>
            <div className="p-6">
              <p className="mb-3 text-sm font-medium text-zinc-600">Выберите сумму</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {TOPUP_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => topup(amt)}
                    className="rounded-2xl border-2 border-zinc-200 py-3.5 text-sm font-bold text-zinc-950 transition hover:border-[hsl(var(--otiva-orange))] hover:bg-[hsl(var(--otiva-orange)/0.08)] hover:text-[hsl(var(--otiva-orange))]"
                  >
                    {amt} ₽
                  </button>
                ))}
              </div>
              <p className="mt-4 rounded-2xl bg-zinc-50 px-4 py-3 text-xs text-zinc-500">
                Демо-режим: средства зачисляются мгновенно без реальной оплаты.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Promo modal */}
      {promoOpen && (
        <div
          className="fixed inset-0 z-[190] flex items-center justify-center bg-zinc-950/50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setPromoOpen(null) }}
        >
          <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5">
              <div>
                <h3 className="text-xl font-semibold text-zinc-950">Продвижение</h3>
                <p className="mt-0.5 text-sm text-zinc-500">Баланс: {balance} ₽</p>
              </div>
              <button onClick={() => setPromoOpen(null)} className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200">✕</button>
            </div>
            <div className="space-y-2 p-6">
              {PROMO_PLANS.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => buyPromo(promoOpen, plan)}
                  className="flex w-full flex-col gap-3 rounded-2xl border-2 border-zinc-200 p-4 text-left transition hover:border-[hsl(var(--otiva-orange))] hover:bg-[hsl(var(--otiva-orange)/0.05)] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-zinc-950">{plan.label}</p>
                    <p className="mt-0.5 text-sm text-zinc-500">{plan.desc}</p>
                  </div>
                  <span className="ml-4 shrink-0 text-xl font-bold text-[hsl(var(--otiva-orange))]">{plan.price} ₽</span>
                </button>
              ))}
              <p className="pt-1 text-xs text-zinc-400">Демо: деньги списываются с баланса без реальной транзакции.</p>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl overflow-x-hidden px-4 pb-28 pt-6 sm:pt-8 lg:py-10">
        <section className="lg:hidden">
          <div className="rounded-[30px] bg-zinc-950 p-5 text-white shadow-2xl shadow-zinc-950/20">
            <div className="flex items-center justify-between">
              <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl">↗</button>
              <h1 className="text-lg font-semibold">Профиль</h1>
              <div className="flex items-center gap-2">
                <button type="button" className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[hsl(var(--otiva-orange))]" />
                  🔔
                </button>
                <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">⚙</button>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-3xl font-semibold">{profile.name}</p>
              <p className="mt-2 text-sm leading-6 text-white/70">На Otiva с 2026 года · частное лицо</p>
              <p className="mt-1 text-sm text-white/70">Номер профиля 431 774 093</p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-3xl bg-white/10 p-4">
                <p className="text-2xl font-semibold">4,9 ★</p>
                <p className="mt-1 text-sm text-white/55">21 отзыв</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-4">
                <p className="text-lg font-semibold">Уровень сервиса</p>
                <p className="mt-1 text-sm text-white/55">Отвечает за 12 минут</p>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-[28px] bg-zinc-100 p-4">
            <div className="flex items-center justify-between rounded-3xl bg-white p-4 shadow-sm">
              <div>
                <p className="text-2xl font-semibold text-zinc-950">{balance.toLocaleString("ru-RU")} ₽</p>
                <p className="mt-1 text-sm text-zinc-500">Otiva Кошелек</p>
              </div>
              <button onClick={() => setTopupOpen(true)} className="rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white">
                Пополнить
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-3xl bg-gradient-to-br from-[hsl(var(--otiva-blue))] to-zinc-950 p-4 text-white">
                <p className="text-2xl font-semibold">0 Б</p>
                <p className="mt-1 text-sm text-white/70">1 бонус = 1 ₽</p>
              </div>
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <p className="text-lg font-semibold text-zinc-950">Деньги взаймы</p>
                <p className="mt-1 text-sm text-zinc-500">И еще 5 продуктов</p>
              </div>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-[28px] border border-zinc-200 bg-white">
            {[
              { title: "Мои объявления", desc: `${myListings.length} активных`, href: "/my-listings" },
              { title: "Заказы", desc: "Пока пусто", href: "#" },
              { title: "Управление профилем", desc: "Данные, проверки и настройки", href: "#profile-form-mobile" },
              { title: "Кабинет продавца", desc: sellerCabinetActive ? `Pro до ${sellerCabinet?.until}` : "Мониторинг объявлений", href: "#seller-cabinet-mobile" },
              { title: "Портал призов", desc: "Скоро будут розыгрыши", href: "#" },
              { title: "Приглашайте друзей", desc: "Забирайте бонусы и рубли", href: "#" },
            ].map((item) => (
              <a key={item.title} href={item.href} className="flex items-center justify-between gap-4 border-b border-zinc-100 px-4 py-4 last:border-b-0">
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold text-zinc-950">{item.title}</p>
                  <p className="mt-0.5 truncate text-sm text-zinc-500">{item.desc}</p>
                </div>
                <span className="shrink-0 text-2xl text-zinc-300">›</span>
              </a>
            ))}
          </div>

          <div className="mt-4 rounded-[28px] border border-zinc-200 bg-white p-5">
            <h2 className="text-xl font-semibold text-zinc-950">Адреса</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">⌖ {profile.city}, пр-т Культуры, 22к1</p>
            <button type="button" className="mt-4 w-full rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-[hsl(var(--otiva-blue))]">
              Перейти к адресам
            </button>
          </div>
        </section>

        <section className="mt-6 grid min-w-0 gap-6 lg:mt-0 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-8">
          {/* Sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
            {/* Profile card */}
            <div className="min-w-0 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:rounded-[32px] sm:p-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[hsl(var(--otiva-orange))] text-3xl font-semibold text-white sm:h-24 sm:w-24">
                {profile.name.slice(0, 1) || "O"}
              </div>
              <h1 className="mt-4 break-words text-xl font-semibold tracking-tight text-zinc-950">{profile.name}</h1>
              <p className="mt-0.5 break-words text-sm text-zinc-500">{profile.city}</p>
              <p className="mt-3 break-words text-sm leading-6 text-zinc-600">{profile.about}</p>
              <div className="mt-4 rounded-2xl bg-[hsl(var(--otiva-mint)/0.12)] px-4 py-2.5 text-sm font-semibold leading-5 text-[hsl(var(--otiva-mint))]">
                Профиль подтвержден
              </div>
            </div>

            {/* Balance card */}
            <div className="min-w-0 rounded-[28px] border-2 border-zinc-200 bg-white p-5 shadow-sm sm:rounded-[32px] sm:p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Баланс</p>
                <span className="rounded-full bg-[hsl(var(--otiva-mint)/0.12)] px-2.5 py-1 text-xs font-semibold text-[hsl(var(--otiva-mint))]">Демо</span>
              </div>
              <p className="mt-3 text-4xl font-bold tracking-tight text-zinc-950 sm:text-5xl">
                {balance} <span className="text-3xl font-semibold text-zinc-400">₽</span>
              </p>
              <button
                onClick={() => setTopupOpen(true)}
                className="mt-4 w-full rounded-2xl bg-[hsl(var(--otiva-orange))] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(var(--otiva-orange)/0.9)]"
              >
                + Пополнить
              </button>
              {promos.length > 0 && (
                <div className="mt-4 space-y-2 border-t border-zinc-100 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Активные продвижения</p>
                  {promos.map((p) => {
                    const plan = PROMO_PLANS.find((pl) => pl.id === p.planId)
                    const listing = myListings.find((l) => l.id === p.listingId)
                    return (
                      <div key={p.listingId} className="min-w-0 rounded-2xl bg-[hsl(var(--otiva-orange)/0.07)] px-3 py-2.5 text-xs">
                        <p className="truncate font-semibold text-zinc-950">{listing?.title || "Объявление"}</p>
                        <p className="mt-0.5 text-zinc-500">{plan?.label} · до {p.until}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </aside>

          {/* Main */}
          <section className="flex min-w-0 flex-col gap-6">
            {/* Profile form */}
            <div id="profile-form-mobile" className="order-4 min-w-0 rounded-[28px] border border-zinc-200 bg-zinc-50 p-5 shadow-inner sm:rounded-[32px] sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">Профиль</h2>
                  <p className="mt-1 text-sm text-zinc-500">Данные продавца сохраняются локально в браузере.</p>
                </div>
                <button
                  onClick={() => (isEditing ? saveProfile() : setIsEditing(true))}
                  className="w-full rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 sm:w-auto"
                >
                  {isEditing ? "Сохранить" : "Редактировать"}
                </button>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-zinc-600">Имя</span>
                  <input disabled={!isEditing} value={profile.name} onChange={(e) => updateField("name", e.target.value)} className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none disabled:bg-zinc-100" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-zinc-600">Телефон</span>
                  <input disabled={!isEditing} value={profile.phone} onChange={(e) => updateField("phone", e.target.value)} className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none disabled:bg-zinc-100" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-zinc-600">Email</span>
                  <input disabled={!isEditing} value={profile.email} onChange={(e) => updateField("email", e.target.value)} className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none disabled:bg-zinc-100" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-zinc-600">Город</span>
                  <input disabled={!isEditing} value={profile.city} onChange={(e) => updateField("city", e.target.value)} className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none disabled:bg-zinc-100" />
                </label>
                <label className="block md:col-span-2">
                  <span className="text-sm font-medium text-zinc-600">О себе</span>
                  <textarea disabled={!isEditing} value={profile.about} onChange={(e) => updateField("about", e.target.value)} className="mt-2 min-h-24 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none disabled:bg-zinc-100" />
                </label>
              </div>
              {saved && <p className="mt-4 text-sm font-medium text-[hsl(var(--otiva-mint))]">Изменения сохранены.</p>}
            </div>

            {/* Stats */}
            <section className="order-3 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:rounded-[32px] sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-zinc-950 sm:text-2xl">Статистика</h2>
                  <p className="mt-1 text-sm text-zinc-500">Полная демо-сводка по профилю и объявлениям.</p>
                </div>
                <span className="text-sm font-medium text-zinc-400">30 дней</span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {profileStats.map((stat) => (
                  <div key={stat.label} className="min-w-0 rounded-2xl bg-zinc-50 p-4">
                    <p className="truncate text-2xl font-semibold text-zinc-950">{stat.value}</p>
                    <p className="mt-1 truncate text-sm font-medium text-zinc-600">{stat.label}</p>
                    <p className="mt-2 truncate text-xs text-zinc-400">{stat.hint}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Seller cabinet */}
            <section id="seller-cabinet-mobile" className="order-2 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:rounded-[32px] sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold text-zinc-950 sm:text-2xl">Кабинет продавца</h2>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${sellerCabinetActive ? "bg-[hsl(var(--otiva-mint)/0.12)] text-[hsl(var(--otiva-mint))]" : "bg-zinc-100 text-zinc-500"}`}>
                      {sellerCabinetActive ? "Pro активен" : "Платный доступ"}
                    </span>
                  </div>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">
                    Следите за объявлениями, спросом, чатами и рекомендациями по продвижению в одном месте.
                  </p>
                </div>
                <div className="shrink-0 rounded-3xl bg-zinc-50 p-4 lg:w-72">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-zinc-950">{SELLER_CABINET_PLAN.label}</p>
                      <p className="mt-1 text-xs leading-5 text-zinc-500">{SELLER_CABINET_PLAN.desc}</p>
                    </div>
                    <p className="shrink-0 text-lg font-bold text-zinc-950">{SELLER_CABINET_PLAN.price} ₽</p>
                  </div>
                  {sellerCabinetActive ? (
                    <div className="mt-4">
                      <p className="rounded-2xl bg-white px-3 py-2 text-sm font-medium text-zinc-600">
                        Активен до {sellerCabinet?.until}
                      </p>
                      <button onClick={cancelSellerCabinet} className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-950">
                        Отключить
                      </button>
                    </div>
                  ) : (
                    <button onClick={buySellerCabinet} className="mt-4 w-full rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800">
                      Подключить на 30 дней
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-[hsl(var(--otiva-orange)/0.08)] p-4">
                  <p className="text-2xl font-semibold text-zinc-950">{sellerCabinetActive ? "+18%" : "Превью"}</p>
                  <p className="mt-1 text-sm text-zinc-600">динамика просмотров</p>
                </div>
                <div className="rounded-2xl bg-[hsl(var(--otiva-mint)/0.12)] p-4">
                  <p className="text-2xl font-semibold text-zinc-950">{totalChats}</p>
                  <p className="mt-1 text-sm text-zinc-600">контактов за месяц</p>
                </div>
                <div className="rounded-2xl bg-zinc-50 p-4">
                  <p className="text-2xl font-semibold text-zinc-950">{promos.length}</p>
                  <p className="mt-1 text-sm text-zinc-600">объявлений продвигается</p>
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-3xl border border-zinc-100">
                <div className="hidden grid-cols-[minmax(0,1.7fr)_0.7fr_0.7fr_0.7fr_1fr] gap-3 bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-400 lg:grid">
                  <span>Объявление</span>
                  <span>Просмотры</span>
                  <span>Избранное</span>
                  <span>Чаты</span>
                  <span>Рекомендация</span>
                </div>
                <div className="divide-y divide-zinc-100">
                  {monitoredListings.map((item) => (
                    <div key={item.listing.id} className="grid gap-3 px-4 py-4 lg:grid-cols-[minmax(0,1.7fr)_0.7fr_0.7fr_0.7fr_1fr] lg:items-center">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-zinc-950">{item.listing.title}</p>
                        <p className="mt-1 text-sm text-zinc-500">{item.demand} спрос</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-400 lg:hidden">Просмотры</p>
                        <p className="font-semibold text-zinc-950">{sellerCabinetActive ? item.views.toLocaleString("ru-RU") : "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-400 lg:hidden">Избранное</p>
                        <p className="font-semibold text-zinc-950">{sellerCabinetActive ? item.favorites.toLocaleString("ru-RU") : "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-400 lg:hidden">Чаты</p>
                        <p className="font-semibold text-zinc-950">{sellerCabinetActive ? item.chats : "—"}</p>
                      </div>
                      <div className="min-w-0">
                        <span className="inline-flex max-w-full rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-600">
                          <span className="truncate">{sellerCabinetActive ? item.recommendation : "Откройте полный отчет"}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </section>
        </section>
      </main>
    </>
  )
}
