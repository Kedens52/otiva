import { wantToBuySitemapEntries } from "@/lib/seo/sitemap-data"
import { buildSafeUrlsetResponse } from "@/lib/seo/sitemap-route"

export const dynamic = "force-dynamic"
export const revalidate = 3600

export async function GET() {
  return buildSafeUrlsetResponse(() => wantToBuySitemapEntries())
}
