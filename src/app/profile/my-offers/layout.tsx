import type { Metadata } from "next"
import { buildNoindexMetadata } from "@/lib/seo/site"

export const metadata: Metadata = buildNoindexMetadata({
  title: "Мои отклики | Нашло",
  description: "Отклики продавца на заявки покупателей.",
  path: "/profile/my-offers",
})

export default function ProfileMyOffersLayout({ children }: { children: React.ReactNode }) {
  return children
}
