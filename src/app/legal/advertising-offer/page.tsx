import type { Metadata } from "next"
import Link from "next/link"
import { LegalPageShell } from "@/components/legal/LegalPageShell"
import {
  BANK_DETAILS,
  CONTACT_EMAIL_ADS,
  LEGAL_LINKS,
  LEGAL_SERVICE_LABEL,
  OWNER_INN,
  OWNER_LEGAL_NAME,
} from "@/lib/legal-meta"
import { buildPageMetadata } from "@/lib/seo/site"

export const metadata: Metadata = buildPageMetadata({
  title: "Оферта на рекламные услуги — Нашло",
  description: "Условия размещения рекламных кампаний на сервисе объявлений Нашло.",
  path: "/legal/advertising-offer",
})

export default function AdvertisingOfferPage() {
  return (
    <LegalPageShell title="Оферта на рекламные услуги">
      <section>
        <h2>1. Предмет</h2>
        <p className="mt-3">
          Исполнитель — {OWNER_LEGAL_NAME}, ИНН {OWNER_INN} — оказывает Заказчику услуги по размещению рекламных
          материалов на {LEGAL_SERVICE_LABEL}: показ креативов в выбранных рекламных местах (лента, категории, поиск,
          страница объявления, рекомендации, сайдбар и др., в зависимости от тарифа).
        </p>
      </section>
      <section>
        <h2>2. Заказ услуги</h2>
        <p className="mt-3">
          Заказчик создаёт кампанию в кабинете: выбирает формат, аудиторию, бюджет, загружает креатив (текст,
          изображение, GIF или видео), указывает ссылку перехода. После оплаты бюджета кампания направляется на
          модерацию. Показы начинаются после статуса «активна».
        </p>
      </section>
      <section>
        <h2>3. Стоимость и оплата</h2>
        <p className="mt-3">
          Стоимость определяется выбранным бюджетом и тарифной моделью (фиксированная цена за период / в перспективе CPM,
          CPC — если доступно в интерфейсе). Оплата списывается согласно выбранному способу. Неизрасходованный бюджет
          при досрочной остановке по инициативе Заказчика может не возвращаться, если иное не указано в интерфейсе или
          не вызвано неоказанием услуги по вине Исполнителя.
        </p>
      </section>
      <section>
        <h2>4. Модерация и отказ</h2>
        <p className="mt-3">
          Исполнитель вправе отклонить рекламу без начала показов с возвратом на кошелёк или иным способом, указанным в
          интерфейсе. При нарушении правил в процессе показа кампания приостанавливается.
        </p>
      </section>
      <section>
        <h2>5. Права на материалы</h2>
        <p className="mt-3">
          Заказчик предоставляет Исполнителю неисключительную лицензию на использование рекламных материалов в объёме,
          необходимом для показа, хранения, модерации и отчётности. Заказчик гарантирует, что материалы не нарушают
          права третьих лиц.
        </p>
      </section>
      <section>
        <h2>6. Отсутствие гарантий результата</h2>
        <p className="mt-3">
          Исполнитель не гарантирует конкретное количество показов, кликов, лидов или продаж. Показательность зависит
          от аудитории, сезона, качества креатива и конкуренции.
        </p>
      </section>
      <section>
        <h2>7. Контакты</h2>
        <p className="mt-3">
          Вопросы по рекламе:{" "}
          <a href={`mailto:${CONTACT_EMAIL_ADS}`} className="underline underline-offset-2">
            {CONTACT_EMAIL_ADS}
          </a>
          . См. также{" "}
          <Link href={LEGAL_LINKS.advertisingRules} className="underline underline-offset-2">
            Правила размещения рекламы
          </Link>
          .
        </p>
        <p className="mt-3">
          {OWNER_LEGAL_NAME}, р/с {BANK_DETAILS.account}, {BANK_DETAILS.bankName}.
        </p>
      </section>
    </LegalPageShell>
  )
}
