import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { WantToBuyCategoryPage } from "@/components/want-to-buy/WantToBuyCategoryPage"
import { WantToBuyCollectionJsonLd } from "@/components/seo/WantToBuyCollectionJsonLd"
import type { Metadata } from "next"
import { CATEGORY_META } from "@/lib/listing-types"
import {
  buildWantToBuyCategoryJsonLdDescription,
  buildWantToBuyCategoryMetadata,
} from "@/lib/seo/want-to-buy-metadata"
import {
  getWantToBuyCategoryPath,
  getWantToBuyDetailPath,
  getWantToBuyHubPath,
  isWantToBuyIdSegment,
} from "@/lib/want-to-buy/routes"

type PageProps = { params: { category: string } }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const cat = await prisma.category.findFirst({
    where: { slug: params.category, isActive: true },
    select: { slug: true, nameRu: true },
  })
  if (!cat) {
    return buildWantToBuyCategoryMetadata("товары", getWantToBuyCategoryPath(params.category))
  }
  const meta = CATEGORY_META.find((c) => c.slug === cat.slug)
  const title = meta?.title ?? cat.nameRu
  return buildWantToBuyCategoryMetadata(title, getWantToBuyCategoryPath(cat.slug))
}

export default async function KypluCategoryRoutePage({ params }: PageProps) {
  const categoryRow = await prisma.category.findFirst({
    where: { slug: params.category, isActive: true },
    select: { slug: true },
  })

  if (categoryRow) {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { nameRu: "asc" }],
      select: { slug: true, nameRu: true },
    })
    const meta = CATEGORY_META.find((c) => c.slug === categoryRow.slug)
    const title = meta?.title ?? categories.find((c) => c.slug === categoryRow.slug)?.nameRu ?? categoryRow.slug
    const path = getWantToBuyCategoryPath(categoryRow.slug)

    return (
      <>
        <WantToBuyCollectionJsonLd
          title={`Куплю ${title.toLowerCase()} — заявки покупателей`}
          description={buildWantToBuyCategoryJsonLdDescription(title)}
          path={path}
          breadcrumbs={[
            { label: "Главная", href: "/" },
            { label: "Куплю", href: getWantToBuyHubPath() },
            { label: title, href: null },
          ]}
        />
        <WantToBuyCategoryPage categorySlug={categoryRow.slug} categories={categories} />
      </>
    )
  }

  if (isWantToBuyIdSegment(params.category)) {
    try {
      const row = await prisma.wantToBuy.findUnique({
        where: { id: params.category },
        select: { id: true, category: { select: { slug: true } } },
      })
      if (row) {
        redirect(getWantToBuyDetailPath({ id: row.id, categorySlug: row.category.slug }))
      }
    } catch (error) {
      console.error("kyplu legacy id redirect:", error)
    }
  }

  notFound()
}
