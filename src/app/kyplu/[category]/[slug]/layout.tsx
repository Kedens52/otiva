import { prisma } from "@/lib/prisma"
import { JsonLdScripts } from "@/components/business/JsonLdScripts"
import { buildWantToBuyJsonLd } from "@/lib/seo/jsonld"
import { getWantToBuyPublicPath } from "@/lib/seo/paths"
import { isWantToBuyIndexable } from "@/lib/seo/want-to-buy-indexability"
import { parseWantToBuyDetailSlug } from "@/lib/want-to-buy/routes"

type Props = {
  children: React.ReactNode
  params: { category: string; slug: string }
}

function textDescription(value?: string | null) {
  const clean = (value || "").replace(/\s+/g, " ").trim()
  return clean
    ? clean.slice(0, 160)
    : "Заявка покупателя на Нашло: опишите, что ищете, и получите предложения от продавцов."
}

export default async function KypluDetailLayout({ children, params }: Props) {
  const id = parseWantToBuyDetailSlug(params.slug)
  const row = await prisma.wantToBuy.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priceMax: true,
      city: true,
      createdAt: true,
      category: { select: { slug: true, nameRu: true } },
    },
  })

  if (!row || row.category.slug !== params.category || !isWantToBuyIndexable(row.status)) {
    return children
  }

  const path = getWantToBuyPublicPath({ id: row.id, categorySlug: row.category.slug })
  const jsonLd = buildWantToBuyJsonLd({
    id: row.id,
    title: row.title,
    description: textDescription(row.description),
    path,
    priceMax: row.priceMax,
    city: row.city,
    createdAt: row.createdAt,
    categoryName: row.category.nameRu,
  })

  return (
    <>
      <JsonLdScripts data={jsonLd} />
      {children}
    </>
  )
}
