"use client"

import { useEffect, useState } from "react"
import { ChevronDown } from "lucide-react"
import { getLegalDocumentSections } from "@/lib/legal-sections"
import { cn } from "@/lib/utils"
import type { TocItem } from "@/components/legal/LegalToc"

function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
}

function NumberedList({ items, onNavigate }: { items: TocItem[]; onNavigate?: () => void }) {
  return (
    <ol className="list-none space-y-2 pl-0">
      {items.map((item, index) => (
        <li key={item.id}>
          <a
            href={`#${item.id}`}
            onClick={(e) => {
              e.preventDefault()
              scrollToSection(item.id)
              onNavigate?.()
            }}
            className="group flex gap-3 rounded-lg px-2 py-1.5 text-sm leading-snug text-zinc-700 transition hover:bg-zinc-50 hover:text-[hsl(var(--nashlo-orange))]"
          >
            <span className="mt-0.5 w-6 shrink-0 text-right text-xs font-bold text-zinc-400 group-hover:text-[hsl(var(--nashlo-orange))]">
              {index + 1}.
            </span>
            <span className="min-w-0 flex-1">{item.label}</span>
          </a>
        </li>
      ))}
    </ol>
  )
}

/** Карточка «Содержание» в начале документа (как у крупных площадок) */
export function LegalTableOfContentsCard({
  href,
  className,
}: {
  href: string
  className?: string
}) {
  const items: TocItem[] = getLegalDocumentSections(href)
  const [open, setOpen] = useState(false)

  if (items.length < 2) return null

  return (
    <>
      <div className={cn("mb-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm lg:hidden", className)}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 text-left"
          aria-expanded={open}
        >
          <span className="text-base font-semibold text-zinc-950">Содержание документа</span>
          <ChevronDown className={cn("h-5 w-5 text-zinc-400 transition", open && "rotate-180")} aria-hidden />
        </button>
        {open ? (
          <div className="mt-4 max-h-64 overflow-y-auto border-t border-zinc-100 pt-4">
            <NumberedList items={items} onNavigate={() => setOpen(false)} />
          </div>
        ) : null}
      </div>

      <div className={cn("mb-8 hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm lg:block", className)}>
        <h2 className="text-lg font-semibold text-zinc-950">Содержание</h2>
        <p className="mt-1 text-sm text-zinc-500">Перейти к разделу документа</p>
        <div className="mt-4">
          <NumberedList items={items} />
        </div>
      </div>
    </>
  )
}

/** Синхронизация id на h2 и родительских section */
export function LegalAnchorSync() {
  useEffect(() => {
    const root = document.querySelector("[data-legal-doc]")
    if (!root) return
    root.querySelectorAll("h2").forEach((h2, index) => {
      const label = h2.textContent?.trim() ?? ""
      if (!label) return
      const id =
        h2.id ||
        label
          .toLowerCase()
          .replace(/^\d+\.\s*/, "")
          .replace(/[^a-zа-яё0-9\s-]/gi, "")
          .trim()
          .replace(/\s+/g, "-")
          .slice(0, 56) ||
        `section-${index}`
      h2.id = id
      const section = h2.closest("section")
      if (section && !section.id) section.id = id
    })
  }, [])
  return null
}
