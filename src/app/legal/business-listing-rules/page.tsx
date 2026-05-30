import type { Metadata } from "next"
import { LegalPageShell } from "@/components/legal/LegalPageShell"
import { buildPageMetadata } from "@/lib/seo/site"

export const metadata: Metadata = buildPageMetadata({
  title: "Правила B2B-объявлений — Нашло Бизнес",
  description: "Требования к оптовым и корпоративным предложениям на Нашло Бизнес.",
  path: "/legal/business-listing-rules",
})

export default function BusinessListingRulesPage() {
  return (
    <LegalPageShell title="Правила B2B-объявлений" description="Требования к оптовым и корпоративным предложениям.">
      <p>B2B-объявления проходят отдельную модерацию. Запрещены ложные цены, отсутствие минимальной партии при опте, скрытые комиссии.</p>
      <p className="mt-3">Документы компании (сертификаты, реквизиты) не публикуются в открытом доступе без согласия.</p>
    </LegalPageShell>
  )
}
