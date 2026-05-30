import Link from "next/link"
import type { BreadcrumbItem } from "@/lib/categories/listing-breadcrumbs"
import { PAGE_CONTAINER_WIDE_CLASS } from "@/components/layout/PageContainer"

interface Props {
  crumbs: BreadcrumbItem[]
}

/**
 * Breadcrumb bar for listing detail pages.
 * Rendered inside the listing page component so it has access to real listing data.
 *
 * Visual spec:
 *   Главная › Авто › Легковые автомобили › Skoda Octavia A7
 * - Links are subtle gray, hover → zinc-950
 * - Current page (last item) is semibold, dark
 * - Separator: ›
 * - Mobile: wraps but does not cause horizontal scroll
 * - Middle items hidden on very small screens if chain is long (via CSS)
 */
export function ListingBreadcrumbs({ crumbs }: Props) {
  if (!crumbs.length) return null

  return (
    <nav
      aria-label="Хлебные крошки"
      className="border-b border-zinc-100 bg-white"
    >
      <div className={`${PAGE_CONTAINER_WIDE_CLASS} flex flex-wrap items-center gap-x-1.5 gap-y-1 overflow-hidden py-3 text-sm text-zinc-400`}>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1
          const isFirst = index === 0

          // Hide middle items on very narrow screens (keep first + last two)
          const hiddenOnMobile =
            !isFirst && !isLast && index < crumbs.length - 2

          return (
            <span
              key={index}
              className={`flex items-center gap-x-1.5 ${hiddenOnMobile ? "hidden sm:flex" : "flex"}`}
            >
              {index > 0 && (
                <span className="text-zinc-300 select-none" aria-hidden="true">
                  &#8250;
                </span>
              )}
              {isLast ? (
                <span
                  className="max-w-[200px] truncate font-semibold text-zinc-900 sm:max-w-[360px] md:max-w-none"
                  aria-current="page"
                >
                  {crumb.label}
                </span>
              ) : crumb.href ? (
                <Link
                  href={crumb.href}
                  className="max-w-[120px] truncate text-zinc-500 hover:text-zinc-950 transition sm:max-w-none"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-zinc-500">{crumb.label}</span>
              )}
            </span>
          )
        })}
      </div>
    </nav>
  )
}
