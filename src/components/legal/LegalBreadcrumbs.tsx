import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { LEGAL_LINKS } from "@/lib/legal-meta"

type Crumb = { label: string; href?: string }

export function LegalBreadcrumbs({ items }: { items: Crumb[] }) {
  const trail: Crumb[] = [{ label: "Главная", href: "/" }, { label: "Правовая информация", href: LEGAL_LINKS.index }, ...items]

  return (
    <nav aria-label="Хлебные крошки" className="mb-4 flex flex-wrap items-center gap-1 text-xs text-zinc-500 sm:text-sm">
      {trail.map((crumb, i) => {
        const isLast = i === trail.length - 1
        return (
          <span key={`${crumb.label}-${i}`} className="inline-flex items-center gap-1">
            {i > 0 ? <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-300" aria-hidden /> : null}
            {crumb.href && !isLast ? (
              <Link href={crumb.href} className="rounded-md px-0.5 transition hover:text-zinc-900">
                {crumb.label}
              </Link>
            ) : (
              <span className={isLast ? "font-medium text-zinc-700" : undefined}>{crumb.label}</span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
