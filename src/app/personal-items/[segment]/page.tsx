import type { Metadata } from "next"
import { SeoCategoryPageContent } from "@/components/seo/SeoCategoryPageContent"
import { buildSeoCategoryMetadata } from "@/lib/seo/collections"

type Props = {
  params: { segment: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return buildSeoCategoryMetadata("personal-items", params.segment)
}

export default function PersonalItemsSegmentPage({ params }: Props) {
  return <SeoCategoryPageContent categorySlug="personal-items" segment={params.segment} />
}
