"use client"

import Link from "next/link"
import { useState } from "react"
import type { SeoCategoryPageState } from "@/lib/seo/collections"
import { buildCategorySeoFooterText } from "@/lib/seo/seo-text"
import { getRelatedSeoCategories } from "@/lib/seo/categories"
import { getCategorySeoPath } from "@/lib/seo/paths"
import { getIndexableSeoLandings } from "@/lib/seo/landings"
import { PAGE_CONTAINER_WIDE_CLASS } from "@/components/layout/PageContainer"

type Props = {
  state: SeoCategoryPageState
  listingCount: number
  popularCities?: Array<{ city: string; href: string }>
  recentListingHrefs?: Array<{ title: string; href: string }>
}

export function SeoCategoryFooter({
  state,
  listingCount,
  popularCities = [],
  recentListingHrefs = [],
}: Props) {
  const [expanded, setExpanded] = useState(false)
  const seoText = buildCategorySeoFooterText(state, listingCount, state.config.children.map((c) => c.label))
  const related = getRelatedSeoCategories(state.config.slug)
  const landings = getIndexableSeoLandings().filter((l) => l.categorySlug === state.config.slug).slice(0, 6)

  return (
    <section className={`${PAGE_CONTAINER_WIDE_CLASS} mt-10 border-t border-zinc-100 py-8`}>
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-sm font-semibold text-zinc-700 underline-offset-2 hover:underline"
        >
          {expanded ? "Свернуть" : "Подробнее о разделе"}
        </button>
        {expanded ? (
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">{seoText}</p>
        ) : null}
      </div>
      <p className="hidden text-sm leading-relaxed text-zinc-600 lg:block">{seoText}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {landings.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Популярные запросы</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {landings.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/s/${item.slug}`}
                    className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-300"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {popularCities.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Популярные города</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {popularCities.slice(0, 12).map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-300"
                  >
                    {item.city}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Похожие категории</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {related.map((cat) => (
              <li key={cat.slug}>
                <Link
                  href={getCategorySeoPath(cat.slug)}
                  className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-300"
                >
                  {cat.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {state.config.children.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Подкатегории</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {state.config.children.map((child) => (
                <li key={child.slug}>
                  <Link
                    href={getCategorySeoPath(state.config.slug, child.slug)}
                    className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-300"
                  >
                    {child.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {recentListingHrefs.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-zinc-900">Недавно добавленные</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {recentListingHrefs.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-sm text-zinc-700 hover:text-zinc-950 hover:underline">
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
