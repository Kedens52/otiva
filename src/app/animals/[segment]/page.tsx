import type { Metadata } from "next"
import { SeoCategoryPageContent } from "@/components/seo/SeoCategoryPageContent"
import { buildSeoCategoryMetadata } from "@/lib/seo/collections"

type Props = {
  params: { segment: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return buildSeoCategoryMetadata("animals", params.segment)
}

export default function AnimalsSegmentPage({ params }: Props) {
  return <SeoCategoryPageContent categorySlug="animals" segment={params.segment} />
}
