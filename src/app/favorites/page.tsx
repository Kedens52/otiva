import Link from "next/link"
import { ListingCard } from "@/components/marketplace/ListingCard"
import { listings } from "@/lib/mock-marketplace"

export default function FavoritesPage() {
  const favoriteListings = listings.slice(0, 3)

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 lg:py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">Избранное</h1>
          <p className="mt-2 text-zinc-500">Демо-подборка сохраненных объявлений. Позже здесь будут реальные избранные пользователя.</p>
        </div>
        <Link href="/feed" className="rounded-full bg-zinc-100 px-5 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-950 hover:text-white">
          Продолжить поиск
        </Link>
      </div>

      <section className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {favoriteListings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} href={listing.category === "cars" ? `/cars/${listing.id}` : `/listings/${listing.id}`} />
        ))}
      </section>
    </main>
  )
}
