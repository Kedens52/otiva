import type { MetadataRoute } from "next"
import { dedupeSitemap } from "@/lib/seo/sitemap-data"
import { sitemapToXml } from "@/lib/seo/sitemap-xml"

const XML_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=3600, s-maxage=3600",
} as const

/** Ответ urlset; 404 если нет URL (Google не принимает пустой urlset). */
export function buildSitemapResponse(entries: MetadataRoute.Sitemap) {
  const xml = sitemapToXml(dedupeSitemap(entries))
  if (!xml) {
    return new Response("Sitemap has no URLs", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  }
  return new Response(xml, { headers: XML_HEADERS })
}
