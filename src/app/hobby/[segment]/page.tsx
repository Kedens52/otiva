import type { Metadata } from "next"
import { SeoCategoryPageContent } from "@/components/seo/SeoCategoryPageContent"
import { buildSeoCategoryMetadata } from "@/lib/seo/collections"

type Props = {
  params: { segment: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return buildSeoCategoryMetadata("hobby", params.segment)
}

export default function HobbySegmentPage({ params }: Props) {
  return <SeoCategoryPageContent categorySlug="hobby" segment={params.segment} />
}
