import type { Metadata } from "next"
import { FeedPage } from "@/components/feed/FeedPage"
import { HomeJsonLd } from "@/components/seo/HomeJsonLd"
import { generateHomeMetadata } from "@/lib/seo/metadata"

export const metadata: Metadata = generateHomeMetadata()
export const revalidate = 3600

export default function HomePage() {
  return (
    <>
      <HomeJsonLd />
      <FeedPage />
    </>
  )
}
