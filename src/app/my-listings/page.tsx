import Link from "next/link"
import { listings } from "@/lib/mock-marketplace"

const myListings = listings.slice(0, 2)

export default function MyListingsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 pb-28 pt-5 lg:py-10">
      <section className="mx-auto max-w-3xl lg:max-w-none">
        <div className="flex items-center justify-between lg:hidden">
          <div />
          <h1 className="text-xl font-semibold text-zinc-950">Мои объявления</h1>
          <Link href="/create" className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-xl font-light text-zinc-950">
            +
          </Link>
        </div>

        <div className="hidden items-end justify-between lg:flex">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-950">Мои объявления</h1>
            <p className="mt-2 text-zinc-500">Управляйте публикациями, скидками, продвижением и статистикой.</p>
          </div>
          <Link href="/create" className="rounded-2xl bg-[hsl(var(--otiva-orange))] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(var(--otiva-orange)/0.9)]">
            Разместить объявление
          </Link>
        </div>

        <div className="mt-5 overflow-hidden rounded-[28px] bg-gradient-to-br from-[hsl(var(--otiva-mint))] to-zinc-900 p-5 text-white shadow-lg shadow-[hsl(var(--otiva-mint)/0.18)] lg:mt-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-2xl font-semibold">Скидки и акции</p>
              <p className="mt-1 text-sm text-white/80">настройте для покупателей</p>
            </div>
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--otiva-mint))] text-3xl font-bold text-zinc-950">%</span>
          </div>
        </div>

        <div className="mt-6 flex items-end gap-5 border-b border-zinc-200">
          <button type="button" className="pb-3 text-xl font-semibold text-zinc-400">
            Ждут действий <sup className="text-sm">1</sup>
          </button>
          <button type="button" className="border-b-2 border-zinc-950 pb-3 text-xl font-semibold text-zinc-950">
            Активные <sup className="text-sm">{myListings.length}</sup>
          </button>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          <div className="rounded-[28px] bg-gradient-to-r from-[hsl(var(--otiva-blue))] to-[hsl(var(--otiva-orange)/0.75)] p-5 text-white">
            <p className="text-lg font-semibold">Как не пропускать уведомления</p>
            <p className="mt-1 text-sm leading-6 text-white/85">Добавьте Otiva на главный экран и возвращайтесь к важным сообщениям.</p>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-[28px] bg-zinc-100 p-5">
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-zinc-950">1 товар можно продать быстрее</p>
              <p className="mt-0.5 truncate text-sm text-zinc-500">Вот что советует кабинет продавца</p>
            </div>
            <span className="text-2xl text-zinc-400">›</span>
          </div>
        </div>

        <div className="mt-6 space-y-5 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0">
          {myListings.map((listing, index) => (
            <article key={listing.id} className="flex gap-4 rounded-[28px] bg-white lg:border lg:border-zinc-200 lg:p-4 lg:shadow-sm">
              <div className="h-28 w-28 shrink-0 overflow-hidden rounded-3xl bg-gradient-to-br shadow-sm sm:h-32 sm:w-32" style={{ background: listing.imageTone }}>
                <img src={`/listings/${listing.category}.svg`} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-lg font-semibold leading-6 text-zinc-950">{listing.title}</p>
                    <p className="mt-1 text-xl font-bold text-zinc-950">{listing.price.toLocaleString("ru-RU")} ₽</p>
                    <p className="text-sm text-zinc-400 line-through">{(listing.price + 4000).toLocaleString("ru-RU")} ₽</p>
                  </div>
                  <button type="button" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-700">✎</button>
                </div>
                <p className="mt-2 text-sm text-zinc-600">{index + 1} шт. в наличии</p>
                <p className="mt-1 text-sm text-zinc-600">Осталось {24 - index * 3} дня</p>
                <p className="mt-2 text-sm text-zinc-500">⌕ {21 + index * 12} · ♙ {1 + index} · ♡ {4 + index * 3}</p>
                <p className="mt-2 text-sm font-medium text-[hsl(var(--otiva-mint))]">Скидка до 90% на продвижение</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 flex justify-center lg:hidden">
          <Link href="/create" className="flex h-14 w-full max-w-xs items-center justify-center rounded-[22px] bg-[hsl(var(--otiva-orange))] text-base font-semibold text-white shadow-sm shadow-[hsl(var(--otiva-orange)/0.25)] transition hover:bg-[hsl(var(--otiva-orange)/0.9)]">
            Разместить объявление
          </Link>
        </div>

      </section>
    </main>
  )
}
