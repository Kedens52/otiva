import type { Metadata } from "next"
import { buildPageMetadata } from "@/lib/seo/site"

export const metadata: Metadata = buildPageMetadata({
  title: "Приложение Нашло",
  description:
    "Страница приложения Нашло с преимуществами мобильного опыта, уведомлениями и быстрым доступом к избранному и чату.",
  path: "/app",
})

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return children
}
