import type { Metadata } from "next"
import { LegalPageShell } from "@/components/legal/LegalPageShell"
import { buildPageMetadata } from "@/lib/seo/site"

export const metadata: Metadata = buildPageMetadata({
  title: "Условия использования Нашло Бизнес",
  description: "Правила B2B-площадки Нашло Бизнес для компаний и предпринимателей.",
  path: "/legal/business-terms",
})

export default function BusinessTermsPage() {
  return (
    <LegalPageShell
      title="Условия использования Нашло Бизнес"
      description="Правила работы B2B-раздела nashlo.ru для юридических лиц и ИП."
    >
      <p>
        Раздел «Нашло Бизнес» предназначен для B2B-взаимодействия: оптовые предложения, поставки, продажа бизнеса,
        оборудование и заявки на закупку. Использование раздела не заменяет договор между сторонами сделки.
      </p>
      <p className="mt-3">
        Оператор проверяет компании и B2B-материалы в рамках модерации; статус «Проверено» не является гарантией сделки.
        Пользователь обязан указывать достоверные реквизиты (ИНН, ОГРН) и не создавать фиктивные компании.
      </p>
    </LegalPageShell>
  )
}
