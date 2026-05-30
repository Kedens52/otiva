import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Нашло Staff — поддержка",
    short_name: "Нашло Staff",
    description: "Десктоп-приложение для операторов поддержки и администраторов Нашло.",
    start_url: "/admin/app/support",
    scope: "/admin/app",
    display: "standalone",
    orientation: "any",
    background_color: "#f4f4f5",
    theme_color: "#18181b",
    lang: "ru-RU",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/otiva-logo-mark.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/otiva-logo-mark.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
