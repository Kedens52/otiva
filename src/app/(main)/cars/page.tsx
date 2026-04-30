"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { formatPrice, getListingsByCategory, type MarketplaceListing } from "@/lib/mock-marketplace"

const cars = getListingsByCategory("cars")
const sortOptions = ["Сначала новые", "Дешевле", "Дороже", "Пробег до 50 000"]

function CarCard({ car }: { car: MarketplaceListing }) {
  return (
    <Link
      href={`/cars/${car.id}`}
      className="group grid gap-4 rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-xl sm:grid-cols-[240px_1fr] xl:grid-cols-[260px_1fr_180px]"
    >
      <div className="relative h-40 overflow-hidden rounded-2xl bg-zinc-100 sm:h-full">
        <img src={`/listings/${car.category}.svg`} alt={car.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        {car.promoted && (
          <span className="absolute left-3 top-3 rounded-full bg-[hsl(var(--otiva-orange))] px-3 py-1 text-xs font-semibold text-white">
            Топ
          </span>
        )}
      </div>

      <div className="min-w-0">
        <h2 className="text-xl font-semibold leading-tight text-zinc-950">{car.title}</h2>
        <p className="mt-1 text-sm text-zinc-500">{car.subtitle}</p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
          {Object.entries(car.specs).slice(0, 6).map(([name, value]) => (
            <div key={name} className="rounded-2xl bg-zinc-50 px-3 py-2">
              <p className="text-xs text-zinc-400">{name}</p>
              <p className="mt-1 truncate font-semibold text-zinc-800">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {car.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">
              {tag}
            </span>
          ))}
        </div>
        <p className="mt-4 text-sm text-zinc-500">
          {car.city}
          {car.district ? `, ${car.district}` : ""}
        </p>
      </div>

      <div className="flex flex-row items-center justify-between gap-3 border-t border-zinc-100 pt-4 xl:flex-col xl:items-end xl:border-l xl:border-t-0 xl:pl-4 xl:pt-0">
        <div className="xl:text-right">
          <p className="text-2xl font-semibold text-zinc-950">{formatPrice(car.price)}</p>
          <p className="mt-1 text-sm text-zinc-500">{car.seller.name}</p>
          <p className="mt-1 text-sm font-semibold text-[hsl(var(--otiva-mint))]">★ {car.seller.rating}</p>
        </div>
        <div className="flex gap-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100 text-lg text-zinc-700">♡</span>
          <span className="hidden rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white sm:inline-flex">
            Написать
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function CarsPage() {
  const [activeSort, setActiveSort] = useState(sortOptions[0])
  const [city, setCity] = useState("Все города")

  const filteredCars = useMemo(() => {
    const byCity = city === "Все города" ? cars : cars.filter((car) => car.city === city)
    return [...byCity].sort((a, b) => {
      if (activeSort === "Дешевле") return a.price - b.price
      if (activeSort === "Дороже") return b.price - a.price
      if (activeSort === "Пробег до 50 000") {
        const mileageA = Number(a.specs["Пробег"]?.replace(/\D/g, "") || 0)
        const mileageB = Number(b.specs["Пробег"]?.replace(/\D/g, "") || 0)
        return mileageA - mileageB
      }
      return Number(b.promoted) - Number(a.promoted)
    })
  }, [activeSort, city])

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 lg:py-10">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-5xl font-semibold tracking-tight text-zinc-950">Авто</h1>
          <p className="mt-3 max-w-2xl text-zinc-500">
            Машины с понятными характеристиками, быстрыми фильтрами и прямым контактом с продавцом.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {sortOptions.map((option) => (
            <button
              key={option}
              onClick={() => setActiveSort(option)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeSort === option ? "bg-zinc-950 text-white shadow-lg shadow-zinc-950/10" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-[28px] border border-zinc-200 bg-zinc-50 p-5 shadow-inner">
          <h2 className="text-lg font-semibold text-zinc-950">Фильтры</h2>
          <div className="mt-5 space-y-5">
            <label className="block">
              <span className="text-sm font-medium text-zinc-600">Город</span>
              <select value={city} onChange={(event) => setCity(event.target.value)} className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none">
                <option>Все города</option>
                <option>Москва</option>
                <option>Санкт-Петербург</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-zinc-600">Цена до</span>
              <input className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none" placeholder="4 500 000 ₽" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-zinc-600">Марка или модель</span>
              <input className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none" placeholder="BMW, Tesla, Mercedes" />
            </label>
            <div>
              <span className="text-sm font-medium text-zinc-600">Тип</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {["Седан", "Электро", "Полный привод"].map((item) => (
                  <span key={item} className="rounded-full bg-white px-3 py-2 text-xs font-medium text-zinc-600 shadow-sm">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <section>
          <div className="mb-4 flex items-center justify-between text-sm text-zinc-500">
            <span>{filteredCars.length} объявления</span>
            <span>Обновлено сегодня</span>
          </div>
          <div className="space-y-4">
            {filteredCars.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
