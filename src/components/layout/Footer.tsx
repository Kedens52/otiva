import Link from "next/link"
import { Logo } from "@/components/layout/Logo"

const helpLinks = [
  { label: "Помощь", href: "/help" },
  { label: "Безопасность", href: "/safety" },
  { label: "О компании", href: "/about" },
  { label: "Тарифы", href: "/pricing" },
  { label: "Реклама", href: "/advertising" },
  { label: "Карьера", href: "/careers" },
]

const legalLinks = [
  { label: "Пользовательское соглашение", href: "/terms" },
  { label: "Политика конфиденциальности", href: "/privacy" },
  { label: "Обработка персональных данных", href: "/personal-data" },
  { label: "Политика cookies", href: "/cookies" },
]

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white pb-24 lg:pb-0">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <div>
            <Logo compact />
            <p className="mt-4 max-w-xs text-sm leading-6 text-zinc-500">
              Нашло — маркетплейс для быстрых и безопасных сделок между людьми.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a href="https://vk.com" target="_blank" rel="noopener noreferrer"
                className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-950">
                ВКонтакте
              </a>
              <a href="https://t.me" target="_blank" rel="noopener noreferrer"
                className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-950">
                Telegram
              </a>
            </div>
          </div>

          <div className="space-y-5">
            <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-zinc-700">
              {helpLinks.map((link) => (
                <Link key={link.href} href={link.href} className="hover:text-zinc-950">
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="h-px bg-zinc-100" />

            <nav className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-zinc-400">
              {legalLinks.map((link) => (
                <Link key={link.href} href={link.href} className="underline underline-offset-2 hover:text-zinc-700">
                  {link.label}
                </Link>
              ))}
            </nav>

            <p className="text-xs leading-5 text-zinc-400">
              © ООО «Нашло», 2025–2026. Размещая объявление, вы принимаете{" "}
              <Link href="/terms" className="underline underline-offset-2 hover:text-zinc-700">условия использования</Link>{" "}
              и даёте согласие на{" "}
              <Link href="/personal-data" className="underline underline-offset-2 hover:text-zinc-700">обработку персональных данных</Link>.
              {" "}Сайт использует{" "}
              <Link href="/cookies" className="underline underline-offset-2 hover:text-zinc-700">файлы cookie</Link>.
              {" "}Информация на сайте не является публичной офертой.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
