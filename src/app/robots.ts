import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/profile/settings", "/create", "/favorites", "/chat"],
      },
    ],
    sitemap: "https://nashlo.ru/sitemap.xml",
  }
}
