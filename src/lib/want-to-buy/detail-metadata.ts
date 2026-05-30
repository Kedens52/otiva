import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { buildNoindexMetadata } from "@/lib/seo/site"
import {
  buildWantToBuyDetailDescription,
  buildWantToBuyDetailPageTitle,
  buildWantToBuyPageMetadata,
} from "@/lib/seo/want-to-buy-metadata"
import { getWantToBuyDetailPath } from "@/lib/want-to-buy/routes"

export async function buildWantToBuyDetailMetadata(
  wantToBuyId: string,
  categorySlug: string,
): Promise<Metadata> {
  const row = await prisma.wantToBuy.findUnique({
    where: { id: wantToBuyId },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      category: { select: { slug: true, nameRu: true } },
    },
  })

  if (!row || row.category.slug !== categorySlug) {
    return buildNoindexMetadata({
      title: "Заявка не найдена | Нашло",
      description: "Заявка покупателя в разделе «Куплю» на Нашло.",
      path: getWantToBuyDetailPath({ id: wantToBuyId, categorySlug }),
    })
  }

  const path = getWantToBuyDetailPath({ id: row.id, categorySlug: row.category.slug })
  const noindex = row.status !== "ACTIVE"

  return buildWantToBuyPageMetadata({
    title: buildWantToBuyDetailPageTitle(row.title),
    description: buildWantToBuyDetailDescription(
      row.title,
      row.description,
      row.category.nameRu,
    ),
    path,
    canonicalPath: noindex ? undefined : path,
    noindex,
    keywordHints: [row.category.nameRu, row.title],
  })
}
