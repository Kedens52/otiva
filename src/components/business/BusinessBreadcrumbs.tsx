import Link from "next/link"
import { ChevronRight } from "lucide-react"
import type { BreadcrumbItem } from "@/lib/business/jsonld"

export function BusinessBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) return null

  return (
    <nav aria-label="Хлебные крошки" className="mb-4 flex flex-wrap items-center gap-1 text-sm text-zinc-500">
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <span key={`${item.href}-${i}`} className="inline-flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />}
            {isLast ? (
              <span className="font-medium text-zinc-700">{item.name}</span>
            ) : (
              <Link href={item.href} className="hover:text-[hsl(var(--nashlo-orange))]">
                {item.name}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
