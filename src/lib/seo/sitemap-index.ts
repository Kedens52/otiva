import { SITE_URL } from "@/lib/seo/site"
import { ROBOTS_SITEMAP_PATHS } from "@/lib/seo/robots-disallow"
import { sitemapPathHasEntries } from "@/lib/seo/sitemap-data"

/** Статический список (документация, robots). */
export function getSitemapIndexItems(now = new Date()) {
  const base = SITE_URL.replace(/\/$/, "")
  const lastmod = now.toISOString()
  return ROBOTS_SITEMAP_PATHS.map((path) => ({
    loc: `${base}${path}`,
    lastmod,
  }))
}

/** Индекс только с непустыми дочерними sitemap (без пустых urlset). */
export async function getActiveSitemapIndexItems(now = new Date()) {
  const base = SITE_URL.replace(/\/$/, "")
  const lastmod = now.toISOString()
  const items: { loc: string; lastmod: string }[] = []

  try {
    for (const path of ROBOTS_SITEMAP_PATHS) {
      if (await sitemapPathHasEntries(path)) {
        items.push({ loc: `${base}${path}`, lastmod })
      }
    }
  } catch (error) {
    console.error("getActiveSitemapIndexItems:", error)
  }

  if (!items.length) {
    items.push({ loc: `${base}/sitemap-static.xml`, lastmod })
  }

  return items
}
