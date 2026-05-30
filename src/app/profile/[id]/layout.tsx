/**
 * Public seller profile layout.
 *
 * Intentionally overrides the noindex set in parent `profile/layout.tsx`.
 * Route /profile/[id] is a PUBLIC page (seller listings, reviews, trust signals)
 * and must be indexable by search engines.
 *
 * Note: the page itself is "use client" so detailed metadata (seller name, city)
 * cannot be resolved server-side without an extra DB call.
 * The generic canonical below is correct — Google will consolidate it.
 */

import type { Metadata } from "next"
import { SellerJsonLd } from "@/components/seo/SellerJsonLd"
import { generateSellerMetadata } from "@/lib/seo/metadata"
import { parseSellerIdFromSlug } from "@/lib/seo/slug"

type Props = {
  params: { id: string }
  children: React.ReactNode
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    return await generateSellerMetadata(parseSellerIdFromSlug(params.id))
  } catch {
    const { buildNoindexMetadata } = await import("@/lib/seo/site")
    return buildNoindexMetadata({
      title: "Профиль продавца | Нашло",
      description: "Публичный профиль на Нашло.",
      path: `/profile/${params.id}`,
    })
  }
}

export default function PublicProfileLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { id: string }
}) {
  return (
    <>
      <SellerJsonLd slugOrId={params.id} />
      {children}
    </>
  )
}
