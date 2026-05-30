import type { Metadata } from "next"
import { SeoCategoryPageContent } from "@/components/seo/SeoCategoryPageContent"
import { buildSeoCategoryMetadata } from "@/lib/seo/collections"

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoCategoryMetadata("home-and-garden")
}

export default function HomeAndGardenPage() {
  return <SeoCategoryPageContent categorySlug="home-and-garden" />
}
