"use client"

import Link from "next/link"
import { Suspense } from "react"
import { CATEGORY_META } from "@/lib/listing-types"
import { WantToBuyFeedSection } from "@/components/want-to-buy/WantToBuyFeedSection"
import { WantToBuyCategoryCta } from "@/components/want-to-buy/WantToBuyCategoryCta"
import type { WantToBuyCategoryOption } from "@/lib/want-to-buy/client-types"
import { getWantToBuyCategoryPath, getWantToBuyHubPath } from "@/lib/want-to-buy/routes"
import { PAGE_CONTAINER_WIDE_CLASS } from "@/components/layout/PageContainer"

type WantToBuyCategoryPageProps = {
  categorySlug: string
  categories: WantToBuyCategoryOption[]
}

export function WantToBuyCategoryPage({ categorySlug, categories }: WantToBuyCategoryPageProps) {
  const meta = CATEGORY_META.find((c) => c.slug === categorySlug)
  const title = meta?.title ?? categorySlug

  return (
    <div className={`${PAGE_CONTAINER_WIDE_CLASS} py-6 lg:py-8`}>
      <nav className="mb-4 text-sm text-[#4B4B4B]">
        <Link href={getWantToBuyHubPath()} className="hover:text-[#FF5A00]">
          Куплю
        </Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-[#000000]">{title}</span>
      </nav>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-[#000000] sm:text-3xl">Заявки: {title}</h1>
            <p className="mt-1 text-sm text-[#4B4B4B]">
              Покупатели ищут товары в категории «{title}». Предложите свой товар.
            </p>
          </div>

          <Suspense
            fallback={
            <div className="grid gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[88px] animate-pulse rounded-xl bg-white/80 sm:h-[76px]" />
              ))}
            </div>
            }
          >
            <WantToBuyFeedSection
              categories={categories}
              fixedCategorySlug={categorySlug}
              basePath={getWantToBuyCategoryPath(categorySlug)}
              showFilters
              hideCategoryFilter
              emptyVariant="category"
              viewAllHref={`${getWantToBuyCategoryPath(categorySlug)}`}
              cardLayout="list"
              compact
            />
          </Suspense>
        </div>

        <aside className="w-full shrink-0 space-y-4 lg:w-[280px]">
          <WantToBuyCategoryCta categorySlug={categorySlug} />
        </aside>
      </div>
    </div>
  )
}
