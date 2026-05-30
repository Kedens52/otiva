import type { Metadata } from "next"
import Link from "next/link"
import { LegalPageShell } from "@/components/legal/LegalPageShell"
import { LEGAL_LINKS, LEGAL_SERVICE_LABEL } from "@/lib/legal-meta"
import { buildPageMetadata } from "@/lib/seo/site"

export const metadata: Metadata = buildPageMetadata({
  title: "Отказ от ответственности — Нашло",
  description: "Ограничение ответственности сервиса объявлений Нашло.",
  path: "/legal/disclaimer",
})

export default function DisclaimerPage() {
  return (
    <LegalPageShell title="Отказ от ответственности">
      <section>
        <h2>1. Информационный характер сервиса</h2>
        <p className="mt-3">
          {LEGAL_SERVICE_LABEL} предоставляет площадку для размещения и поиска объявлений. Администрация не является
          стороной сделок между пользователями (купля-продажа товаров, оказание услуг, аренда и т.д.).
        </p>
      </section>
      <section>
        <h2>2. Ответственность пользователей</h2>
        <p className="mt-3">
          Пользователи самостоятельно публикуют описания, цены, фотографии, видео и условия. Они же проводят переговоры,
          встречи, оплату и передачу товара. Риски таких действий несут сами пользователи.
        </p>
      </section>
      <section>
        <h2>3. Отсутствие гарантий</h2>
        <p className="mt-3">
          Сервис не гарантирует: достоверность всех объявлений; наличие товара; юридическую чистоту сделки; поведение
          других пользователей; бесперебойную работу сайта во все моменты времени.
        </p>
      </section>
      <section>
        <h2>4. Роль модерации</h2>
        <p className="mt-3">
          Модерация, жалобы, рейтинги и подсказки по безопасности помогают снижать риски, но не заменяют проверку
          контрагента, товара и документов перед сделкой. Подробнее —{" "}
          <Link href={LEGAL_LINKS.safety} className="underline underline-offset-2">
            Правила безопасности сделок
          </Link>
          .
        </p>
      </section>
      <section>
        <h2>5. Платные услуги и реклама</h2>
        <p className="mt-3">
          Продвижение объявлений и рекламные кампании влияют на видимость, но не гарантируют продажу, клики или доход.
          Условия — в соответствующих офертах и правилах.
        </p>
      </section>
      <section>
        <h2>6. Ограничение ответственности администрации</h2>
        <p className="mt-3">
          В пределах, допускаемых законом РФ, Администрация не несёт ответственность за косвенные убытки и упущенную
          выгоду. Ответственность по платным услугам Сервиса ограничена суммой оплаты соответствующей услуги, если
          применимо.
        </p>
      </section>
      <section>
        <h2>7. Связанные документы</h2>
        <p className="mt-3">
          <Link href={LEGAL_LINKS.userAgreement} className="underline underline-offset-2">
            Пользовательское соглашение
          </Link>
          .
        </p>
      </section>
    </LegalPageShell>
  )
}
