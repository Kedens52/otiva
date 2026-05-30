import type { MetadataRoute } from "next"
import { getPublicSiteHostname, SITE_URL } from "@/lib/seo/site"
import { ROBOTS_DISALLOW } from "@/lib/seo/robots-disallow"

/** Единый источник правил robots.txt (app/robots.ts и public/robots.txt). */
export function buildRobotsConfig(): MetadataRoute.Robots {
  const baseUrl = SITE_URL.replace(/\/$/, "")

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...ROBOTS_DISALLOW],
    },
    // Always point to the sitemapindex — Google will discover all child sitemaps from there.
    sitemap: `${baseUrl}/sitemap.xml`,
    host: getPublicSiteHostname(),
  }
}

export function robotsTxtBody(): string {
  const config = buildRobotsConfig()
  const rules = Array.isArray(config.rules) ? config.rules[0] : config.rules
  const lines: string[] = [`User-Agent: ${rules.userAgent ?? "*"}`]

  const allow = rules.allow
  if (typeof allow === "string") lines.push(`Allow: ${allow}`)
  else if (Array.isArray(allow)) for (const a of allow) lines.push(`Allow: ${a}`)

  const disallow = rules.disallow
  if (typeof disallow === "string") lines.push(`Disallow: ${disallow}`)
  else if (Array.isArray(disallow)) for (const d of disallow) lines.push(`Disallow: ${d}`)

  if (config.host) lines.push("", `Host: ${config.host}`)
  if (config.sitemap) {
    const sitemaps = Array.isArray(config.sitemap) ? config.sitemap : [config.sitemap]
    for (const s of sitemaps) lines.push(`Sitemap: ${s}`)
  }

  return lines.join("\n") + "\n"
}
