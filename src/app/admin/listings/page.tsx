import { listings } from "@/lib/mock-marketplace"
import Link from "next/link"

export default function AdminListingsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950">Модерация объявлений</h1>
          <p className="mt-2 text-zinc-500">Быстрая очередь объявлений на проверку.</p>
        </div>
        <Link href="/admin/moderation" className="rounded-2xl bg-[hsl(var(--nashlo-orange))] px-5 py-3 text-sm font-semibold text-white shadow-sm">
          Открыть панель модерации
        </Link>
      </div>
      <div className="mt-8 overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
        {listings.slice(0, 6).map((listing) => (
          <div key={listing.id} className="grid gap-3 border-b border-zinc-200 px-5 py-4 last:border-b-0 md:grid-cols-[1fr_auto_auto] md:items-center">
            <div>
              <p className="font-semibold text-zinc-950">{listing.title}</p>
              <p className="text-sm text-zinc-500">{listing.city}</p>
            </div>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-600">На проверке</span>
            <button className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white">Одобрить</button>
          </div>
        ))}
      </div>
    </main>
  )
}
