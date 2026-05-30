import type { Metadata } from "next"
import { SeoCategoryPageContent } from "@/components/seo/SeoCategoryPageContent"
import { buildSeoCategoryMetadata } from "@/lib/seo/collections"

type Props = {
  params: { segment: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return buildSeoCategoryMetadata("home-and-garden", params.segment)
}

export default function HomeAndGardenSegmentPage({ params }: Props) {
  return <SeoCategoryPageContent categorySlug="home-and-garden" segment={params.segment} />
}
