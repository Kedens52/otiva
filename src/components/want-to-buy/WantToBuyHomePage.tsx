"use client"

import Link from "next/link"
import { Suspense } from "react"
import { Plus, Search } from "lucide-react"
import { AdSlot } from "@/components/marketplace/AdSlot"
import { WantToBuyCategoryGrid } from "@/components/want-to-buy/WantToBuyCategoryGrid"
import { WantToBuyFeedSection } from "@/components/want-to-buy/WantToBuyFeedSection"
import { WantToBuyHomeSidebar } from "@/components/want-to-buy/WantToBuyHomeSidebar"
import { PAGE_CONTAINER_WIDE_CLASS } from "@/components/layout/PageContainer"
import { WantToBuyCityParamSync } from "@/components/want-to-buy/WantToBuyCityParamSync"
import type { WantToBuyCategoryOption } from "@/lib/want-to-buy/client-types"
import { STATIC_WANT_TO_BUY_CATEGORIES } from "@/lib/want-to-buy/categories"
import {
  getWantToBuyCreatePath,
  getWantToBuySearchPath,
} from "@/lib/want-to-buy/routes"

type WantToBuyHomePageProps = {
  categories?: WantToBuyCategoryOption[]
}

function FeedSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-[88px] animate-pulse rounded-xl bg-white/90 sm:h-[76px]" />
      ))}
    </div>
  )
}

export function WantToBuyHomePage({
  categories = STATIC_WANT_TO_BUY_CATEGORIES,
}: WantToBuyHomePageProps) {
  return (
    <main className="min-h-screen bg-[#ECECEC]">
      <Suspense fallback={null}>
        <WantToBuyCityParamSync />
      </Suspense>
      <div className={`${PAGE_CONTAINER_WIDE_CLASS} py-3 lg:py-5`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-5">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#000000] sm:text-3xl">
                  Покупки наоборот
                </h1>
                <p className="mt-1 text-sm text-[#4B4B4B] sm:text-base">
                  Оставьте запрос — продавцы сами предложат варианты.
                </p>
                <Link
                  href={getWantToBuySearchPath()}
                  className="mt-2 inline-flex text-sm font-semibold text-[#FF5A00] hover:underline underline-offset-2"
                >
                  Смотреть, что ищут →
                </Link>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Link
                  href={getWantToBuySearchPath()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-semibold text-[#374151] transition hover:bg-zinc-50"
                >
                  <Search className="h-4 w-4 text-[#FF5A00]" />
                  Поиск заявок
                </Link>
                <Link
                  href={getWantToBuyCreatePath()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF5A00] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(255,90,0,0.25)] transition hover:bg-[#E8470F]"
                >
                  <Plus className="h-4 w-4" />
                  Создать заявку
                </Link>
              </div>
            </div>

            <WantToBuyCategoryGrid categories={categories} />

            <div className="lg:hidden">
              <AdSlot slot="mobileLeaderboard" />
            </div>
            <div className="hidden lg:block">
              <AdSlot slot="leaderboard" />
            </div>

            <Suspense fallback={<FeedSkeleton count={4} />}>
              <WantToBuyFeedSection
                categories={categories}
                title="Горячие заявки"
                fixedSort="offers"
                pageSize={4}
                viewAllHref={getWantToBuySearchPath({ sort: "offers" })}
                cardLayout="list"
              />
            </Suspense>

            <Suspense fallback={<FeedSkeleton count={4} />}>
              <WantToBuyFeedSection
                categories={categories}
                title="Без откликов — успейте первым"
                fixedSort="no_offers"
                pageSize={4}
                viewAllHref={getWantToBuySearchPath({ sort: "no_offers" })}
                cardLayout="list"
              />
            </Suspense>

            <Suspense fallback={<FeedSkeleton count={6} />}>
              <WantToBuyFeedSection
                categories={categories}
                title="Все свежие заявки"
                showFilters
                basePath={getWantToBuySearchPath()}
                pageSize={8}
                viewAllHref={getWantToBuySearchPath()}
                cardLayout="list"
              />
            </Suspense>
          </div>

          <WantToBuyHomeSidebar />
        </div>
      </div>
    </main>
  )
}
