"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { LEGAL_DOCUMENTS, groupLegalDocumentsByCategory } from "@/lib/legal-documents"
import { LEGAL_LINKS } from "@/lib/legal-meta"
import { cn } from "@/lib/utils"

type Props = {
  className?: string
  /** Мобильный accordion вместо постоянного списка */
  collapsible?: boolean
}

export function LegalSidebar({ className, collapsible = false }: Props) {
  const pathname = usePathname()
  const activeHref = pathname?.split("#")[0] ?? ""
  const isIndex = activeHref === LEGAL_LINKS.index
  const [open, setOpen] = useState(!collapsible)

  const groups = groupLegalDocumentsByCategory(LEGAL_DOCUMENTS)

  const nav = (
    <nav aria-label="Юридические документы" className="space-y-5">
      {groups.map((group) => (
        <div key={group.category}>
          <p className="px-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">{group.label}</p>
          <ul className="mt-2 space-y-0.5">
            {group.items.map((doc) => {
              const active = !isIndex && doc.href === activeHref
              return (
                <li key={doc.href}>
                  <Link
                    href={doc.href}
                    className={cn(
                      "block rounded-lg px-2.5 py-2 text-sm leading-snug transition",
                      active
                        ? "bg-[hsl(var(--nashlo-orange)/0.1)] font-semibold text-[hsl(var(--nashlo-orange))]"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {doc.title}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )

  if (!collapsible) {
    return <div className={className}>{nav}</div>
  }

  return (
    <div className={cn("rounded-2xl border border-zinc-200 bg-white lg:hidden", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold text-zinc-950"
        aria-expanded={open}
      >
        Все документы
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition", open && "rotate-180")} aria-hidden />
      </button>
      {open ? <div className="max-h-[min(60vh,420px)] overflow-y-auto border-t border-zinc-100 px-2 pb-3">{nav}</div> : null}
    </div>
  )
}
