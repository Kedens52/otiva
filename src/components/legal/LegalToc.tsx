"use client"

import { useEffect, useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export type TocItem = { id: string; label: string }

function slugifyHeading(text: string, index: number) {
  const base = text
    .toLowerCase()
    .replace(/^\d+\.\s*/, "")
    .replace(/[^a-zа-яё0-9\s-]/gi, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 56)
  return base || `section-${index}`
}

/** Собирает якоря из h2 внутри [data-legal-doc] */
export function useLegalTocFromArticle(enabled: boolean) {
  const [items, setItems] = useState<TocItem[]>([])

  useEffect(() => {
    if (!enabled) {
      setItems([])
      return
    }
    const root = document.querySelector("[data-legal-doc]")
    if (!root) return

    const headings = Array.from(root.querySelectorAll("h2"))
    const next: TocItem[] = headings.map((el, index) => {
      const label = el.textContent?.trim() ?? `Раздел ${index + 1}`
      const id = el.id || slugifyHeading(label, index)
      if (!el.id) el.id = id
      const section = el.closest("section")
      if (section && !section.id) section.id = id
      return { id, label }
    })
    setItems(next)
  }, [enabled])

  return items
}

type Props = {
  items: TocItem[]
  className?: string
  collapsible?: boolean
}

export function LegalToc({ items, className, collapsible = false }: Props) {
  const [open, setOpen] = useState(false)

  if (items.length < 2) return null

  const list = (
    <ul className="space-y-1.5 text-sm">
      {items.map((item) => (
        <li key={item.id}>
          <a
            href={`#${item.id}`}
            className="block rounded-lg px-2 py-1.5 leading-snug text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950"
            onClick={(e) => {
              e.preventDefault()
              document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" })
              if (collapsible) setOpen(false)
            }}
          >
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  )

  if (collapsible) {
    return (
      <div className={cn("rounded-2xl border border-zinc-200 bg-white lg:hidden", className)}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold text-zinc-950"
          aria-expanded={open}
        >
          Содержание
          <ChevronDown className={cn("h-4 w-4 shrink-0 transition", open && "rotate-180")} aria-hidden />
        </button>
        {open ? <div className="max-h-56 overflow-y-auto border-t border-zinc-100 px-3 pb-3">{list}</div> : null}
      </div>
    )
  }

  return (
    <aside className={cn("hidden lg:block", className)} aria-label="Содержание документа">
      <div className="sticky top-24 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Содержание</p>
        <div className="mt-3 max-h-[calc(100vh-8rem)] overflow-y-auto">{list}</div>
      </div>
    </aside>
  )
}

/** Мобильное содержание (accordion) над текстом документа */
export function LegalTocPanel({ enabled }: { enabled: boolean }) {
  const items = useLegalTocFromArticle(enabled)
  if (!enabled || items.length < 2) return null

  return <LegalToc items={items} collapsible className="mb-4" />
}
