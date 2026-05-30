"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LEGAL_LINKS } from "@/lib/legal-meta"
import { cn } from "@/lib/utils"

/** Верхняя навигация — только разделы с готовыми документами или страницами помощи */
export const LEGAL_HEADER_NAV = [
  { label: "Правила Нашло", href: LEGAL_LINKS.index },
  { label: "Объявления", href: LEGAL_LINKS.listingRules },
  { label: "Платные услуги", href: LEGAL_LINKS.promotionOffer },
  { label: "Реклама", href: LEGAL_LINKS.advertisingRules },
  { label: "Бонусы", href: LEGAL_LINKS.bonusRules },
  { label: "Отзывы", href: LEGAL_LINKS.reviews },
  { label: "Защита данных", href: LEGAL_LINKS.privacyPolicy },
  { label: "Помощь", href: "/help" },
] as const

function isNavActive(pathname: string, href: string) {
  if (href === LEGAL_LINKS.index) return pathname === href
  if (href === "/help") return pathname === "/help" || pathname.startsWith("/support")
  return pathname === href || pathname.startsWith(href + "/")
}

export function LegalHeaderNav() {
  const pathname = usePathname() ?? ""

  const active =
    LEGAL_HEADER_NAV.find((item) => isNavActive(pathname, item.href))?.href ??
    (pathname.startsWith("/legal") ? LEGAL_LINKS.index : null)

  return (
    <nav aria-label="Разделы правил" className="mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
      <div
        className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-2 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {LEGAL_HEADER_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "shrink-0 snap-start whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition",
              active === item.href
                ? "border-[hsl(var(--nashlo-orange))] bg-[hsl(var(--nashlo-orange))] text-white shadow-sm"
                : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:text-zinc-950"
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
