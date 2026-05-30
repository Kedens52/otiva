import Link from "next/link"
import { BusinessLogo } from "@/components/business/BusinessLogo"
import { PAGE_CONTAINER_CLASS } from "@/components/layout/PageContainer"
import { LEGAL_LINKS } from "@/lib/legal-meta"

const LINKS = [
  { label: "Оптовые предложения", href: "/business/wholesale" },
  { label: "Продажа бизнеса", href: "/business/sell-business" },
  { label: "Франшизы", href: "/business/franchise" },
  { label: "Оборудование", href: "/business/equipment" },
  { label: "Коммерческая недвижимость", href: "/business/commercial-real-estate" },
  { label: "Услуги для бизнеса", href: "/business/services" },
  { label: "Регистрация бизнеса", href: "/business/register" },
  { label: "Правила для бизнеса", href: "/legal/business-terms" },
  { label: "Контакты", href: LEGAL_LINKS.contacts },
] as const

export function BusinessFooter() {
  return (
    <footer className="mt-12 border-t border-zinc-200 bg-white">
      <div className={`${PAGE_CONTAINER_CLASS} py-8`}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <BusinessLogo />
            <p className="mt-3 max-w-xs text-sm text-zinc-500">
              B2B-площадка в экосистеме Нашло для компаний, поставщиков и закупщиков.
            </p>
          </div>
          <nav className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-2">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-zinc-600 transition hover:text-[hsl(var(--nashlo-orange))]"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="mt-8 border-t border-zinc-100 pt-4 text-center text-xs text-zinc-400">
          © {new Date().getFullYear()} Нашло ·{" "}
          <Link href="/" className="underline-offset-2 hover:underline">
            Основная площадка
          </Link>
        </p>
      </div>
    </footer>
  )
}
