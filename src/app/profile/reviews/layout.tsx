import type { Metadata } from "next"
import { buildNoindexMetadata } from "@/lib/seo/site"

export const metadata: Metadata = buildNoindexMetadata({
  title: "Мои отзывы | Нашло",
  description: "Отзывы от пользователей после общения или сделки.",
  path: "/profile/reviews",
})

export default function ReviewsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
