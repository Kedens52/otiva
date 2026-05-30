import type { Metadata } from "next"
import Link from "next/link"
import { LegalPageShell } from "@/components/legal/LegalPageShell"
import {
  BANK_DETAILS,
  CONTACT_EMAIL_SUPPORT,
  LEGAL_LINKS,
  LEGAL_SERVICE_LABEL,
  OWNER_INN,
  OWNER_LEGAL_NAME,
} from "@/lib/legal-meta"
import { buildPageMetadata } from "@/lib/seo/site"

export const metadata: Metadata = buildPageMetadata({
  title: "Оферта на платное продвижение объявлений — Нашло",
  description: "Условия оказания платных услуг по продвижению объявлений на сервисе Нашло.",
  path: "/legal/promotion-offer",
})

export default function PromotionOfferPage() {
  return (
    <LegalPageShell title="Оферта на платное продвижение объявлений">
      <section>
        <h2>1. Предмет оферты</h2>
        <p className="mt-3">
          {OWNER_LEGAL_NAME}, ИНН {OWNER_INN} (Исполнитель), предлагает пользователю {LEGAL_SERVICE_LABEL} (Заказчик)
          платные услуги по продвижению объявлений: поднятие, выделение, закрепление, пакетные опции и иные функции,
          доступные в разделе «Продвижение» / «Тарифы».
        </p>
        <p className="mt-3">
          Акцепт оферты — оплата услуги в интерфейсе Сервиса или списание средств с кошелька после подтверждения заказа.
        </p>
      </section>
      <section>
        <h2>2. Услуги и стоимость</h2>
        <p className="mt-3">
          Перечень услуг, срок действия и цена отображаются в интерфейсе до оплаты. Исполнитель вправе изменять тарифы;
          для уже оплаченных услуг действуют условия на момент оплаты.
        </p>
      </section>
      <section>
        <h2>3. Порядок оказания</h2>
        <p className="mt-3">
          Услуга считается оказанной с момента активации соответствующего статуса на объявлении в Сервисе (например,
          «поднято до…», «выделено до…»). Заказчик понимает, что результат зависит от спроса, категории и качества
          объявления; гарантия продажи не предоставляется (см.{" "}
          <Link href={LEGAL_LINKS.promotionRules} className="underline underline-offset-2">
            Правила продвижения
          </Link>
          ).
        </p>
      </section>
      <section>
        <h2>4. Оплата</h2>
        <p className="mt-3">
          Оплата производится через кошелёк Сервиса и/или платёжного провайдера (в том числе Т-Банк). Полные реквизиты
          банковских карт обрабатываются платёжным провайдером, не Исполнителем.
        </p>
      </section>
      <section>
        <h2>5. Возвраты</h2>
        <p className="mt-3">
          Если услуга не была активирована по технической вине Исполнителя, Заказчик вправе обратиться в поддержку для
          повторной активации или возврата на кошелёк. Возврат не производится, если объявление заблокировано модерацией,
          снято пользователем или нарушает правила Сервиса.
        </p>
      </section>
      <section>
        <h2>6. Ответственность</h2>
        <p className="mt-3">
          Исполнитель не отвечает за сделки между пользователями. Ответственность Исполнителя ограничена суммой оплаты
          конкретной услуги, если иное не предусмотрено императивными нормами закона.
        </p>
      </section>
      <section>
        <h2>7. Реквизиты и контакты</h2>
        <p className="mt-3">
          {OWNER_LEGAL_NAME}, ИНН {OWNER_INN}. Р/с {BANK_DETAILS.account}, {BANK_DETAILS.bankName}, БИК {BANK_DETAILS.bik}.
          Поддержка:{" "}
          <a href={`mailto:${CONTACT_EMAIL_SUPPORT}`} className="underline underline-offset-2">
            {CONTACT_EMAIL_SUPPORT}
          </a>
          .{" "}
          <Link href={LEGAL_LINKS.requisites} className="underline underline-offset-2">
            Полные реквизиты
          </Link>
          .
        </p>
      </section>
    </LegalPageShell>
  )
}
