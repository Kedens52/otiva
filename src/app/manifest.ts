import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Нашло — бесплатные объявления рядом",
    short_name: "Нашло",
    description:
      "Нашло — бесплатная площадка объявлений для покупки и продажи товаров, авто, недвижимости и услуг. Размещайте первые объявления бесплатно.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#f97316",
    lang: "ru-RU",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  }
}
