"use client"

import Link from "next/link"
import { ChangeEvent, useEffect, useMemo, useState } from "react"
import { adSlots, loadManagedAds, saveManagedAds, type ManagedAd } from "@/lib/ad-store"

const ADVERTISER_EMAIL_KEY = "nashlo-advertiser-email"
const ADVERTISER_NAME_KEY = "nashlo-advertiser-name"

const statusLabels: Record<NonNullable<ManagedAd["status"]>, string> = {
  draft: "Черновик",
  pending: "На модерации",
  approved: "Одобрена",
  rejected: "Отклонена",
}

const statusClass: Record<NonNullable<ManagedAd["status"]>, string> = {
  draft: "bg-zinc-100 text-zinc-600",
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-600",
}

function formatDate(value: string) {
  if (!value) return "не задано"
  return new Date(value).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })
}

function getStats(ad: ManagedAd) {
  const views = ad.impressions || 0
  const clicks = ad.clicks || 0
  const ctr = views ? `${((clicks / views) * 100).toFixed(1)}%` : "0%"

  return { views, clicks, ctr }
}

export default function AdvertiserCabinetPage() {
  const [ads, setAds] = useState<ManagedAd[]>([])
  const [email, setEmail] = useState("")
  const [loginEmail, setLoginEmail] = useState("")
  const [name, setName] = useState("Рекламодатель")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const savedEmail = localStorage.getItem(ADVERTISER_EMAIL_KEY) || ""
    const savedName = localStorage.getItem(ADVERTISER_NAME_KEY) || "Рекламодатель"

    setEmail(savedEmail)
    setLoginEmail(savedEmail)
    setName(savedName)
    setAds(loadManagedAds())

    function reload() {
      setAds(loadManagedAds())
    }

    window.addEventListener("nashlo-ads-change", reload)
    window.addEventListener("storage", reload)
    return () => {
      window.removeEventListener("nashlo-ads-change", reload)
      window.removeEventListener("storage", reload)
    }
  }, [])

  const campaigns = useMemo(() => {
    const normalizedEmail = email.trim().toLowerCase()

    return ads
      .filter((ad) => ad.ownerEmail?.toLowerCase() === normalizedEmail)
      .sort((a, b) => Number(b.active) - Number(a.active) || b.startsAt.localeCompare(a.startsAt))
  }, [ads, email])

  function persist(next: ManagedAd[], success = "Сохранено") {
    setAds(next)
    saveManagedAds(next)
    setMessage(success)
  }

  function login() {
    const normalizedEmail = loginEmail.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setMessage("Введите email, который указывали в заявке.")
      return
    }

    localStorage.setItem(ADVERTISER_EMAIL_KEY, normalizedEmail)
    setEmail(normalizedEmail)
    setMessage("")
  }

  function logout() {
    localStorage.removeItem(ADVERTISER_EMAIL_KEY)
    setEmail("")
    setLoginEmail("")
    setMessage("")
  }

  function updateCampaign(id: string, patch: Partial<ManagedAd>, success?: string) {
    persist(
      ads.map((ad) => (ad.id === id ? { ...ad, ...patch } : ad)),
      success
    )
  }

  function sendToModeration(ad: ManagedAd) {
    updateCampaign(
      ad.id,
      {
        status: "pending",
        active: false,
        moderationComment: "",
      },
      "Креатив отправлен модератору. Показы включит только админ после проверки."
    )
  }

  function handleImage(ad: ManagedAd, file: File | undefined) {
    if (!file) return

    if (file.size > 900_000) {
      setMessage("Файл слишком большой. Для демо используйте изображение до 900 КБ.")
      return
    }

    const reader = new FileReader()
    reader.onload = () => updateCampaign(ad.id, { image: String(reader.result), status: "draft", active: false }, "Изображение загружено. Отправьте креатив на модерацию.")
    reader.readAsDataURL(file)
  }

  if (!email) {
    return (
      <main className="mx-auto grid min-h-[70vh] max-w-6xl items-center px-4 py-10">
        <section className="grid gap-6 rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm lg:grid-cols-[1fr_420px] lg:p-10">
          <div className="flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--nashlo-orange))]">Кабинет рекламодателя</p>
            <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-zinc-950 sm:text-6xl">Управление рекламой отдельно от профиля</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-zinc-500">
              Войдите по email из заявки. Здесь рекламодатель загружает креатив, смотрит статус модерации и статистику. Запуск показов остается у администратора.
            </p>
          </div>

          <div className="rounded-[28px] bg-zinc-50 p-5">
            <h2 className="text-2xl font-semibold text-zinc-950">Войти в кабинет</h2>
            <label className="mt-5 block">
              <span className="text-sm font-medium text-zinc-600">Email из заявки</span>
              <input
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                type="email"
                placeholder="billing@example.ru"
                className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]"
              />
            </label>
            {message && <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm text-[hsl(var(--nashlo-orange))]">{message}</p>}
            <button onClick={login} className="mt-4 w-full rounded-2xl bg-[hsl(var(--nashlo-orange))] px-5 py-3 text-sm font-semibold text-white">
              Открыть кабинет
            </button>
            <Link href="/advertising" className="mt-3 block rounded-2xl bg-white px-5 py-3 text-center text-sm font-semibold text-zinc-950">
              Отправить новую заявку
            </Link>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 pb-28 lg:py-10">
      <section className="rounded-[32px] bg-zinc-950 p-6 text-white shadow-2xl shadow-zinc-950/15 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--nashlo-orange))]">Кабинет рекламодателя</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">{name}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65 sm:text-base">
              {email}. Загружайте материалы, отправляйте их на модерацию и следите за запуском рекламных мест.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/advertising" className="rounded-2xl bg-[hsl(var(--nashlo-orange))] px-5 py-3 text-sm font-semibold text-white">
              Новая заявка
            </Link>
            <button onClick={logout} className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15">
              Выйти
            </button>
          </div>
        </div>
      </section>

      {message && <div className="mt-5 rounded-2xl bg-[hsl(var(--nashlo-orange)/0.08)] px-4 py-3 text-sm font-medium text-[hsl(var(--nashlo-orange))]">{message}</div>}

      {campaigns.length === 0 ? (
        <section className="mt-6 rounded-[28px] border border-zinc-200 bg-white px-5 py-16 text-center shadow-sm">
          <p className="text-4xl">↗</p>
          <h2 className="mt-4 text-2xl font-semibold text-zinc-950">Заявок для этого email пока нет</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">Сначала отправьте заявку на рекламу. После этого она появится здесь как кампания на модерации.</p>
          <Link href="/advertising" className="mt-5 inline-flex rounded-2xl bg-[hsl(var(--nashlo-orange))] px-5 py-3 text-sm font-semibold text-white">
            Отправить заявку
          </Link>
        </section>
      ) : (
        <section className="mt-6 grid gap-5">
          {campaigns.map((ad) => {
            const slot = adSlots.find((item) => item.id === ad.slot)
            const status = ad.status || (ad.active ? "approved" : "draft")
            const stats = getStats(ad)

            return (
              <article key={ad.id} className="grid gap-5 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm lg:grid-cols-[minmax(0,1fr)_320px]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass[status]}`}>{ad.active ? "Активна" : statusLabels[status]}</span>
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-500">{slot?.label} · {slot?.size}</span>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
                    <div className="overflow-hidden rounded-3xl bg-zinc-100">
                      {ad.image ? (
                        <img src={ad.image} alt="" className="h-44 w-full object-cover md:h-full" />
                      ) : (
                        <div className="flex h-44 items-center justify-center text-center text-sm font-medium text-zinc-400 md:h-full">
                          Загрузите баннер
                        </div>
                      )}
                    </div>

                    <div className="grid gap-4">
                      <label className="block">
                        <span className="text-sm font-medium text-zinc-600">Заголовок</span>
                        <input value={ad.title} onChange={(event) => updateCampaign(ad.id, { title: event.target.value, status: "draft", active: false }, "")} className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]" />
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-zinc-600">Описание</span>
                        <textarea value={ad.subtitle} onChange={(event) => updateCampaign(ad.id, { subtitle: event.target.value, status: "draft", active: false }, "")} rows={3} className="mt-2 w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]" />
                      </label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block">
                          <span className="text-sm font-medium text-zinc-600">Кнопка</span>
                          <input value={ad.cta} onChange={(event) => updateCampaign(ad.id, { cta: event.target.value, status: "draft", active: false }, "")} className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]" />
                        </label>
                        <label className="block">
                          <span className="text-sm font-medium text-zinc-600">Ссылка</span>
                          <input value={ad.href} onChange={(event) => updateCampaign(ad.id, { href: event.target.value, status: "draft", active: false }, "")} className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]" />
                        </label>
                      </div>
                      <label className="block">
                        <span className="text-sm font-medium text-zinc-600">Баннер</span>
                        <input type="file" accept="image/*" onChange={(event: ChangeEvent<HTMLInputElement>) => handleImage(ad, event.target.files?.[0])} className="mt-2 block w-full text-sm text-zinc-500 file:mr-3 file:rounded-xl file:border-0 file:bg-zinc-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white" />
                      </label>
                    </div>
                  </div>
                </div>

                <aside className="rounded-3xl bg-zinc-50 p-4">
                  <h2 className="font-semibold text-zinc-950">Запуск и статистика</h2>
                  <div className="mt-4 grid grid-cols-3 gap-2 lg:grid-cols-1">
                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-xs text-zinc-400">Показы</p>
                      <p className="mt-1 text-xl font-semibold text-zinc-950">{stats.views.toLocaleString("ru-RU")}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-xs text-zinc-400">Переходы</p>
                      <p className="mt-1 text-xl font-semibold text-zinc-950">{stats.clicks.toLocaleString("ru-RU")}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-xs text-zinc-400">CTR</p>
                      <p className="mt-1 text-xl font-semibold text-zinc-950">{stats.ctr}</p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl bg-white p-3 text-sm leading-6 text-zinc-500">
                    <p><span className="font-medium text-zinc-950">Период:</span> {formatDate(ad.startsAt)} — {formatDate(ad.endsAt)}</p>
                    <p><span className="font-medium text-zinc-950">ERID:</span> {ad.erid}</p>
                    <p><span className="font-medium text-zinc-950">ОРД:</span> {ad.ordName}</p>
                    {ad.lastClickAt && <p><span className="font-medium text-zinc-950">Последний переход:</span> {formatDate(ad.lastClickAt)}</p>}
                  </div>
                  {ad.moderationComment && (
                    <div className="mt-3 rounded-2xl bg-red-50 p-3 text-sm leading-5 text-red-600">{ad.moderationComment}</div>
                  )}
                  <button onClick={() => sendToModeration(ad)} className="mt-4 w-full rounded-2xl bg-[hsl(var(--nashlo-orange))] px-5 py-3 text-sm font-semibold text-white">
                    Отправить на модерацию
                  </button>
                  <p className="mt-3 text-xs leading-5 text-zinc-400">Рекламодатель редактирует материалы. Активировать показы может только модератор в админке.</p>
                </aside>
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}
