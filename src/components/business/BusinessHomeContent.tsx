"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  Building2,
  Factory,
  Handshake,
  Package,
  Search,
  ShieldCheck,
  Store,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react"
import { BUSINESS_CATEGORIES } from "@/lib/business/config"

const SEARCH_HINTS = [
  "поставщики",
  "оборудование",
  "франшиза",
  "готовый бизнес",
  "коммерческая недвижимость",
  "логистика",
  "упаковка",
  "производство",
]

const AUDIENCE = [
  { icon: Truck, title: "Поставщикам", text: "Опт и поставки для розницы и маркетплейсов" },
  { icon: Package, title: "Закупщикам", text: "Заявки и поиск надёжных партнёров" },
  { icon: Factory, title: "Производителям", text: "Контрактное производство и дистрибуция" },
  { icon: Store, title: "Владельцам бизнеса", text: "Продажа готового бизнеса и активов" },
  { icon: Handshake, title: "Франчайзерам", text: "Предложения по запуску сети" },
  { icon: Building2, title: "Компаниям услуг", text: "B2B-услуги для бизнеса" },
]

const TRUST = [
  "Проверка компаний",
  "Модерация B2B-объявлений",
  "Защита от фейков",
  "Роли сотрудников",
  "Безопасные коммуникации",
]

export function BusinessHomeContent() {
  const router = useRouter()
  const [query, setQuery] = useState("")

  function onSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    router.push(q ? `/business/listings?q=${encodeURIComponent(q)}` : "/business/listings")
  }

  return (
    <div className="space-y-10 pb-4">
      <section className="rounded-[28px] border border-white/80 bg-gradient-to-br from-white via-white to-orange-50/40 p-6 shadow-sm sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--nashlo-orange))]">
          B2B внутри Нашло
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">Нашло Бизнес</h1>
        <p className="mt-2 text-lg font-medium text-zinc-700">
          B2B-площадка для компаний, поставщиков, закупщиков и предпринимателей.
        </p>
        <p className="mt-3 max-w-2xl text-zinc-600">
          Размещайте оптовые предложения, ищите поставщиков, продавайте бизнес, оборудование, франшизы и находите
          заявки от компаний.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/business/register"
            className="rounded-xl bg-[hsl(var(--nashlo-orange))] px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_hsl(var(--nashlo-orange)/0.3)]"
          >
            Зарегистрировать бизнес
          </Link>
          <Link
            href="/business/create"
            className="rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-800"
          >
            Разместить B2B-объявление
          </Link>
          <Link
            href="/business/requests"
            className="rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-800"
          >
            Найти поставщика
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
        <form onSubmit={onSearch} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Что ищете для бизнеса?"
              className="w-full rounded-xl border border-zinc-200 py-3 pl-10 pr-4 text-base outline-none ring-[hsl(var(--nashlo-orange))] focus:border-[hsl(var(--nashlo-orange))] focus:ring-2"
            />
          </div>
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-zinc-950 px-6 py-3 text-sm font-semibold text-white"
          >
            Найти
          </button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {SEARCH_HINTS.map((hint) => (
            <button
              key={hint}
              type="button"
              onClick={() => {
                setQuery(hint)
                router.push(`/business/listings?q=${encodeURIComponent(hint)}`)
              }}
              className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-200"
            >
              {hint}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-zinc-950">Разделы</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {BUSINESS_CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={cat.href}
              className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm transition hover:border-[hsl(var(--nashlo-orange)/0.35)] hover:shadow-md"
            >
              <p className="font-semibold text-zinc-950">{cat.label}</p>
              <p className="mt-1 text-sm text-zinc-500">{cat.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-zinc-950">Для кого</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AUDIENCE.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-zinc-200/80 bg-white p-4">
              <Icon className="h-6 w-6 text-[hsl(var(--nashlo-orange))]" aria-hidden />
              <p className="mt-2 font-semibold text-zinc-950">{title}</p>
              <p className="mt-1 text-sm text-zinc-500">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-emerald-700" aria-hidden />
          <h2 className="text-lg font-semibold text-zinc-950">Доверие и безопасность</h2>
        </div>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {TRUST.map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-zinc-700">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-[24px] bg-zinc-950 px-6 py-10 text-center text-white sm:px-10">
        <TrendingUp className="mx-auto h-8 w-8 text-[hsl(var(--nashlo-orange))]" aria-hidden />
        <h2 className="mt-4 text-xl font-semibold sm:text-2xl">
          Начните работать с бизнес-аудиторией на Нашло
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-zinc-400">
          Отдельный кабинет, модерация компании и B2B-объявления без смешения с личным профилем.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/business/register"
            className="rounded-xl bg-[hsl(var(--nashlo-orange))] px-5 py-3 text-sm font-semibold text-white"
          >
            Зарегистрировать бизнес
          </Link>
          <Link
            href="/business/dashboard"
            className="rounded-xl border border-zinc-600 px-5 py-3 text-sm font-semibold text-white"
          >
            Перейти в кабинет бизнеса
          </Link>
        </div>
      </section>
    </div>
  )
}
