import type { Metadata } from "next"
import Link from "next/link"
import { MARKETPLACE_CATEGORIES } from "@/config/marketplace-categories"
import { PAGE_CONTAINER_WIDE_CLASS } from "@/components/layout/PageContainer"
import { WantToBuyCollectionJsonLd } from "@/components/seo/WantToBuyCollectionJsonLd"
import { loadWantToBuyCategories } from "@/lib/want-to-buy/categories"
import {
  getWantToBuyCategoriesPath,
  getWantToBuyCategoryPath,
  getWantToBuyCreatePath,
  getWantToBuyHubPath,
} from "@/lib/want-to-buy/routes"
import {
  WANT_TO_BUY_CATEGORIES_SEO,
  buildWantToBuyCategoriesMetadata,
} from "@/lib/seo/want-to-buy-metadata"

export const metadata: Metadata = buildWantToBuyCategoriesMetadata()

export default async function KypluCategoriesPage() {
  const categories = await loadWantToBuyCategories()
  const hubPath = getWantToBuyHubPath()

  return (
    <>
      <WantToBuyCollectionJsonLd
        title={WANT_TO_BUY_CATEGORIES_SEO.jsonLdTitle}
        description={WANT_TO_BUY_CATEGORIES_SEO.jsonLdDescription}
        path={getWantToBuyCategoriesPath()}
        breadcrumbs={[
          { label: "Главная", href: "/" },
          { label: "Куплю", href: hubPath },
          { label: "Категории", href: null },
        ]}
      />
      <div className={`${PAGE_CONTAINER_WIDE_CLASS} py-8 lg:py-10`}>
        <nav className="mb-4 text-sm text-[#4B4B4B]">
          <Link href={hubPath} className="hover:text-[#FF5A00]">
            Куплю
          </Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-[#000000]">Категории</span>
        </nav>

        <h1 className="text-2xl font-bold text-[#000000] sm:text-3xl">Категории заявок</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#4B4B4B] sm:text-base">
          Выберите раздел и смотрите, что ищут покупатели, или оставьте свою заявку.
        </p>

        <section className="mt-6 rounded-[16px] border border-[rgba(15,23,42,0.06)] bg-white px-4 py-4 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-4 sm:px-5">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#111827]">Продаёте?</p>
            <p className="mt-1 text-sm text-[#6B7280]">
              Смотрите объявления по категориям — что предлагают другие продавцы.
            </p>
          </div>
          <Link
            href="/categories"
            className="mt-3 inline-flex shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-[#F7F8FA] px-4 py-2.5 text-sm font-semibold text-[#111827] transition hover:border-zinc-300 hover:bg-white sm:mt-0"
          >
            Каталог объявлений
          </Link>
        </section>

        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => {
            const meta = MARKETPLACE_CATEGORIES.find((m) => m.slug === cat.slug)
            return (
              <li key={cat.slug}>
                <Link
                  href={getWantToBuyCategoryPath(cat.slug)}
                  className="flex items-start gap-3 rounded-[16px] border border-[rgba(15,23,42,0.06)] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="text-2xl" aria-hidden>
                    {meta?.icon ?? "📦"}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-[#000000]">
                      {meta?.title ?? cat.nameRu}
                    </span>
                    {meta?.createHints?.[0] ? (
                      <span className="mt-1 block text-sm text-[#4B4B4B] line-clamp-2">
                        {meta.createHints[0]}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="mt-10 text-center">
          <Link
            href={getWantToBuyCreatePath()}
            className="inline-flex items-center justify-center rounded-xl bg-[#FF5A00] px-6 py-3 text-sm font-semibold text-white hover:bg-[#E8470F]"
          >
            Создать заявку
          </Link>
        </div>
      </div>
    </>
  )
}
