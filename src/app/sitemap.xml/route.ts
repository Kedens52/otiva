import { buildSafeSitemapIndexResponse } from "@/lib/seo/sitemap-route"

export const dynamic = "force-dynamic"
export const revalidate = 3600

/** Индекс sitemap: ссылается на статику, категории, города, объявления, продавцов, B2B. */
export async function GET() {
  return buildSafeSitemapIndexResponse()
}
