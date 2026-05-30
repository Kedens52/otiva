import type { Metadata } from "next"
import { buildPageMetadata } from "@/lib/seo/site"

export const metadata: Metadata = buildPageMetadata({
  title: "Категории объявлений | Нашло",
  description:
    "Каталог категорий и популярных подрубрик на Нашло: транспорт, недвижимость, услуги, электроника, работа и другие разделы.",
  path: "/categories",
})

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
  return children
}
