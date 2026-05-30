import type { Metadata } from "next"
import { SeoCategoryPageContent } from "@/components/seo/SeoCategoryPageContent"
import { buildSeoCategoryMetadata } from "@/lib/seo/collections"

type Props = {
  params: { segment: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return buildSeoCategoryMetadata("transport", params.segment)
}

export default function TransportSegmentPage({ params }: Props) {
  return <SeoCategoryPageContent categorySlug="transport" segment={params.segment} />
}
