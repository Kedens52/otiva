"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search } from "lucide-react"
import {
  LEGAL_POPULAR_SEARCHES,
  searchLegalDocuments,
  type LegalSearchHit,
} from "@/lib/legal-documents"
import { LEGAL_LINKS } from "@/lib/legal-meta"
import { cn } from "@/lib/utils"

type Props = {
  className?: string
  /** На странице /legal — показывать карточки результатов */
  showResults?: boolean
  placeholder?: string
  size?: "default" | "lg"
}

export function LegalSearch({
  className,
  showResults = false,
  placeholder = "Найти в правилах и документах",
  size = "default",
}: Props) {
  const [query, setQuery] = useState("")

  const results = useMemo(() => searchLegalDocuments(query), [query])

  return (
    <div className={cn("space-y-3", className)}>
      <label className="relative block">
        <Search
          className={cn(
            "pointer-events-none absolute top-1/2 -translate-y-1/2 text-zinc-400",
            size === "lg" ? "left-4 h-5 w-5" : "left-3 h-4 w-4"
          )}
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-2xl border border-zinc-200 bg-white text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-[hsl(var(--nashlo-orange)/0.5)] focus:ring-2 focus:ring-[hsl(var(--nashlo-orange)/0.15)]",
            size === "lg"
              ? "h-14 pl-12 pr-4 text-base"
              : "h-11 pl-10 pr-3 text-sm"
          )}
          aria-label={placeholder}
        />
      </label>

      {!showResults && query.trim() && results.length > 0 ? (
        <ul className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-2 shadow-md">
          {results.slice(0, 8).map((hit) => (
            <LegalSearchHitRow key={`${hit.doc.href}-${hit.section?.id ?? "doc"}`} hit={hit} onNavigate={() => setQuery("")} />
          ))}
        </ul>
      ) : null}

      {showResults ? (
        <>
          {query.trim() ? (
            results.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {results.map((hit) => (
                  <LegalSearchCard key={`${hit.doc.href}-${hit.section?.id ?? "doc"}`} hit={hit} />
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-sm leading-relaxed text-zinc-500">
                Ничего не найдено. Попробуйте другой запрос или{" "}
                <Link href={LEGAL_LINKS.index} className="font-semibold text-[hsl(var(--nashlo-orange))] hover:underline">
                  откройте все документы
                </Link>
                .
              </p>
            )
          ) : (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-zinc-400">Популярные запросы:</span>
              {LEGAL_POPULAR_SEARCHES.map((item) => (
                <button
                  key={item.query}
                  type="button"
                  onClick={() => setQuery(item.query)}
                  className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 transition hover:border-[hsl(var(--nashlo-orange)/0.35)] hover:text-[hsl(var(--nashlo-orange))]"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}

function hitHref(hit: LegalSearchHit) {
  return hit.section ? `${hit.doc.href}#${hit.section.id}` : hit.doc.href
}

function LegalSearchHitRow({ hit, onNavigate }: { hit: LegalSearchHit; onNavigate: () => void }) {
  const href = hitHref(hit)
  return (
    <li>
      <Link href={href} onClick={onNavigate} className="block rounded-lg px-2 py-2 text-sm transition hover:bg-zinc-50">
        <span className="font-medium text-zinc-900">{hit.doc.title}</span>
        {hit.section ? (
          <span className="mt-0.5 block text-xs text-[hsl(var(--nashlo-orange))]">→ {hit.section.label}</span>
        ) : (
          <span className="mt-0.5 block text-xs text-zinc-500 line-clamp-1">{hit.doc.description}</span>
        )}
      </Link>
    </li>
  )
}

function LegalSearchCard({ hit }: { hit: LegalSearchHit }) {
  const href = hitHref(hit)
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-[hsl(var(--nashlo-orange)/0.35)] hover:shadow-md"
    >
      <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">{hit.doc.categoryLabel}</span>
      <span className="mt-1 text-sm font-semibold text-zinc-950 group-hover:text-[hsl(var(--nashlo-orange))]">
        {hit.section ? `${hit.doc.title} — ${hit.section.label}` : hit.doc.title}
      </span>
      <span className="mt-1 flex-1 text-xs leading-relaxed text-zinc-500">{hit.doc.description}</span>
      <span className="mt-3 text-xs font-semibold text-[hsl(var(--nashlo-orange))]">Открыть →</span>
    </Link>
  )
}
