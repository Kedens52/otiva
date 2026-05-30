/** Пути, которые не должны проходить auth/admin middleware. */
export const SEO_TECHNICAL_EXACT = new Set([
  "/robots.txt",
  "/favicon.ico",
  "/sitemap.xml",
  "/sitemap-static.xml",
  "/sitemap-categories.xml",
  "/sitemap-subcategories.xml",
  "/sitemap-cities.xml",
  "/sitemap-category-city.xml",
  "/sitemap-listings.xml",
  "/sitemap-sellers.xml",
  "/sitemap-business.xml",
])

/** Trailing slash → rewrite на канон без 308 (важно для Яндекс.Вебмастера). */
export const SEO_TECHNICAL_TRAILING_SLASH = [
  "/robots.txt/",
  "/favicon.ico/",
  "/sitemap.xml/",
  "/sitemap-static.xml/",
  "/sitemap-categories.xml/",
  "/sitemap-subcategories.xml/",
  "/sitemap-cities.xml/",
  "/sitemap-category-city.xml/",
  "/sitemap-listings.xml/",
  "/sitemap-sellers.xml/",
  "/sitemap-business.xml/",
] as const

export function isSeoTechnicalPath(pathname: string): boolean {
  if (SEO_TECHNICAL_EXACT.has(pathname)) return true
  if (pathname.startsWith("/sitemap") && pathname.endsWith(".xml")) return true
  return false
}

export function isSeoTechnicalTrailingSlash(pathname: string): boolean {
  return (SEO_TECHNICAL_TRAILING_SLASH as readonly string[]).includes(pathname)
}
