import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { WantToBuyFeedSection } from "@/components/want-to-buy/WantToBuyFeedSection"
import { PAGE_CONTAINER_WIDE_CLASS } from "@/components/layout/PageContainer"
import { WantToBuyCollectionJsonLd } from "@/components/seo/WantToBuyCollectionJsonLd"
import { loadWantToBuyCategories } from "@/lib/want-to-buy/categories"
import { getWantToBuyHubPath, getWantToBuySearchPath } from "@/lib/want-to-buy/routes"
import {
  WANT_TO_BUY_SEARCH_SEO,
  buildWantToBuySearchMetadata,
} from "@/lib/seo/want-to-buy-metadata"

export const metadata: Metadata = buildWantToBuySearchMetadata()

export default async function KypluSearchPage() {
  const categories = await loadWantToBuyCategories()
  const hubPath = getWantToBuyHubPath()
  const searchPath = getWantToBuySearchPath()

  return (
    <>
      <WantToBuyCollectionJsonLd
        title={WANT_TO_BUY_SEARCH_SEO.jsonLdTitle}
        description={WANT_TO_BUY_SEARCH_SEO.jsonLdDescription}
        path={searchPath}
        breadcrumbs={[
          { label: "Главная", href: "/" },
          { label: "Куплю", href: hubPath },
          { label: "Поиск", href: null },
        ]}
      />
      <div className={`${PAGE_CONTAINER_WIDE_CLASS} py-6 lg:py-8`}>
      <nav className="mb-4 text-sm text-[#4B4B4B]">
        <Link href={hubPath} className="hover:text-[#FF5A00]">
          Куплю
        </Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-[#000000]">Поиск</span>
      </nav>

      <h1 className="text-2xl font-bold text-[#000000] sm:text-3xl">Поиск заявок</h1>
      <p className="mt-1 max-w-2xl text-sm text-[#4B4B4B] sm:text-base">
        Найдите покупателя по запросу, категории, городу и бюджету — и предложите свой товар.
      </p>

      <div className="mt-6">
        <Suspense
          fallback={
            <div className="grid gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[88px] animate-pulse rounded-xl bg-white/80 sm:h-[76px]" />
              ))}
            </div>
          }
        >
          <WantToBuyFeedSection categories={categories} showFilters basePath={searchPath} />
        </Suspense>
      </div>
    </div>
    </>
  )
}
