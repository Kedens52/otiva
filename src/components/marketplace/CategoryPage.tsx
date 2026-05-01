"use client"

import { useMemo, useState } from "react"
import { EmptyState } from "@/components/marketplace/EmptyState"
import { ListingCard } from "@/components/marketplace/ListingCard"
import { getCategoryBySlug, getListingsByCategory, type ListingCategory } from "@/lib/mock-marketplace"

type CategoryPageProps = {
  category: ListingCategory
}

const sortOptions = ["Сначала новые", "Дешевле", "Дороже"]

export function CategoryPage({ category }: CategoryPageProps) {
  const categoryInfo = getCategoryBySlug(category)
  const items = getListingsByCategory(category)
  const [query, setQuery] = useState("")
  const [city, setCity] = useState("Все города")
  const [tag, setTag] = useState("Все")
  const [sort, setSort] = useState(sortOptions[0])
  const [priceMax, setPriceMax] = useState("")

  const cities = useMemo(() => ["Все города", ...Array.from(new Set(items.map((item) => item.city)))], [items])
  const tags = useMemo(() => ["Все", ...Array.from(new Set(items.flatMap((item) => item.tags)))], [items])

  const filteredItems = useMemo(() => {
    const max = Number(priceMax.replace(/\D/g, ""))
    return items
      .filter((item) => {
        const searchText = `${item.title} ${item.subtitle} ${item.description}`.toLowerCase()
        const matchesQuery = searchText.includes(query.toLowerCase())
        const matchesCity = city === "Все города" || item.city === city
        const matchesTag = tag === "Все" || item.tags.includes(tag)
        const matchesPrice = !max || item.price <= max
        return matchesQuery && matchesCity && matchesTag && matchesPrice
      })
      .sort((a, b) => {
        if (sort === "Дешевле") return a.price - b.price
        if (sort === "Дороже") return b.price - a.price
        return Number(b.promoted) - Number(a.promoted)
      })
  }, [city, items, priceMax, query, sort, tag])

  if (!categoryInfo) return null

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 lg:py-10">
      <section className={`overflow-hidden rounded-[28px] bg-gradient-to-br ${categoryInfo.tone} p-5 text-white shadow-2xl shadow-zinc-950/15 sm:rounded-[36px] sm:p-10`}>
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-6xl">{categoryInfo.title}</h1>
          <p className="mt-3 text-sm leading-6 text-white/85 sm:mt-5 sm:text-lg sm:leading-8">{categoryInfo.caption}</p>
        </div>
      </section>

      {items.length > 0 ? (
        <section className="grid gap-6 py-6 lg:grid-cols-[280px_1fr] lg:py-10">
          <aside className="h-fit rounded-[28px] border border-zinc-200 bg-zinc-50 p-5 shadow-inner lg:sticky lg:top-24">
            <h2 className="text-lg font-semibold text-zinc-950">Фильтры</h2>
            <div className="mt-5 space-y-5">
              <label className="block">
                <span className="text-sm font-medium text-zinc-600">Что ищем</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]"
                  placeholder="Название или описание"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-zinc-600">Город</span>
                <select value={city} onChange={(event) => setCity(event.target.value)} className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none">
                  {cities.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-zinc-600">Цена до</span>
                <input
                  value={priceMax}
                  onChange={(event) => setPriceMax(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]"
                  placeholder="100 000 ₽"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-zinc-600">Сортировка</span>
                <select value={sort} onChange={(event) => setSort(event.target.value)} className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none">
                  {sortOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
              <div>
                <span className="text-sm font-medium text-zinc-600">Теги</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {tags.slice(0, 8).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setTag(item)}
                      className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                        tag === item ? "bg-zinc-950 text-white" : "bg-white text-zinc-600 shadow-sm hover:bg-zinc-100"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <section>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">Объявления</h2>
                <p className="mt-2 text-zinc-500">{filteredItems.length} из {categoryInfo.count} в демо-каталоге.</p>
              </div>
            </div>

            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredItems.map((item) => (
                  <ListingCard key={item.id} listing={item} href={item.category === "cars" ? `/cars/${item.id}` : `/listings/${item.id}`} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="Ничего не найдено"
                description="Попробуйте изменить город, цену или тег. Данные пока демо, поэтому выбор ограничен."
                actionLabel="Сбросить фильтры"
                actionHref={categoryInfo.href}
              />
            )}
          </section>
        </section>
      ) : (
        <EmptyState
          title="Раздел скоро наполнится"
          description="Категория уже есть в каталоге. Мок-объявления можно добавить следующим шагом."
          actionLabel="Вернуться в ленту"
          actionHref="/feed"
        />
      )}
    </main>
  )
}
