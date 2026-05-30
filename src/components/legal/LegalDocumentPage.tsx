import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { LegalAnchorSync, LegalTableOfContentsCard } from "@/components/legal/LegalTableOfContents"
import { LegalBreadcrumbs } from "@/components/legal/LegalBreadcrumbs"
import { LegalDocFooter } from "@/components/legal/LegalDocFooter"
import { LegalRelatedDocuments } from "@/components/legal/LegalRelatedDocuments"
import { getAdjacentLegalDocuments, getLegalDocumentByHref } from "@/lib/legal-documents"
import { LEGAL_LINKS, LEGAL_PUBLISHED_DATE_RU } from "@/lib/legal-meta"

type Props = {
  title: string
  description?: string
  href: string
  children: ReactNode
}

export function LegalDocumentPage({ title, description, href, children }: Props) {
  const meta = getLegalDocumentByHref(href)
  const { prev, next } = getAdjacentLegalDocuments(href)

  const lead =
    description ??
    meta?.description ??
    "Актуальная редакция документа сервиса Нашло на nashlo.ru."

  return (
    <article className="min-w-0">
      <LegalBreadcrumbs items={[{ label: title }]} />

      <header className="mb-6">
        {meta?.categoryLabel ? (
          <p className="mb-2 inline-flex rounded-full bg-[hsl(var(--nashlo-orange)/0.1)] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[hsl(var(--nashlo-orange))]">
            {meta.categoryLabel}
          </p>
        ) : null}
        <h1 className="text-[1.75rem] font-bold tracking-tight text-zinc-950 sm:text-3xl lg:text-[2.25rem] lg:leading-tight">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-600">{lead}</p>
        <p className="mt-3 text-sm text-zinc-400">
          Обновлено: <time dateTime="2026-05-21">{LEGAL_PUBLISHED_DATE_RU}</time>
        </p>
      </header>

      <LegalTableOfContentsCard href={href} />
      <LegalAnchorSync />

      <div
        data-legal-doc
        className="legal-prose rounded-2xl border border-zinc-200 bg-white px-5 py-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:px-8 sm:py-8"
      >
        {children}
      </div>

      <LegalRelatedDocuments href={href} />

      <nav
        className="mt-8 flex flex-col gap-3 border-t border-zinc-100 pt-6 sm:flex-row sm:items-center sm:justify-between"
        aria-label="Навигация между документами"
      >
        {prev ? (
          <Link
            href={prev.href}
            className="group inline-flex max-w-full items-center gap-2 text-sm font-medium text-zinc-600 transition hover:text-zinc-950"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        <Link
          href={LEGAL_LINKS.index}
          className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:border-zinc-300"
        >
          Правила Нашло
        </Link>
        {next ? (
          <Link
            href={next.href}
            className="group inline-flex max-w-full items-center justify-end gap-2 text-sm font-medium text-zinc-600 transition hover:text-zinc-950 sm:text-right"
          >
            <span className="truncate">{next.title}</span>
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
          </Link>
        ) : (
          <span />
        )}
      </nav>

      <LegalDocFooter />
    </article>
  )
}
