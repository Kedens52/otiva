import Link from "next/link"

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-7xl font-bold text-zinc-950">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-zinc-950">Страница не найдена</h1>
      <p className="mt-2 text-zinc-500">Возможно, объявление удалено или ссылка устарела.</p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className="rounded-2xl bg-zinc-950 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition">
          На главную
        </Link>
        <Link href="/search" className="rounded-2xl border border-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition">
          Все объявления
        </Link>
      </div>
    </main>
  )
}
