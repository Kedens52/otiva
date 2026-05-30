import { describe, expect, it } from "vitest"
import { sitemapToXml } from "@/lib/seo/sitemap-xml"

describe("sitemapToXml", () => {
  it("returns null for empty entries", () => {
    expect(sitemapToXml([])).toBeNull()
  })

  it("includes url tags when entries exist", () => {
    const xml = sitemapToXml([
      {
        url: "https://nashlo.ru/category/transport/moskva",
        lastModified: new Date("2026-05-01"),
        changeFrequency: "weekly",
        priority: 0.65,
      },
    ])
    expect(xml).toContain("<urlset")
    expect(xml).toContain("<url>")
    expect(xml).toContain("<loc>https://nashlo.ru/category/transport/moskva</loc>")
  })
})
