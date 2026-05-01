import Link from "next/link"
import { ListingCard } from "@/components/marketplace/ListingCard"
import { AdSlot } from "@/components/marketplace/AdSlot"
import { listings, marketplaceCategories } from "@/lib/mock-marketplace"


export default function FeedPage() {
  const categoryTiles = marketplaceCategories.slice(0, 8)
  const mobileCategoryTiles = ["cars", "services", "real-estate", "electronics"]
    .map((slug) => marketplaceCategories.find((category) => category.slug === slug))
    .filter((category): category is (typeof marketplaceCategories)[number] => Boolean(category))
  const recommended = listings.slice(0, 4)
  const latest = listings.slice(4, 8)

  return (
    <main className="bg-white">
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-6 lg:grid-cols-[1fr_300px]">
        <div>
          <section className="max-w-4xl">
            <div className="grid grid-cols-2 gap-3 lg:hidden">
              {mobileCategoryTiles.map((category) => (
                <Link
                  key={category.slug}
                  href={category.href}
                  className="group relative flex h-32 min-w-0 flex-col justify-between overflow-hidden rounded-3xl bg-zinc-100 p-4 transition active:scale-[0.98]"
                >
                  <h2 className="relative z-10 max-w-[130px] text-base font-semibold leading-5 text-zinc-950">{category.title}</h2>
                  <img
                    src={`/categories/${category.slug}.svg`}
                    alt=""
                    className="absolute bottom-3 right-3 h-16 w-16 rounded-2xl object-cover shadow-sm transition group-hover:scale-105"
                  />
                </Link>
              ))}
            </div>

            <div className="hidden grid-cols-2 gap-3 lg:grid lg:grid-cols-4">
              {categoryTiles.map((category) => (
                <Link
                  key={category.slug}
                  href={category.href}
                  className="group flex min-h-[7rem] min-w-0 flex-col justify-between overflow-hidden rounded-3xl bg-zinc-100 p-3 transition hover:-translate-y-0.5 hover:bg-zinc-200 sm:min-h-32 sm:p-4"
                >
                  <h2 className="line-clamp-2 text-sm font-semibold leading-5 text-zinc-950 sm:text-base">{category.title}</h2>
                  <img
                    src={`/categories/${category.slug}.svg`}
                    alt=""
                    className="mx-auto h-12 w-12 shrink-0 rounded-xl object-cover shadow-sm transition group-hover:scale-105 sm:h-16 sm:w-16 sm:rounded-2xl"
                  />
                </Link>
              ))}
            </div>
          </section>

          {/* ── DESKTOP AD BANNER ─────────────────────────────── */}
          <section className="mt-5 hidden lg:block">
            <AdSlot slot="leaderboard" variant="leaderboard" tone="orange" />
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

        <aside className="hidden space-y-5 lg:block">
          {/* Ad slot 300×250 (Medium Rectangle) */}
          <AdSlot slot="sidebarTop" variant="box" tone="orange" />

          {/* Ad slot 300×600 (Half Page) */}
          <AdSlot slot="sidebarTall" variant="tall" tone="blue" />

        </aside>
      </section>
    </main>
  )
}
