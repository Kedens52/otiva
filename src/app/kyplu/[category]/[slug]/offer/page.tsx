import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { WantToBuyOfferPage } from "@/components/want-to-buy/WantToBuyOfferPage"
import { buildNoindexMetadata } from "@/lib/seo/site"
import { prisma } from "@/lib/prisma"
import { getWantToBuyOfferPath, parseWantToBuyDetailSlug } from "@/lib/want-to-buy/routes"

type PageProps = { params: { category: string; slug: string } }

export function generateMetadata({ params }: PageProps): Metadata {
  const id = parseWantToBuyDetailSlug(params.slug)
  return buildNoindexMetadata({
    title: "Отклик на заявку | Нашло",
    description: "Предложите товар по заявке покупателя.",
    path: getWantToBuyOfferPath({ id, categorySlug: params.category }),
  })
}

export default async function KypluOfferRoutePage({ params }: PageProps) {
  const categoryRow = await prisma.category.findFirst({
    where: { slug: params.category, isActive: true },
    select: { slug: true },
  })
  if (!categoryRow) {
    notFound()
  }
  const wantToBuyId = parseWantToBuyDetailSlug(params.slug)
  return (
    <div className="px-4 py-8 sm:px-6 sm:py-10">
      <WantToBuyOfferPage wantToBuyId={wantToBuyId} />
    </div>
  )
}
