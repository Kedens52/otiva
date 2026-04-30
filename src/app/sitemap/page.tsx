import Link from "next/link"
import { marketplaceCategories } from "@/lib/mock-marketplace"

export default function SitemapPage() {
  const links = [
    { href: "/feed", label: "Главная" },
    { href: "/categories", label: "Категории" },
    { href: "/cars", label: "Авто" },
    { href: "/create", label: "Разместить объявление" },
    { href: "/login", label: "Вход" },
    { href: "/register", label: "Регистрация" },
    ...marketplaceCategories.map((category) => ({ href: category.href, label: category.title })),
  ]

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-5xl font-semibold tracking-tight text-zinc-950">Карта сайта</h1>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {links.map((link) => (
          <Link key={link.href + link.label} href={link.href} className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 hover:border-zinc-950 hover:text-zinc-950">
            {link.label}
          </Link>
        ))}
      </div>
    </main>
  )
}
