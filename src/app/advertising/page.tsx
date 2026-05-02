"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { createDefaultAd, loadManagedAds, saveManagedAds, type AdSlotId } from "@/lib/ad-store"

type AdPlan = {
  id: string
  title: string
  placement: string
  price: number
  reach: string
  description: string
  features: string[]
  popular?: boolean
}

type AdCabinet = {
  planId: string
  months: number
  startedAt: number
  endsAt: number
  brandName: string
  contact: string
  legalName: string
  advertiserType: string
  inn: string
  erid: string
  ordName: string
  adObject: string
  targetUrl: string
}

const STORAGE_KEY = "nashlo-ad-cabinet"
const MIN_MONTHS = 1
const DAY = 24 * 60 * 60 * 1000

const plans: AdPlan[] = [
  {
    id: "start",
    title: "Старт",
    placement: "Рекомендации и категория",
    price: 14900,
    reach: "до 18 000 показов",
    description: "Для локальных услуг, мастеров и продавцов, которым нужен аккуратный первый запуск.",
    features: ["1 рекламное место", "Показы в ленте и категории", "Проверка модератором", "Еженедельная статистика"],
  },
  {
    id: "city",
    title: "Город",
    placement: "Главная, город и категории",
    price: 34900,
    reach: "до 60 000 показов",
    description: "Оптимальный пакет для магазина, автосалона, застройщика или сервиса в одном городе.",
    features: ["2 рекламных места", "Главная лента", "Городская аудитория", "Отчёт по переходам"],
    popular: true,
  },
  {
    id: "brand",
    title: "Бренд",
    placement: "Премиум-размещение",
    price: 79900,
    reach: "до 160 000 показов",
    description: "Для заметного запуска, сезонной акции или крупного предложения с приоритетной проверкой.",
    features: ["3 рекламных места", "Верхние позиции", "Приоритетная модерация", "Персональный менеджер"],
  },
]

const rules = [
  "Минимальный срок размещения — 1 месяц. Короткие кампании не продаём, чтобы площадка не превращалась в случайную рекламу.",
  "Перед запуском проверяем бизнес, оффер, контакты, сайт или страницу, куда ведёт реклама.",
  "Не принимаем серые схемы, вводящие в заблуждение скидки, запрещённые товары, пирамиды и агрессивные креативы.",
  "Для интернет-рекламы нужны данные рекламодателя, ИНН, маркировка «Реклама», ERID и передача данных через ОРД.",
  "В демо-режиме заявка не списывает реальные деньги: после отправки открывается кабинет для проверки сценария.",
]

const moderationSteps = [
  "Контакты рекламодателя заполнены",
  "Данные рекламодателя и ИНН переданы",
  "ERID и ОРД указаны для маркировки",
  "Срок размещения не меньше 30 дней",
  "Креатив и предложение отправлены на ручную проверку",
  "Статистика будет обновляться ежедневно после запуска",
]

const requiredLegalChecks = [
  "Подтверждаю достоверность данных рекламодателя и ИНН.",
  "Подтверждаю, что реклама будет размещаться с пометкой «Реклама» и данными рекламодателя.",
  "Подтверждаю наличие ERID и передачу данных через ОРД до запуска.",
  "Подтверждаю, что оффер, товар или услуга не нарушают законодательство РФ.",
  "Согласен на ручную модерацию и отказ в размещении без объяснения деталей проверки.",
]

function formatPrice(value: number) {
  return `${new Intl.NumberFormat("ru-RU").format(value)} ₽`
}

function formatDate(value: number) {
  return new Date(value).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })
}

function readCabinet(): AdCabinet | null {
  if (typeof window === "undefined") return null

  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as AdCabinet | null
    if (!data?.planId || !data.startedAt || !data.endsAt) return null
    return data
  } catch {
    return null
  }
}

function slotByPlan(planId: string): AdSlotId {
  if (planId === "brand") return "sidebarTall"
  if (planId === "start") return "sidebarTop"
  return "leaderboard"
}

export default function AdvertisingPage() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState("city")
  const [months, setMonths] = useState(MIN_MONTHS)
  const [brandName, setBrandName] = useState("Мой бизнес")
  const [contact, setContact] = useState("+7 999 123-45-67")
  const [advertiserType, setAdvertiserType] = useState("Юридическое лицо")
  const [legalName, setLegalName] = useState("")
  const [inn, setInn] = useState("")
  const [ogrn, setOgrn] = useState("")
  const [legalAddress, setLegalAddress] = useState("")
  const [contactPerson, setContactPerson] = useState("")
  const [email, setEmail] = useState("")
  const [targetUrl, setTargetUrl] = useState("")
  const [adObject, setAdObject] = useState("")
  const [creativeDescription, setCreativeDescription] = useState("")
  const [erid, setErid] = useState("")
  const [ordName, setOrdName] = useState("")
  const [checks, setChecks] = useState<Record<string, boolean>>({})
  const [formError, setFormError] = useState("")
  const [cabinet, setCabinet] = useState<AdCabinet | null>(null)

  useEffect(() => {
    const savedCabinet = readCabinet()
    setCabinet(savedCabinet)
    if (savedCabinet) router.replace("/ad-cabinet")
  }, [router])

  const plan = plans.find((item) => item.id === selectedPlan) || plans[1]
  const activePlan = plans.find((item) => item.id === cabinet?.planId) || plans[1]
  const total = plan.price * months
  const daysLeft = cabinet ? Math.max(0, Math.ceil((cabinet.endsAt - Date.now()) / DAY)) : 0
  const progress = cabinet ? Math.min(100, Math.max(0, Math.round(((Date.now() - cabinet.startedAt) / (cabinet.endsAt - cabinet.startedAt)) * 100))) : 0

  const metrics = useMemo(() => {
    const base = activePlan.id === "brand" ? 96000 : activePlan.id === "city" ? 38400 : 12400

    return [
      { label: "Показы", value: base.toLocaleString("ru-RU"), hint: "+12% за неделю" },
      { label: "Переходы", value: Math.round(base * 0.042).toLocaleString("ru-RU"), hint: "CTR 4,2%" },
      { label: "Заявки", value: Math.round(base * 0.006).toLocaleString("ru-RU"), hint: "из рекламы" },
      { label: "Осталось", value: `${daysLeft} дн.`, hint: cabinet ? `до ${formatDate(cabinet.endsAt)}` : "" },
    ]
  }, [activePlan.id, cabinet, daysLeft])

  function saveCabinet(next: AdCabinet) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setCabinet(next)
  }

  function buy() {
    const requiredFields = [
      legalName,
      inn,
      ogrn,
      legalAddress,
      contactPerson,
      email,
      contact,
      targetUrl,
      adObject,
      creativeDescription,
      erid,
      ordName,
    ]
    const checksAccepted = requiredLegalChecks.every((item) => checks[item])

    if (requiredFields.some((value) => !value.trim()) || !checksAccepted) {
      setFormError("Заполните все обязательные поля по требованиям РФ и подтвердите условия размещения.")
      return
    }

    const innDigits = inn.replace(/\D/g, "")
    if (innDigits.length !== 10 && innDigits.length !== 12) {
      setFormError("ИНН должен содержать 10 цифр для организации или 12 цифр для ИП/физлица.")
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError("Укажите корректный email для документов.")
      return
    }

    if (!/^https?:\/\/\S+\.\S+/.test(targetUrl.trim())) {
      setFormError("Ссылка размещения должна начинаться с http:// или https://.")
      return
    }

    if (!/^erid[:\s-]*[a-z0-9]+$/i.test(erid.trim())) {
      setFormError("Укажите ERID в формате erid: xxxxx. Его нужно получить до запуска рекламы.")
      return
    }

    setFormError("")
    const safeMonths = Math.max(MIN_MONTHS, months)
    const now = Date.now()
    const startsAt = new Date(now).toISOString().slice(0, 10)
    const endsAt = new Date(now + safeMonths * 30 * DAY).toISOString().slice(0, 10)
    const ownerEmail = email.trim().toLowerCase()
    const ownerName = brandName.trim() || legalName.trim() || "Рекламодатель"
    const application = {
      ...createDefaultAd(slotByPlan(selectedPlan)),
      title: adObject.trim() || ownerName,
      subtitle: creativeDescription.trim(),
      cta: "Смотреть",
      href: targetUrl.trim(),
      advertiser: ownerName,
      active: false,
      startsAt,
      endsAt,
      erid: erid.trim(),
      ordName: ordName.trim(),
      ownerEmail,
      ownerName,
      status: "pending" as const,
      moderationComment: "",
    }

    saveCabinet({
      planId: selectedPlan,
      months: safeMonths,
      startedAt: now,
      endsAt: now + safeMonths * 30 * DAY,
      brandName: brandName.trim() || "Мой бизнес",
      contact: contact.trim() || "+7 999 123-45-67",
      legalName: legalName.trim(),
      advertiserType,
      inn: inn.trim(),
      erid: erid.trim(),
      ordName: ordName.trim(),
      adObject: adObject.trim(),
      targetUrl: targetUrl.trim(),
    })
    saveManagedAds([application, ...loadManagedAds()])
    localStorage.setItem("nashlo-advertiser-email", ownerEmail)
    localStorage.setItem("nashlo-advertiser-name", ownerName)
    router.push("/ad-cabinet")
  }

  function extend() {
    if (!cabinet) return

    saveCabinet({
      ...cabinet,
      months: cabinet.months + 1,
      endsAt: cabinet.endsAt + 30 * DAY,
    })
  }

  function resetDemo() {
    localStorage.removeItem(STORAGE_KEY)
    setCabinet(null)
  }

  if (cabinet) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-6 pb-28 lg:py-10">
        <section className="rounded-[32px] bg-zinc-950 p-5 text-white shadow-2xl shadow-zinc-950/15 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--nashlo-orange))]">Рекламный кабинет</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">{cabinet.brandName}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65 sm:text-base">
                {activePlan.title} · {activePlan.placement}. Заявка отправлена минимум на {cabinet.months} мес., поэтому кабинет открыт для проверки.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={extend} className="rounded-2xl bg-[hsl(var(--nashlo-orange))] px-5 py-3 text-sm font-semibold text-white">
                Продлить на месяц
              </button>
              <button onClick={resetDemo} className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15">
                Сбросить демо
              </button>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-zinc-500">{metric.label}</p>
              <p className="mt-2 text-3xl font-semibold text-zinc-950">{metric.value}</p>
              <p className="mt-1 text-xs text-zinc-400">{metric.hint}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-zinc-950">Кампания</h2>
                <p className="mt-1 text-sm text-zinc-500">В демо кабинет открывается сразу. В реальном запуске реклама сначала проходит ручную модерацию.</p>
              </div>
              <span className="w-fit rounded-full bg-[hsl(var(--nashlo-mint)/0.12)] px-3 py-1 text-xs font-semibold text-[hsl(var(--nashlo-mint))]">
                На проверке
              </span>
            </div>

            <div className="mt-6 overflow-hidden rounded-3xl border border-zinc-100">
              <div className="h-3 bg-zinc-100">
                <div className="h-full bg-[hsl(var(--nashlo-orange))]" style={{ width: `${progress}%` }} />
              </div>
              <div className="grid gap-4 p-5 md:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-400">Период</p>
                  <p className="mt-1 font-semibold text-zinc-950">{formatDate(cabinet.startedAt)} — {formatDate(cabinet.endsAt)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-400">Контакт</p>
                  <p className="mt-1 font-semibold text-zinc-950">{cabinet.contact}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-400">Стоимость</p>
                  <p className="mt-1 font-semibold text-zinc-950">{formatPrice(activePlan.price * cabinet.months)}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-zinc-50 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-400">Рекламодатель</p>
                <p className="mt-1 font-semibold text-zinc-950">{cabinet.legalName || cabinet.brandName}</p>
                <p className="mt-1 text-sm text-zinc-500">{cabinet.advertiserType || "Не указан"} · ИНН {cabinet.inn || "на проверке"}</p>
              </div>
              <div className="rounded-2xl bg-zinc-50 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-400">Маркировка</p>
                <p className="mt-1 font-semibold text-zinc-950">{cabinet.erid || "ERID на проверке"}</p>
                <p className="mt-1 text-sm text-zinc-500">{cabinet.ordName || "ОРД не указан"}</p>
              </div>
              <div className="rounded-2xl bg-zinc-50 p-4 md:col-span-2">
                <p className="text-xs uppercase tracking-wide text-zinc-400">Объект рекламы</p>
                <p className="mt-1 font-semibold text-zinc-950">{cabinet.adObject || "Ожидает проверки"}</p>
                <p className="mt-1 break-words text-sm text-zinc-500">{cabinet.targetUrl || "Ссылка не указана"}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {["Главная лента", "Категории", "Рекомендации"].map((place, index) => (
                <div key={place} className="rounded-2xl bg-zinc-50 p-4">
                  <p className="font-semibold text-zinc-950">{place}</p>
                  <p className="mt-1 text-sm text-zinc-500">{index === 0 ? "Подготовка к запуску" : "Ожидает креатив"}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="h-fit rounded-[28px] border border-zinc-200 bg-zinc-50 p-5">
            <h2 className="text-xl font-semibold text-zinc-950">Проверка перед запуском</h2>
            <div className="mt-4 space-y-3">
              {moderationSteps.map((step) => (
                <div key={step} className="flex gap-3 rounded-2xl bg-white p-3 text-sm text-zinc-600 shadow-sm">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--nashlo-orange))] text-xs font-semibold text-white">✓</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
            <button className="mt-5 w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-zinc-950 shadow-sm">
              Скачать счёт
            </button>
          </aside>
        </section>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 pb-28 lg:py-10">
      <section className="rounded-[32px] bg-zinc-950 p-6 text-white shadow-2xl shadow-zinc-950/15 sm:p-8 lg:p-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--nashlo-orange))]">Реклама на Нашло</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">Заявка на размещение рекламы</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/70">
              Реклама запускается минимум на 30 дней и только после ручной проверки. Так партнёрские размещения остаются полезными для людей и безопасными для проекта.
            </p>
          </div>
          <div className="rounded-3xl bg-white/8 p-4 text-sm leading-6 text-white/75">
            <p className="font-semibold text-white">Как проходит заявка</p>
            <div className="mt-3 grid gap-2">
              {["Выберите пакет", "Заполните данные РФ", "Отправьте на модерацию", "Админ включит рекламу"].map((step, index) => (
                <div key={step} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-zinc-950">{index + 1}</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-sm font-semibold text-white">1</span>
              <div>
                <h2 className="text-2xl font-semibold text-zinc-950">Контакты и рекламодатель</h2>
                <p className="mt-1 text-sm leading-6 text-zinc-500">Кто размещает рекламу и кто отвечает за документы.</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-zinc-600">Название бизнеса *</span>
                <input value={brandName} onChange={(event) => setBrandName(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-zinc-600">Контакт *</span>
                <input value={contact} onChange={(event) => setContact(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-zinc-600">Тип рекламодателя *</span>
                <select value={advertiserType} onChange={(event) => setAdvertiserType(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]">
                  <option>Юридическое лицо</option>
                  <option>ИП</option>
                  <option>Физическое лицо</option>
                  <option>Самозанятый</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-zinc-600">Юр. название / ФИО *</span>
                <input value={legalName} onChange={(event) => setLegalName(event.target.value)} placeholder="ООО «Пример» или Иванов И.И." className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-zinc-600">ИНН *</span>
                <input value={inn} onChange={(event) => setInn(event.target.value.replace(/\D/g, "").slice(0, 12))} inputMode="numeric" placeholder="10 или 12 цифр" className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-zinc-600">ОГРН / ОГРНИП / документ *</span>
                <input value={ogrn} onChange={(event) => setOgrn(event.target.value.slice(0, 32))} placeholder="Основной гос. номер или документ" className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]" />
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm font-medium text-zinc-600">Юридический адрес / адрес регистрации *</span>
                <input value={legalAddress} onChange={(event) => setLegalAddress(event.target.value)} placeholder="Город, улица, дом, офис" className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-zinc-600">Ответственное лицо *</span>
                <input value={contactPerson} onChange={(event) => setContactPerson(event.target.value)} placeholder="Имя и должность" className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-zinc-600">Email для документов *</span>
                <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="billing@example.ru" className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]" />
              </label>
            </div>
          </section>

          <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-sm font-semibold text-white">2</span>
              <div>
                <h2 className="text-2xl font-semibold text-zinc-950">Оффер и маркировка</h2>
                <p className="mt-1 text-sm leading-6 text-zinc-500">Данные для проверки рекламы, ERID и ОРД.</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-zinc-600">Ссылка размещения / сайт *</span>
                <input value={targetUrl} onChange={(event) => setTargetUrl(event.target.value)} placeholder="https://example.ru" className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-zinc-600">Объект рекламирования *</span>
                <input value={adObject} onChange={(event) => setAdObject(event.target.value)} placeholder="Товар, услуга, бренд или акция" className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]" />
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm font-medium text-zinc-600">Описание креатива и оффера *</span>
                <textarea value={creativeDescription} onChange={(event) => setCreativeDescription(event.target.value)} rows={4} placeholder="Что рекламируем, где будет вести кнопка, какие ограничения и дисклеймеры нужны" className="mt-2 w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-zinc-600">ERID *</span>
                <input value={erid} onChange={(event) => setErid(event.target.value)} placeholder="erid: LjN8K..." className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-zinc-600">ОРД *</span>
                <input value={ordName} onChange={(event) => setOrdName(event.target.value)} placeholder="Название оператора рекламных данных" className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]" />
              </label>
            </div>
          </section>

          <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-sm font-semibold text-white">3</span>
              <div>
                <h2 className="text-2xl font-semibold text-zinc-950">Подтверждения</h2>
                <p className="mt-1 text-sm leading-6 text-zinc-500">Без этих подтверждений заявка не уйдёт на проверку.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {requiredLegalChecks.map((item) => (
                <label key={item} className="flex gap-3 rounded-2xl bg-zinc-50 p-3 text-sm leading-5 text-zinc-600">
                  <input
                    type="checkbox"
                    checked={Boolean(checks[item])}
                    onChange={(event) => setChecks((current) => ({ ...current, [item]: event.target.checked }))}
                    className="mt-0.5 h-4 w-4 accent-[hsl(var(--nashlo-orange))]"
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
          <section className="rounded-[28px] border border-zinc-200 bg-zinc-50 p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-zinc-950">Пакет и срок</h2>
            <div className="mt-4 space-y-2">
              {plans.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedPlan(item.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${selectedPlan === item.id ? "border-zinc-950 bg-white shadow-sm" : "border-transparent bg-white/70 hover:bg-white"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-zinc-950">{item.title}</p>
                    {item.popular && <span className="rounded-full bg-[hsl(var(--nashlo-orange))] px-2.5 py-1 text-[11px] font-semibold text-white">Оптимально</span>}
                  </div>
                  <p className="mt-1 text-sm text-zinc-500">{item.placement}</p>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <p className="text-2xl font-semibold text-zinc-950">{formatPrice(item.price)}</p>
                    <p className="text-xs font-semibold text-[hsl(var(--nashlo-mint))]">{item.reach}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-5">
              <span className="text-sm font-medium text-zinc-600">Срок</span>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[1, 3, 6].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMonths(value)}
                    className={`rounded-2xl px-3 py-3 text-sm font-semibold transition ${months === value ? "bg-zinc-950 text-white" : "bg-white text-zinc-600"}`}
                  >
                    {value} мес.
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-zinc-400">Минимум: 1 месяц / 30 дней.</p>
            </div>

            <div className="mt-5 rounded-2xl bg-white p-4">
              <div className="flex items-center justify-between text-sm text-zinc-500">
                <span>{plan.title}</span>
                <span>{months} мес.</span>
              </div>
              <p className="mt-2 text-3xl font-semibold text-zinc-950">{formatPrice(total)}</p>
              <p className="mt-1 text-xs text-zinc-400">Это заявка на модерацию: оплата не списывается автоматически.</p>
            </div>

            {formError && (
              <div className="mt-4 rounded-2xl border border-[hsl(var(--nashlo-orange)/0.25)] bg-[hsl(var(--nashlo-orange)/0.08)] px-4 py-3 text-sm leading-5 text-[hsl(var(--nashlo-orange))]">
                {formError}
              </div>
            )}

            <button onClick={buy} className="mt-4 w-full rounded-2xl bg-[hsl(var(--nashlo-orange))] px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-[hsl(var(--nashlo-orange)/0.25)]">
              Отправить заявку
            </button>
          </section>

          <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-zinc-950">Условия</h2>
            <div className="mt-3 space-y-2">
              {rules.map((rule) => (
                <div key={rule} className="rounded-2xl bg-zinc-50 px-3 py-2 text-sm leading-5 text-zinc-600">
                  {rule}
                </div>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </main>
  )
}
