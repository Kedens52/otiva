import type { Metadata } from "next"
import { buildPageMetadata } from "@/lib/seo/site"

export const metadata: Metadata = buildPageMetadata({
  title: "Реклама на Нашло",
  description:
    "Размещение рекламы на Нашло: форматы, требования к маркировке и запуск рекламных кампаний на площадке объявлений.",
  path: "/advertising",
})

export default function AdvertisingLayout({ children }: { children: React.ReactNode }) {
  return children
}
