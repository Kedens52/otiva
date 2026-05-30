import type { Metadata } from "next"
import { buildNoindexMetadata } from "@/lib/seo/site"

export const metadata: Metadata = buildNoindexMetadata({
  title: "Мои заявки | Нашло",
  description: "Управление заявками «Куплю».",
  path: "/profile/want-to-buy",
})

export default function ProfileWantToBuyLayout({ children }: { children: React.ReactNode }) {
  return children
}
