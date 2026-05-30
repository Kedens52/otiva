"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  ArrowRight,
  ChevronDown,
  LayoutGrid,
  LineChart,
  MessageSquare,
  Play,
  Zap,
} from "lucide-react"
import { PAGE_CONTAINER_WIDE_CLASS } from "@/components/layout/PageContainer"
import { prepareAdvertisingPreview } from "@/lib/advertising-preview"
import { LEGAL_LINKS } from "@/lib/legal-meta"
import {
  AD_FAQ,
  AD_FORMATS,
  AD_STATS,
  CABINET_FEATURES,
  LAUNCH_STEPS,
  LIFE_SCENARIOS,
  SUCCESS_CASES,
} from "@/components/advertising/advertising-landing-data"

const rules = [
  "Минимальный срок размещения — 1 месяц.",
  "Проверяем бизнес, оффер, контакты и страницу перехода.",
  "Не принимаем вводящие в заблуждение офферы и запрещённые категории.",
  "Нужны данные рекламодателя, маркировка «Реклама», ERID и передача в ОРД.",
]

export function AdvertisingLanding() {
  const router = useRouter()
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [feedbackName, setFeedbackName] = useState("")
  const [feedbackEmail, setFeedbackEmail] = useState("")
  const [feedbackText, setFeedbackText] = useState("")
  const [feedbackStatus, setFeedbackStatus] = useState<"idle" | "loading" | "ok" | "error">("idle")
  const [feedbackError, setFeedbackError] = useState("")

  function openPreviewCabinet() {
    prepareAdvertisingPreview()
    router.push("/ad-cabinet")
  }

  async function submitFeedback() {
    setFeedbackStatus("loading")
    setFeedbackError("")
    try {
      const res = await fetch("/api/advertising/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: feedbackName.trim() || undefined,
          email: feedbackEmail.trim() || undefined,
          text: feedbackText.trim(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setFeedbackError(data.error || "Не удалось отправить")
        setFeedbackStatus("error")
        return
      }
      setFeedbackText("")
      setFeedbackStatus("ok")
    } catch {
      setFeedbackError("Не удалось отправить. Попробуйте позже.")
      setFeedbackStatus("error")
    }
  }

  return (
    <main className={`${PAGE_CONTAINER_WIDE_CLASS} py-6 pb-28 lg:py-10`}>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[32px] bg-zinc-950 px-6 py-10 text-white sm:px-10 sm:py-14 lg:py-16">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[hsl(var(--nashlo-orange))] opacity-20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-16 left-1/3 h-56 w-56 rounded-full bg-[hsl(var(--nashlo-blue))] opacity-15 blur-3xl"
          aria-hidden
        />
        <div className="relative grid gap-10 lg:grid-cols-[1fr_340px] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--nashlo-orange))]">
              Реклама на Нашло
            </p>
            <h1 className="mt-4 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Покажите бренд тем, кто уже ищет покупку
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/70">
              Баннеры и нативные форматы в ленте, на главной и в поиске. Кабинет рекламодателя, модерация и
              маркировка по правилам РФ — раздел открывается поэтапно.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={openPreviewCabinet}
                className="inline-flex items-center gap-2 rounded-2xl bg-[hsl(var(--nashlo-orange))] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition hover:brightness-105"
              >
                <Play className="h-4 w-4" />
                Запустить в кабинете
              </button>
              <a
                href="#feedback"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
              >
                Оставить заявку
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <p className="mt-4 text-xs text-white/45">
              Сейчас доступен предпросмотр кабинета. Тарифы и оплата — при полном запуске раздела.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <p className="inline-flex rounded-full bg-[hsl(var(--nashlo-orange))] px-3 py-1 text-xs font-semibold text-white">
              Ранний доступ
            </p>
            <p className="mt-4 text-lg font-semibold">Как будет запуск</p>
            <ol className="mt-4 space-y-3">
              {LAUNCH_STEPS.map((step, i) => (
                <li key={step} className="flex items-start gap-3 text-sm text-white/80">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-zinc-950">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mt-10 sm:mt-14">
        <h2 className="text-center text-2xl font-bold text-zinc-950 sm:text-3xl">
          Аудитория с намерением купить
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-6 text-zinc-600">
          Нашло — доска объявлений: пользователи приходят за товарами, услугами, авто и недвижимостью, а не
          «просто полистать ленту».
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {AD_STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-[24px] border border-zinc-200 bg-white p-5 text-center shadow-sm transition hover:border-orange-200 hover:shadow-md"
            >
              <p className="text-2xl font-bold text-[hsl(var(--nashlo-orange))]">{stat.value}</p>
              <p className="mt-2 text-sm leading-snug text-zinc-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Formats */}
      <section className="mt-14 sm:mt-16">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[hsl(var(--nashlo-orange))]">
              Форматы
            </p>
            <h2 className="mt-2 text-2xl font-bold text-zinc-950 sm:text-3xl">
              Рекламные решения под ваши задачи
            </h2>
          </div>
          <Link
            href="/legal/advertising-rules"
            className="text-sm font-medium text-zinc-600 underline underline-offset-2 hover:text-zinc-950"
          >
            Правила размещения →
          </Link>
        </div>
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {AD_FORMATS.map((format) => {
            const Icon = format.icon
            return (
              <article
                key={format.title}
                className="group flex flex-col rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-orange-200 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[hsl(var(--nashlo-orange))] transition group-hover:bg-[hsl(var(--nashlo-orange))] group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-bold text-zinc-950">{format.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-zinc-600">{format.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {format.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {/* Cabinet */}
      <section className="mt-14 rounded-[32px] bg-gradient-to-br from-orange-50 via-white to-zinc-50 p-6 sm:p-10 lg:mt-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[hsl(var(--nashlo-orange))]">
              Кабинет
            </p>
            <h2 className="mt-2 text-2xl font-bold text-zinc-950 sm:text-3xl">
              Управляйте рекламой в одном месте
            </h2>
            <p className="mt-4 text-sm leading-6 text-zinc-600">
              Отдельный кабинет рекламодателя: кампании, креативы, модерация и статистика — без смешения с
              личными объявлениями.
            </p>
            <button
              type="button"
              onClick={openPreviewCabinet}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              <LayoutGrid className="h-4 w-4" />
              Открыть кабинет
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {CABINET_FEATURES.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.title} className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
                  <Icon className="h-5 w-5 text-[hsl(var(--nashlo-orange))]" />
                  <p className="mt-3 font-semibold text-zinc-950">{feature.title}</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-600">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Capabilities strip */}
      <section className="mt-14 grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: LineChart,
            title: "Прогноз и отчёты",
            text: "Метрики кампании после запуска — показы, клики, статусы.",
          },
          {
            icon: Zap,
            title: "Быстрый старт",
            text: "Мастер создания: формат → креатив → аудитория → модерация.",
          },
          {
            icon: MessageSquare,
            title: "Поддержка",
            text: "Помощь с маркировкой, слотами и требованиями к медиа.",
          },
        ].map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.title}
              className="flex gap-4 rounded-[24px] border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
                <Icon className="h-5 w-5 text-zinc-700" />
              </div>
              <div>
                <p className="font-semibold text-zinc-950">{item.title}</p>
                <p className="mt-1 text-sm text-zinc-600">{item.text}</p>
              </div>
            </div>
          )
        })}
      </section>

      {/* Scenarios */}
      <section className="mt-14 sm:mt-16">
        <h2 className="text-2xl font-bold text-zinc-950 sm:text-3xl">
          Сценарии, где реклама работает
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-zinc-600">
          Пользователи приходят с конкретной задачей — реклама попадает в контекст поиска.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LIFE_SCENARIOS.map((scenario) => {
            const Icon = scenario.icon
            return (
              <div
                key={scenario.title}
                className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <Icon className="h-8 w-8 text-[hsl(var(--nashlo-orange))]" />
                <p className="mt-4 font-bold text-zinc-950">{scenario.title}</p>
                <p className="mt-1 text-sm text-zinc-600">{scenario.items}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Cases */}
      <section className="mt-14 sm:mt-16">
        <h2 className="text-2xl font-bold text-zinc-950 sm:text-3xl">Примеры размещений</h2>
        <p className="mt-2 text-sm text-zinc-500">Иллюстративные кейсы форматов при запуске раздела</p>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {SUCCESS_CASES.map((c) => (
            <div
              key={c.brand}
              className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-orange-200"
            >
              <p className="text-lg font-bold text-zinc-950">{c.brand}</p>
              <p className="mt-3 text-3xl font-bold text-[hsl(var(--nashlo-orange))]">{c.metric}</p>
              <p className="mt-2 text-sm text-zinc-500">{c.niche}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-14 sm:mt-16">
        <h2 className="text-2xl font-bold text-zinc-950 sm:text-3xl">Ответы на вопросы</h2>
        <div className="mt-6 divide-y divide-zinc-200 rounded-[28px] border border-zinc-200 bg-white shadow-sm">
          {AD_FAQ.map((item, index) => {
            const isOpen = openFaq === index
            return (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
                >
                  <span className="font-semibold text-zinc-950">{item.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-zinc-400 transition ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen && (
                  <p className="border-t border-zinc-100 px-5 pb-5 pt-0 text-sm leading-6 text-zinc-600 sm:px-6">
                    {item.a}
                  </p>
                )}
              </div>
            )
          })}
        </div>
        <p className="mt-4 text-sm text-zinc-500">
          Подробнее:{" "}
          <Link href={LEGAL_LINKS.advertisingOffer} className="font-medium text-zinc-800 underline">
            оферта на рекламу
          </Link>
          ,{" "}
          <Link href="/support" className="font-medium text-zinc-800 underline">
            поддержка
          </Link>
        </p>
      </section>

      {/* Feedback + sidebar */}
      <section id="feedback" className="mt-14 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:mt-16">
        <div className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[hsl(var(--nashlo-orange))]">
            Связаться
          </p>
          <h2 className="mt-2 text-2xl font-bold text-zinc-950">Заявка и пожелания</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            Расскажите о бренде, формате и сроках — или что улучшить в кабинете до запуска.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-zinc-600">Имя или компания</span>
              <input
                value={feedbackName}
                onChange={(e) => setFeedbackName(e.target.value)}
                placeholder="Необязательно"
                className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-zinc-600">Email</span>
              <input
                value={feedbackEmail}
                onChange={(e) => setFeedbackEmail(e.target.value)}
                type="email"
                placeholder="you@company.ru"
                className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-zinc-600">Сообщение *</span>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={5}
                placeholder="Формат, бюджет, города показа, пожелания по кабинету…"
                className="mt-2 w-full resize-none rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]"
              />
            </label>
          </div>
          {feedbackStatus === "ok" && (
            <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Спасибо! Вернёмся, когда откроем приём кампаний.
            </p>
          )}
          {feedbackStatus === "error" && feedbackError && (
            <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{feedbackError}</p>
          )}
          <button
            type="button"
            onClick={submitFeedback}
            disabled={feedbackStatus === "loading" || feedbackText.trim().length < 10}
            className="mt-4 rounded-2xl bg-[hsl(var(--nashlo-orange))] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-50"
          >
            {feedbackStatus === "loading" ? "Отправка…" : "Отправить"}
          </button>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-[28px] border border-amber-100 bg-amber-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Статус</p>
            <p className="mt-2 text-xl font-bold text-zinc-950">Раздел готовится</p>
            <p className="mt-2 text-sm text-zinc-600">
              Кабинет доступен для ознакомления. Оплата и автозапуск — позже.
            </p>
            <button
              type="button"
              onClick={openPreviewCabinet}
              className="mt-4 w-full rounded-2xl bg-zinc-950 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Кабинет рекламодателя
            </button>
          </div>
          <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-zinc-950">Условия</h3>
            <ul className="mt-3 space-y-2">
              {rules.map((rule) => (
                <li key={rule} className="rounded-xl bg-zinc-50 px-3 py-2 text-xs leading-5 text-zinc-600">
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>

      {/* Bottom CTA */}
      <section className="mt-14 rounded-[32px] bg-zinc-950 px-6 py-10 text-center text-white sm:px-10">
        <h2 className="text-2xl font-bold sm:text-3xl">Готовы протестировать кабинет?</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-white/65">
          Посмотрите мастер кампании и слоты размещения до старта продаж рекламы.
        </p>
        <button
          type="button"
          onClick={openPreviewCabinet}
          className="mt-6 inline-flex rounded-2xl bg-[hsl(var(--nashlo-orange))] px-8 py-3.5 text-sm font-semibold text-white transition hover:brightness-105"
        >
          Открыть кабинет бесплатно
        </button>
      </section>
    </main>
  )
}
