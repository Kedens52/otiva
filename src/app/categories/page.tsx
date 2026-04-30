import Link from "next/link"
import { ListingCard } from "@/components/marketplace/ListingCard"
import { listings, marketplaceCategories } from "@/lib/mock-marketplace"

export default function CategoriesPage() {
  const recommended = listings.slice(0, 3)

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 lg:py-10">
      <section className="mb-6 lg:mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">Категории</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-500 lg:mt-4 lg:text-lg lg:leading-8">
          Все основные разделы Otiva в одном месте. Выберите направление и переходите к объявлениям.
        </p>
      </section>

      {/* Mobile: compact horizontal rows */}
      <section className="lg:hidden">
        <div className="overflow-hidden rounded-[24px] border border-zinc-200 bg-white divide-y divide-zinc-100">
          {marketplaceCategories.map((category) => (
            <Link
              href={category.href}
              key={category.slug}
              className="flex items-center gap-4 px-4 py-3.5 transition hover:bg-zinc-50 active:bg-zinc-100"
            >
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${category.tone}`}>
                <img
                  src={`/categories/${category.slug}.svg`}
                  alt=""
                  className="h-10 w-10 rounded-xl object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-zinc-950">{category.title}</p>
                <p className="mt-0.5 truncate text-sm text-zinc-500">{category.count}</p>
              </div>
              <span className="shrink-0 text-xl text-zinc-300">›</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Desktop: full grid cards */}
      <section className="hidden lg:grid lg:grid-cols-4 lg:gap-4">
        {marketplaceCategories.map((category) => (
          <Link
            href={category.href}
            key={category.slug}
            className="group overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className={`flex h-32 items-center justify-center bg-gradient-to-br ${category.tone}`}>
              <img
                src={`/categories/${category.slug}.svg`}
                alt=""
                className="h-24 w-24 rounded-3xl object-cover shadow-lg shadow-zinc-950/10 transition group-hover:scale-105"
              />
            </div>
            <div className="p-5">
              <h2 className="text-xl font-semibold text-zinc-950">{category.title}</h2>
              <p className="mt-2 min-h-12 text-sm leading-6 text-zinc-500">{category.caption}</p>
              <div className="mt-5 flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-zinc-950">{category.count}</p>
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-500 transition group-hover:bg-zinc-950 group-hover:text-white">
                  Открыть
                </span>
              </div>
            </div>
          </Link>
        ))}
      </section>

      <section className="py-10 lg:py-12">
        <div className="mb-5 lg:mb-6">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 lg:text-3xl">Рекомендации</h2>
          <p className="mt-1 text-sm text-zinc-500 lg:mt-2 lg:text-base">Несколько объявлений из разных категорий.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {recommended.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>
    </main>
  )
}
