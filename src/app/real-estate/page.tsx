import type { Metadata } from "next"
import { SeoCategoryPageContent } from "@/components/seo/SeoCategoryPageContent"
import { buildSeoCategoryMetadata } from "@/lib/seo/collections"

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoCategoryMetadata("real-estate")
}

export default function RealEstatePage() {
  return <SeoCategoryPageContent categorySlug="real-estate" />
}
