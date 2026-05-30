import type { Metadata } from "next"
import { SeoCategoryPageContent } from "@/components/seo/SeoCategoryPageContent"
import { buildSeoCategoryMetadata } from "@/lib/seo/collections"

type Props = {
  params: { segment: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return buildSeoCategoryMetadata("real-estate", params.segment)
}

export default function RealEstateSegmentPage({ params }: Props) {
  return <SeoCategoryPageContent categorySlug="real-estate" segment={params.segment} />
}
