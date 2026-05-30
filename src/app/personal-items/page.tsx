import type { Metadata } from "next"
import { SeoCategoryPageContent } from "@/components/seo/SeoCategoryPageContent"
import { buildSeoCategoryMetadata } from "@/lib/seo/collections"

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoCategoryMetadata("personal-items")
}

export default function PersonalItemsPage() {
  return <SeoCategoryPageContent categorySlug="personal-items" />
}
