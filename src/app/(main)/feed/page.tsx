import Link from "next/link"
import { ListingCard } from "@/components/marketplace/ListingCard"
import { listings, marketplaceCategories } from "@/lib/mock-marketplace"

const adFormats = [
  { title: "Баннер", caption: "На главной", color: "bg-[hsl(var(--otiva-blue))]" },
  { title: "Топ", caption: "Выше в поиске", color: "bg-[hsl(var(--otiva-orange))]" },
  { title: "Пакет", caption: "Для бизнеса", color: "bg-[hsl(var(--otiva-mint))]" },
]

const adPlaces = [
  { title: "Главная лента", price: "от 1 900 ₽", accent: "bg-[hsl(var(--otiva-blue)/0.12)] text-[hsl(var(--otiva-blue))]" },
  { title: "Категории", price: "от 1 200 ₽", accent: "bg-[hsl(var(--otiva-mint)/0.12)] text-[hsl(var(--otiva-mint))]" },
  { title: "Карточка товара", price: "от 790 ₽", accent: "bg-[hsl(var(--otiva-orange)/0.12)] text-[hsl(var(--otiva-orange))]" },
]

export default function FeedPage() {
  const categoryTiles = marketplaceCategories.slice(0, 8)
  const recommended = listings.slice(0, 4)
  const latest = listings.slice(4, 8)

  return (
    <main className="bg-white">
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-6 lg:grid-cols-[1fr_300px]">
        <div>
          <section className="max-w-4xl">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {categoryTiles.map((category) => (
              <Link
                key={category.slug}
                href={category.href}
                className="group flex min-h-32 min-w-0 flex-col justify-between overflow-hidden rounded-3xl bg-zinc-100 p-4 transition hover:-translate-y-0.5 hover:bg-zinc-200"
              >
                <h2 className="w-full truncate text-base font-semibold leading-5 text-zinc-950">{category.title}</h2>
                <img
                  src={`/categories/${category.slug}.svg`}
                  alt=""
                  className="mx-auto h-16 w-16 shrink-0 rounded-2xl object-cover shadow-sm transition group-hover:scale-105"
                />
              </Link>
            ))}
            </div>
          </section>

          <section className="pt-6">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Рекомендации для вас</h1>
            <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
              {recommended.map((listing) => (
                <ListingCard key={listing.id} listing={listing} compact />
              ))}
            </div>
          </section>

          <section className="pt-6">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-950">Новые объявления</h2>
            <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
              {latest.map((listing) => (
                <ListingCard key={listing.id} listing={listing} compact />
              ))}
            </div>
          </section>
        </div>

        <aside className="hidden space-y-8 lg:block">
          <section className="overflow-hidden rounded-3xl bg-zinc-950 p-5 text-white shadow-2xl shadow-zinc-950/10">
            <div className="rounded-[28px] bg-white/10 p-4">
              <div className="flex h-24 items-end overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(var(--otiva-blue))] via-[hsl(var(--otiva-mint))] to-[hsl(var(--otiva-orange))] p-4">
                <div className="h-10 w-28 rounded-full bg-white/90 shadow-lg" />
                <div className="ml-auto h-16 w-12 rounded-2xl bg-white/70" />
              </div>
            </div>
            <h2 className="mt-5 text-2xl font-semibold tracking-tight">Реклама на Otiva</h2>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Продвигайте объявления, запускайте баннеры и получайте больше обращений от покупателей.
            </p>
            <div className="mt-5 space-y-3">
              {adFormats.map((item) => (
                <div key={item.title} className="flex items-center gap-3 rounded-2xl bg-white/10 p-3">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.color} text-sm font-bold text-white shadow-lg`}>
                    {item.title.slice(0, 1)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-xs text-white/55">{item.caption}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/advertising"
              className="mt-5 block rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
            >
              Заказать рекламу
            </Link>
            <Link
              href="/create"
              className="mt-3 block rounded-2xl border border-white/20 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Продвинуть объявление
            </Link>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-950">Оцените продавца</h2>
            <div className="mt-4 flex gap-3 border-b border-zinc-200 pb-5">
              <div className="h-20 w-24 rounded-2xl bg-gradient-to-br from-stone-200 to-zinc-500" />
              <div>
                <p className="font-semibold text-zinc-950">Сергей</p>
                <p className="mt-1 text-sm text-zinc-600">Коробка DSG7 dq200</p>
                <p className="mt-1 text-sm font-semibold text-zinc-950">15 000 ₽</p>
                <p className="mt-2 text-zinc-300">★★★★★</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-zinc-950">Места для рекламы</h2>
            <p className="mt-2 text-sm leading-5 text-zinc-500">
              Выберите, где показать объявление: на главной, в категории или рядом с похожими товарами.
            </p>
            <div className="mt-5 space-y-3">
              {adPlaces.map((place) => (
                <Link
                  key={place.title}
                  href="/advertising"
                  className="flex items-center justify-between rounded-2xl bg-zinc-50 p-3 transition hover:bg-zinc-100"
                >
                  <span className="flex items-center gap-3">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold ${place.accent}`}>
                      {place.title.slice(0, 1)}
                    </span>
                    <span className="text-sm font-semibold text-zinc-950">{place.title}</span>
                  </span>
                  <span className="text-xs font-semibold text-zinc-500">{place.price}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-3xl bg-zinc-100 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">Для компаний</p>
            <h2 className="mt-2 text-xl font-semibold text-zinc-950">Запустите рекламу за день</h2>
            <div className="mt-4 space-y-3 text-sm text-zinc-600">
              <p>1. Выберите место показа</p>
              <p>2. Укажите бюджет и срок</p>
              <p>3. Получайте заявки в чате</p>
            </div>
            <Link
              href="/advertising"
              className="mt-5 block rounded-2xl bg-zinc-950 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Оставить заявку
            </Link>
          </section>
        </aside>
      </section>
    </main>
  )
}
