import Link from "next/link"
import { Logo } from "@/components/layout/Logo"

const primaryLinks = [
  { label: "Помощь", href: "/help" },
  { label: "Безопасность", href: "/safety" },
  { label: "Реклама", href: "/advertising" },
  { label: "О компании", href: "/about" },
  { label: "Карьера", href: "/careers" },
  { label: "Блог", href: "/blog" },
  { label: "Приложение", href: "/app" },
]

const secondaryLinks = [
  { label: "Каталог", href: "/categories" },
  { label: "Карта сайта", href: "/sitemap" },
  { label: "Свежие объявления", href: "/feed" },
  { label: "Популярные запросы", href: "/categories" },
]

const socialLinks = ["VK", "OK", "TG", "R", "D"]

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <div>
            <Logo compact />
            <p className="mt-4 max-w-xs text-sm leading-6 text-zinc-500">
              Otiva — маркетплейс для аккуратных сделок, понятных объявлений и быстрого контакта с продавцом.
            </p>
          </div>

          <div>
            <nav className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-medium text-zinc-700">
              {primaryLinks.map((link) => (
                <Link key={link.href} href={link.href} className="hover:text-zinc-950">
                  {link.label}
                </Link>
              ))}
            </nav>
            <nav className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-500">
              {secondaryLinks.map((link) => (
                <Link key={link.href + link.label} href={link.href} className="hover:text-zinc-950">
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="mt-5 max-w-3xl text-xs leading-5 text-zinc-400">
              © Otiva, 2026. Информация на сайте не является публичной офертой. Используя Otiva, вы соглашаетесь с правилами сервиса, политикой конфиденциальности и рекомендациями безопасных сделок.
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {socialLinks.map((item) => (
                <Link
                  key={item}
                  href="/feed"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-950 text-xs font-semibold text-white shadow-sm transition hover:bg-[hsl(var(--otiva-blue))]"
                  aria-label={item}
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
