import type { Metadata } from "next"
import { SellerJsonLd } from "@/components/seo/SellerJsonLd"
import { generateSellerMetadata } from "@/lib/seo/metadata"
import { parseSellerIdFromSlug } from "@/lib/seo/slug"

type Props = {
  params: { name: string }
  children: React.ReactNode
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return generateSellerMetadata(parseSellerIdFromSlug(params.name))
}

export default function SellerSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { name: string }
}) {
  return (
    <>
      <SellerJsonLd slugOrId={params.name} />
      {children}
    </>
  )
}
