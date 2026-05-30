import { prisma } from "@/lib/prisma"
import { generateJsonLd } from "@/lib/seo/jsonld"
import { getSellerPublicPath } from "@/lib/seo/paths"
import { parseSellerIdFromSlug } from "@/lib/seo/slug"

type Props = {
  slugOrId: string
}

export async function SellerJsonLd({ slugOrId }: Props) {
  const userId = parseSellerIdFromSlug(slugOrId)

  let user: {
    id: string
    name: string | null
    city: string | null
    description: string | null
    publicSlug?: string | null
    isBanned: boolean
    listings: { id: string }[]
  } | null = null

  try {
    user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        city: true,
        description: true,
        publicSlug: true,
        isBanned: true,
        listings: { where: { status: "ACTIVE" }, select: { id: true }, take: 1 },
      },
    })
  } catch {
    user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        city: true,
        description: true,
        isBanned: true,
        listings: { where: { status: "ACTIVE" }, select: { id: true }, take: 1 },
      },
    })
  }

  if (!user || user.isBanned || !user.listings.length) return null

  const path = getSellerPublicPath({
    id: user.id,
    slug: user.publicSlug,
    name: user.name,
  })
  const name = user.name?.trim() || "Продавец"
  const jsonLd = generateJsonLd("seller", {
    name,
    description: user.description,
    path,
    city: user.city,
  })

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
