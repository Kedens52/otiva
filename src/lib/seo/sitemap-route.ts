import type { MetadataRoute } from "next"
import { buildSitemapResponse } from "@/lib/seo/sitemap-response"
import { dedupeSitemap } from "@/lib/seo/sitemap-data"
import { getActiveSitemapIndexItems } from "@/lib/seo/sitemap-index"
import { SITE_URL } from "@/lib/seo/site"
import { sitemapIndexXml } from "@/lib/seo/sitemap-xml"

export const SITEMAP_XML_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=3600, s-maxage=3600",
} as const

const EMPTY_INDEX =
  '<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></sitemapindex>'

function staticIndexFallback() {
  const base = SITE_URL.replace(/\/$/, "")
  return (
    sitemapIndexXml([
      {
        loc: `${base}/sitemap-static.xml`,
        lastmod: new Date().toISOString(),
      },
    ]) ?? EMPTY_INDEX
  )
}

/** Безопасный sitemapindex — не отдаём 500 при сбое БД. */
export async function buildSafeSitemapIndexResponse(): Promise<Response> {
  try {
    const items = await getActiveSitemapIndexItems()
    const xml = sitemapIndexXml(items) ?? staticIndexFallback()
    return new Response(xml, { headers: SITEMAP_XML_HEADERS })
  } catch (error) {
    console.error("sitemap index error:", error)
    return new Response(staticIndexFallback(), { headers: SITEMAP_XML_HEADERS })
  }
}

/** Безопасный urlset — 404 если пусто, 503 только при фатальной ошибке. */
export async function buildSafeUrlsetResponse(
  loadEntries: () => Promise<MetadataRoute.Sitemap> | MetadataRoute.Sitemap,
): Promise<Response> {
  try {
    const raw = await loadEntries()
    return buildSitemapResponse(dedupeSitemap(raw))
  } catch (error) {
    console.error("sitemap urlset error:", error)
    return new Response("Sitemap temporarily unavailable", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  }
}
