"use client"

import Link from "next/link"
import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { FOOTER_NAV_GROUPS } from "@/config/site-nav-links"
import { cn } from "@/lib/utils"

function FooterGroupHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-400">{children}</p>
  )
}

function FooterLinkList({ links }: { links: readonly { label: string; href: string }[] }) {
  return (
    <ul className="space-y-0.5">
      {links.map((link) => (
        <li key={`${link.href}-${link.label}`}>
          <Link
            href={link.href}
            className="block min-h-10 rounded-lg px-2 py-2.5 text-[15px] leading-snug text-zinc-600 break-words transition hover:bg-zinc-50 hover:text-zinc-950 sm:text-sm"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  )
}

/** Навигация подвала: сетка на десктопе, accordion на мобильной */
export function FooterNavGroups() {
  const [openGroup, setOpenGroup] = useState<string | null>("Пользователям")

  return (
    <>
      <div className="hidden min-w-0 lg:grid lg:flex-1 lg:grid-cols-5 lg:gap-6 xl:gap-8">
        {FOOTER_NAV_GROUPS.map((group) => (
          <nav key={group.title} aria-label={group.title} className="min-w-0">
            <FooterGroupHeading>{group.title}</FooterGroupHeading>
            <div className="mt-3">
              <FooterLinkList links={group.links} />
            </div>
          </nav>
        ))}
      </div>

      <div className="space-y-2 lg:hidden">
        {FOOTER_NAV_GROUPS.map((group) => {
          const isOpen = openGroup === group.title
          return (
            <nav key={group.title} aria-label={group.title} className="rounded-2xl border border-zinc-100 bg-zinc-50/80">
              <button
                type="button"
                onClick={() => setOpenGroup(isOpen ? null : group.title)}
                className="flex w-full min-h-11 items-center justify-between gap-3 px-4 py-3 text-left"
                aria-expanded={isOpen}
              >
                <span className="text-sm font-semibold text-zinc-900">{group.title}</span>
                <ChevronDown
                  className={cn("h-4 w-4 shrink-0 text-zinc-400 transition", isOpen && "rotate-180")}
                  aria-hidden
                />
              </button>
              {isOpen ? (
                <div className="border-t border-zinc-100 px-2 pb-2">
                  <FooterLinkList links={group.links} />
                </div>
              ) : null}
            </nav>
          )
        })}
      </div>
    </>
  )
}
