import type { Metadata } from "next"
import { LegalIndexPage } from "@/components/legal/LegalIndexPage"
import { buildPageMetadata } from "@/lib/seo/site"

export const metadata: Metadata = buildPageMetadata({
  title: "Правила Нашло — документы и условия сервиса",
  description:
    "Центр правил Нашло: пользовательское соглашение, объявления, продвижение, реклама, бонусы, отзывы и защита персональных данных.",
  path: "/legal",
})

export default function LegalRoutePage() {
  return <LegalIndexPage />
}
