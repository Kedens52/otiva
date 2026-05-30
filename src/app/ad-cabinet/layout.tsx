import type { Metadata } from "next"
import { buildNoindexMetadata } from "@/lib/seo/site"

export const metadata: Metadata = buildNoindexMetadata({
  title: "Рекламный кабинет | Нашло",
  description: "Управление рекламными размещениями на Нашло.",
  path: "/ad-cabinet",
})

export default function AdCabinetLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
