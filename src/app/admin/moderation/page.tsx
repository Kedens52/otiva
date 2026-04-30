"use client"

import { useMemo, useState } from "react"
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton"
import { listings } from "@/lib/mock-marketplace"

type ModerationStatus = "На проверке" | "Одобрено" | "Отклонено" | "Автофильтр"

const filters = [
  { id: "contacts", title: "Контакты в описании", desc: "Телефоны, мессенджеры и внешние ссылки", enabled: true, level: "Высокий" },
  { id: "price", title: "Подозрительная цена", desc: "Цена сильно ниже рынка по категории", enabled: true, level: "Средний" },
  { id: "duplicates", title: "Дубликаты объявлений", desc: "Повтор названия, фото или описания", enabled: true, level: "Высокий" },
  { id: "words", title: "Стоп-слова", desc: "Запрещенные товары, обещания и спам", enabled: false, level: "Средний" },
]

const plugins = [
  { id: "vision", title: "Проверка изображений", desc: "Находит водяные знаки, запрещенные товары и дубли", enabled: true },
  { id: "risk", title: "Риск продавца", desc: "Считает риск по жалобам, скорости ответов и истории", enabled: true },
  { id: "geo", title: "Гео-антиспам", desc: "Ловит массовые публикации из разных городов", enabled: false },
]

export default function AdminModerationPage() {
  const queue = useMemo(
    () =>
      listings.slice(0, 6).map((listing, index) => ({
        ...listing,
        risk: index % 3 === 0 ? "Высокий" : index % 2 === 0 ? "Средний" : "Низкий",
        reason: index % 3 === 0 ? "Низкая цена и похожие фото" : index % 2 === 0 ? "Нужно проверить описание" : "Обычная проверка",
      })),
    [],
  )
  const [statuses, setStatuses] = useState<Record<string, ModerationStatus>>(
    Object.fromEntries(queue.map((item, index) => [item.id, index === 1 ? "Автофильтр" : "На проверке"])),
  )
  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>(
    Object.fromEntries(filters.map((filter) => [filter.id, filter.enabled])),
  )
  const [activePlugins, setActivePlugins] = useState<Record<string, boolean>>(
    Object.fromEntries(plugins.map((plugin) => [plugin.id, plugin.enabled])),
  )

  const pendingCount = Object.values(statuses).filter((status) => status === "На проверке" || status === "Автофильтр").length

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950">Панель модерации</h1>
          <p className="mt-3 max-w-2xl text-zinc-500">
            Ручная проверка объявлений, правила автофильтрации и подключаемые модули контроля площадки.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <AdminLogoutButton />
          <button className="rounded-2xl bg-[hsl(var(--otiva-orange))] px-5 py-3 text-sm font-semibold text-white shadow-sm">
            Сохранить правила
          </button>
        </div>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-4">
        {[
          [String(pendingCount), "в очереди"],
          ["18", "сработок фильтров"],
          ["96%", "авто-проверок"],
          ["7 мин", "среднее решение"],
        ].map(([value, label]) => (
          <div key={label} className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-3xl font-semibold text-zinc-950">{value}</p>
            <p className="mt-1 text-sm text-zinc-500">{label}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-[30px] border border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
            <div>
              <h2 className="text-2xl font-semibold text-zinc-950">Ручная очередь</h2>
              <p className="mt-1 text-sm text-zinc-500">Объявления, которые требуют решения модератора.</p>
            </div>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-semibold text-zinc-600">{pendingCount} активных</span>
          </div>

          <div className="divide-y divide-zinc-100">
            {queue.map((listing) => {
              const status = statuses[listing.id]
              return (
                <article key={listing.id} className="grid gap-4 px-5 py-5 xl:grid-cols-[96px_minmax(0,1fr)_180px] xl:items-center">
                  <div className="h-24 overflow-hidden rounded-2xl bg-gradient-to-br" style={{ background: listing.imageTone }}>
                    <img src={`/listings/${listing.category}.svg`} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-lg font-semibold text-zinc-950">{listing.title}</p>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${listing.risk === "Высокий" ? "bg-red-50 text-red-600" : listing.risk === "Средний" ? "bg-[hsl(var(--otiva-orange)/0.12)] text-[hsl(var(--otiva-orange))]" : "bg-[hsl(var(--otiva-mint)/0.12)] text-[hsl(var(--otiva-mint))]"}`}>
                        {listing.risk} риск
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">{listing.city} · {listing.price.toLocaleString("ru-RU")} ₽</p>
                    <p className="mt-2 text-sm text-zinc-600">{listing.reason}</p>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-500">{listing.description}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="rounded-2xl bg-zinc-100 px-3 py-2 text-center text-sm font-semibold text-zinc-600">{status}</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setStatuses((current) => ({ ...current, [listing.id]: "Одобрено" }))} className="rounded-2xl bg-zinc-950 px-3 py-2 text-sm font-semibold text-white">
                        Одобрить
                      </button>
                      <button onClick={() => setStatuses((current) => ({ ...current, [listing.id]: "Отклонено" }))} className="rounded-2xl bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-700">
                        Отклонить
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[30px] border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-semibold text-zinc-950">Автофильтры</h2>
            <div className="mt-5 space-y-3">
              {filters.map((filter) => (
                <label key={filter.id} className="block rounded-2xl bg-zinc-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-zinc-950">{filter.title}</p>
                      <p className="mt-1 text-sm leading-5 text-zinc-500">{filter.desc}</p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Уровень: {filter.level}</p>
                    </div>
                    <input checked={activeFilters[filter.id]} onChange={(event) => setActiveFilters((current) => ({ ...current, [filter.id]: event.target.checked }))} type="checkbox" className="mt-1 h-5 w-5 accent-[hsl(var(--otiva-orange))]" />
                  </div>
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-[30px] border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-semibold text-zinc-950">Плагины</h2>
            <div className="mt-5 space-y-3">
              {plugins.map((plugin) => (
                <label key={plugin.id} className="block rounded-2xl border border-zinc-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-zinc-950">{plugin.title}</p>
                      <p className="mt-1 text-sm leading-5 text-zinc-500">{plugin.desc}</p>
                    </div>
                    <input checked={activePlugins[plugin.id]} onChange={(event) => setActivePlugins((current) => ({ ...current, [plugin.id]: event.target.checked }))} type="checkbox" className="mt-1 h-5 w-5 accent-[hsl(var(--otiva-orange))]" />
                  </div>
                </label>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </main>
  )
}
