import Link from "next/link"
import { ListingCard } from "@/components/marketplace/ListingCard"
import { listings, marketplaceCategories } from "@/lib/mock-marketplace"

export default function CategoriesPage() {
  const recommended = listings.slice(0, 3)

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 lg:py-10">
      <section className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">Категории</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-500">
          Все основные разделы Otiva в одном месте. Выберите направление и переходите к объявлениям.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <section className="py-12">
        <div className="mb-6">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-950">Рекомендации</h2>
          <p className="mt-2 text-zinc-500">Несколько объявлений из разных категорий.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {recommended.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>
    </main>
  )
}
