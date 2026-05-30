import type { Metadata } from "next"
import { buildNoindexMetadata } from "@/lib/seo/site"

// Поиск намеренно закрыт от индексации: бесконечные комбинации параметров.
export const metadata: Metadata = buildNoindexMetadata({
  title: "Поиск объявлений | Нашло",
  description: "Поисковая выдача и фильтры объявлений на Нашло.",
  path: "/search",
})

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children
}
