import type { Metadata } from "next"
import Link from "next/link"
import { LegalPageShell } from "@/components/legal/LegalPageShell"
import { LEGAL_LINKS, LEGAL_SERVICE_LABEL } from "@/lib/legal-meta"
import { buildPageMetadata } from "@/lib/seo/site"

export const metadata: Metadata = buildPageMetadata({
  title: "Правила безопасности сделок — Нашло",
  description: "Рекомендации по безопасным покупкам и продажам на Нашло.",
  path: "/legal/safety",
})

export default function LegalSafetyPage() {
  return (
    <LegalPageShell title="Правила безопасности сделок">
      <section>
        <h2>1. Общие рекомендации</h2>
        <p className="mt-3">
          {LEGAL_SERVICE_LABEL} помогает найти объявление и связаться с автором, но не участвует в расчётах и передаче
          товара. Перед сделкой проверяйте продавца, товар и условия.
        </p>
      </section>
      <section>
        <h2>2. Для покупателя</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>встречайтесь в людных местах или используйте проверенные пункты выдачи;</li>
          <li>не переводите предоплату незнакомым без договорённых гарантий;</li>
          <li>проверяйте товар при получении, фиксируйте серийные номера при необходимости;</li>
          <li>общайтесь в чате Сервиса — это помогает при спорах и жалобах;</li>
          <li>после завершённой сделки можно оставить отзыв (см.{" "}
            <Link href={LEGAL_LINKS.reviews} className="underline underline-offset-2">
              Правила отзывов
            </Link>
            ).
          </li>
        </ul>
      </section>
      <section>
        <h2>3. Для продавца</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>публикуйте реальные фото и честное описание;</li>
          <li>не просите оплату на подозрительные карты и кошельки;</li>
          <li>берегите персональные данные до заключения сделки;</li>
          <li>отмечайте завершение сделки в Сервисе, если функция доступна — это основа для отзывов.</li>
        </ul>
      </section>
      <section>
        <h2>4. Мошенничество и жалобы</h2>
        <p className="mt-3">
          При подозрении на мошенничество используйте кнопку «Пожаловаться» в объявлении, чате или профиле. Администрация
          может заблокировать пользователя и удалить материалы. В тяжёлых случаях обращайтесь в правоохранительные органы.
        </p>
      </section>
      <section>
        <h2>5. Краткая памятка на сайте</h2>
        <p className="mt-3">
          Раздел{" "}
          <Link href="/safety" className="underline underline-offset-2">
            /safety
          </Link>{" "}
          содержит краткие советы; юридически значимый текст — в настоящем документе.
        </p>
      </section>
    </LegalPageShell>
  )
}
