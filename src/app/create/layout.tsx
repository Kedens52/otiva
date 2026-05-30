import type { Metadata } from "next"
import { buildNoindexMetadata } from "@/lib/seo/site"

export const metadata: Metadata = buildNoindexMetadata({
  title: "Разместить объявление | Нашло",
  description: "Форма размещения объявления на платформе Нашло.",
  path: "/create",
})

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  return children
}
