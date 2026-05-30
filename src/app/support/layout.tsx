import type { Metadata } from "next"
import { buildNoindexMetadata } from "@/lib/seo/site"

export const metadata: Metadata = buildNoindexMetadata({
  title: "Поддержка | Нашло",
  description: "Личный чат поддержки пользователей Нашло.",
  path: "/support",
})

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return children
}
