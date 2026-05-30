import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { WantToBuyDetail } from "@/components/want-to-buy/WantToBuyDetail"
import { buildWantToBuyDetailMetadata } from "@/lib/want-to-buy/detail-metadata"
import { getWantToBuyDetailPath, parseWantToBuyDetailSlug } from "@/lib/want-to-buy/routes"

type PageProps = { params: { category: string; slug: string } }

export async function generateMetadata({ params }: PageProps) {
  return buildWantToBuyDetailMetadata(parseWantToBuyDetailSlug(params.slug), params.category)
}

export default async function KypluDetailRoutePage({ params }: PageProps) {
  const categoryRow = await prisma.category.findFirst({
    where: { slug: params.category, isActive: true },
    select: { slug: true },
  })
  if (!categoryRow) {
    notFound()
  }

  const id = parseWantToBuyDetailSlug(params.slug)
  const row = await prisma.wantToBuy.findUnique({
    where: { id },
    select: { id: true, category: { select: { slug: true } } },
  })

  if (!row) {
    notFound()
  }

  if (row.category.slug !== params.category) {
    redirect(getWantToBuyDetailPath({ id: row.id, categorySlug: row.category.slug }))
  }

  return (
    <div className="px-4 py-8 sm:px-6 sm:py-10">
      <WantToBuyDetail id={id} />
    </div>
  )
}
