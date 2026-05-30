import type { Metadata } from "next"
import { SeoCategoryPageContent } from "@/components/seo/SeoCategoryPageContent"
import { buildSeoCategoryMetadata } from "@/lib/seo/collections"

type Props = {
  params: { segment: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return buildSeoCategoryMetadata("electronics", params.segment)
}

export default function ElectronicsSegmentPage({ params }: Props) {
  return <SeoCategoryPageContent categorySlug="electronics" segment={params.segment} />
}
