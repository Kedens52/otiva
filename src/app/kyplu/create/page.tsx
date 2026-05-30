import type { Metadata } from "next"
import { WantToBuyCreateGate } from "@/components/want-to-buy/WantToBuyCreateGate"
import { PAGE_CONTAINER_WIDE_CLASS } from "@/components/layout/PageContainer"
import { loadWantToBuyCategories } from "@/lib/want-to-buy/categories"
import { getWantToBuyCreatePath } from "@/lib/want-to-buy/routes"
import { buildNoindexMetadata } from "@/lib/seo/site"

export const metadata: Metadata = buildNoindexMetadata({
  title: "Создать заявку | Куплю | Нашло",
  description: "Разместите заявку «Куплю» на Нашло.",
  path: getWantToBuyCreatePath(),
})

export default async function KypluCreatePage() {
  const categories = await loadWantToBuyCategories()

  return (
    <div className={`${PAGE_CONTAINER_WIDE_CLASS} py-5 lg:py-8`}>
      <WantToBuyCreateGate categories={categories} />
    </div>
  )
}
