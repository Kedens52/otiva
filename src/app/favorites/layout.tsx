import type { Metadata } from "next"
import { buildNoindexMetadata } from "@/lib/seo/site"

export const metadata: Metadata = buildNoindexMetadata({
  title: "Избранное | Нашло",
  description: "Личный список избранных объявлений пользователя на Нашло.",
  path: "/favorites",
})

export default function FavoritesLayout({ children }: { children: React.ReactNode }) {
  return children
}
