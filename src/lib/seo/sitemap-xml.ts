import type { MetadataRoute } from "next"

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

/** Пустой urlset без &lt;url&gt; Google отклоняет — возвращаем null. */
export function sitemapToXml(entries: MetadataRoute.Sitemap): string | null {
  if (!entries.length) return null

  const urls = entries
    .map((entry) => {
      const lastmod = entry.lastModified
        ? `<lastmod>${new Date(entry.lastModified).toISOString()}</lastmod>`
        : ""
      const changefreq = entry.changeFrequency
        ? `<changefreq>${entry.changeFrequency}</changefreq>`
        : ""
      const priority =
        typeof entry.priority === "number" ? `<priority>${entry.priority}</priority>` : ""
      return `<url><loc>${escapeXml(entry.url)}</loc>${lastmod}${changefreq}${priority}</url>`
    })
    .join("")

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`
}

export function sitemapIndexXml(items: { loc: string; lastmod?: string }[]): string | null {
  if (!items.length) return null

  const body = items
    .map((item) => {
      const lastmod = item.lastmod ? `<lastmod>${item.lastmod}</lastmod>` : ""
      return `<sitemap><loc>${escapeXml(item.loc)}</loc>${lastmod}</sitemap>`
    })
    .join("")
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`
}
