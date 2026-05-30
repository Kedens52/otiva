import type { Metadata } from "next"
import Link from "next/link"
import { LegalPageShell } from "@/components/legal/LegalPageShell"
import {
  CONTACT_EMAIL_PRIVACY,
  LEGAL_LINKS,
  LEGAL_SERVICE_LABEL,
  OWNER_LEGAL_NAME,
  OWNER_INN,
} from "@/lib/legal-meta"
import { buildPageMetadata } from "@/lib/seo/site"

export const metadata: Metadata = buildPageMetadata({
  title: "Пользовательское соглашение — Нашло",
  description: "Условия использования сервиса Нашло.",
  path: "/legal/user-agreement",
})

export default function UserAgreementPage() {
  return (
    <LegalPageShell
      title="Пользовательское соглашение"
      description={`Документ регулирует использование ${LEGAL_SERVICE_LABEL}.`}
    >
      <section>
        <h2 className="text-base font-semibold text-zinc-950">1. Термины и определения</h2>
        <p className="mt-3">
          <strong className="text-zinc-950">Сервис</strong> — программа для ЭВМ и сайт nashlo.ru, позволяющие размещать и просматривать
          объявления. <strong className="text-zinc-950">Администрация</strong> — {OWNER_LEGAL_NAME}, ИНН {OWNER_INN}.{" "}
          <strong className="text-zinc-950">Пользователь</strong> — физическое лицо, использующее Сервис.{" "}
          <strong className="text-zinc-950">Объявление</strong> — информация, размещаемая Пользователем в Сервисе.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-950">2. Общие положения</h2>
        <p className="mt-3">
          Используя Сервис, Пользователь подтверждает, что ознакомился с настоящим Соглашением,{" "}
          <Link href={LEGAL_LINKS.privacyPolicy} className="underline underline-offset-2">
            Политикой обработки персональных данных
          </Link>{" "}
          и принимает их. Если Пользователь не согласен — он обязан прекратить использование Сервиса.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-950">3. Статус сервиса</h2>
        <p className="mt-3">
          Сервис Нашло является информационной площадкой, предназначенной для размещения, поиска и просмотра объявлений пользователей.
          Администрация сервиса не является стороной сделок, заключаемых между пользователями, не выступает продавцом, покупателем,
          исполнителем, заказчиком, агентом или представителем пользователей.
        </p>
        <p className="mt-3">
          Все сделки, договорённости, расчёты, передача товаров, оказание услуг и урегулирование претензий осуществляются пользователями
          самостоятельно и на их собственный риск.
        </p>
        <p className="mt-3">
          Администрация сервиса не гарантирует достоверность сведений, указанных пользователями в объявлениях, качество, безопасность,
          наличие, комплектность товаров, квалификацию исполнителей, фактическое оказание услуг, платежеспособность пользователей и
          исполнение ими обязательств.
        </p>
        <p className="mt-3">
          Администрация вправе модерировать объявления, ограничивать доступ к сервису, удалять материалы и блокировать пользователей при
          нарушении правил сервиса, требований законодательства или прав третьих лиц.
        </p>
        <p className="mt-3">
          Сервис может применять рекомендательные технологии для подбора объявлений и материалов, которые могут быть
          интересны пользователю. Подробнее — в{" "}
          <Link href={LEGAL_LINKS.recommendationTechnologies} className="underline underline-offset-2">
            Правилах применения рекомендательных технологий
          </Link>
          . Пользователь вправе в любой момент пользоваться обычным поиском, категориями, фильтрами и сортировками без
          обязанности полагаться на рекомендации.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-950">4. Регистрация и аккаунт</h2>
        <p className="mt-3">
          Для части функций требуется регистрация. Доступны вход по номеру телефона (код подтверждения), а также авторизация
          через VK ID и Яндекс ID — при этом Сервис может получать от провайдера идентификатор, имя и адрес электронной почты
          в объёме, разрешённом настройками аккаунта у провайдера.
        </p>
        <p className="mt-3">
          Пользователь обязуется предоставлять достоверные данные профиля и обеспечивать конфиденциальность средств доступа.
          За действия под аккаунтом отвечает Пользователь, если не докажет обратное.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-950">5. Права и обязанности пользователя</h2>
        <p className="mt-3">
          Пользователь вправе размещать объявления в соответствии с правилами, пользоваться поиском, чатом и иными функциями. Пользователь
          обязан соблюдать закон РФ, не нарушать права третьих лиц, не размещать запрещённые материалы, не злоупотреблять сервисом.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-950">6. Права администрации</h2>
        <p className="mt-3">
          Администрация вправе изменять функционал, приостанавливать работу Сервиса для обслуживания, запрашивать документы при наличии
          законных оснований, блокировать контент и учётные записи при нарушениях.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-950">7. Размещение объявлений</h2>
        <p className="mt-3">
          Пользователь самостоятельно формирует содержание объявления и несёт ответственность за него. Требования к публикации —
          в{" "}
          <Link href={LEGAL_LINKS.listingRules} className="underline underline-offset-2">
            Правилах размещения
          </Link>
          .
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-950">8. Запрещённые товары и услуги</h2>
        <p className="mt-3">
          Запрещены объявления о товарах и услугах, оборот которых нарушает закон РФ, а также иные категории, определённые правилами Сервиса.
          Перечень может уточняться Администрацией.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-950">9. Модерация и жалобы</h2>
        <p className="mt-3">
          Порядок модерации — в{" "}
          <Link href={LEGAL_LINKS.moderation} className="underline underline-offset-2">
            соответствующем документе
          </Link>
          . Жалобы подаются через интерфейс Сервиса.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-950">10. Чаты и сообщения</h2>
        <p className="mt-3">
          Чат предназначен для связи пользователей по объявлениям. Запрещены оскорбления, спам, распространение вредоносных ссылок и иные
          действия, нарушающие закон или правила Сервиса. Администрация может ограничить доступ при нарушениях.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-950">11. Платные услуги и бонусы</h2>
        <p className="mt-3">
          Продвижение объявлений (поднятие, выделение и др.) — по{" "}
          <Link href={LEGAL_LINKS.promotionOffer} className="underline underline-offset-2">
            оферте на продвижение
          </Link>{" "}
          и{" "}
          <Link href={LEGAL_LINKS.promotionRules} className="underline underline-offset-2">
            правилам продвижения
          </Link>
          . Рекламные кампании — по{" "}
          <Link href={LEGAL_LINKS.advertisingOffer} className="underline underline-offset-2">
            оферте на рекламу
          </Link>
          . Оплата услуг Сервиса не является оплатой товара у другого пользователя.
        </p>
        <p className="mt-3">
          Бонусная программа «Баллы Нашло» — внутренние баллы, не являющиеся деньгами; условия — в{" "}
          <Link href={LEGAL_LINKS.bonusRules} className="underline underline-offset-2">
            правилах бонусной программы
          </Link>
          .
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-950">12. Отзывы</h2>
        <p className="mt-3">
          Отзывы регулируются{" "}
          <Link href={LEGAL_LINKS.reviews} className="underline underline-offset-2">
            Правилами отзывов
          </Link>
          . Пользователь не вправе накручивать рейтинг или публиковать заведомо ложные отзывы.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-950">13. Ответственность сторон</h2>
        <p className="mt-3">
          Пользователь несёт ответственность за достоверность данных в объявлениях и за свои действия при совершении сделок вне рамок
          ответственности Сервиса.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-950">14. Ограничение ответственности Сервиса</h2>
        <p className="mt-3">
          Сервис предоставляется «как есть». Администрация не отвечает за убытки, возникшие из сделок между пользователями, за действия
          или бездействие других пользователей, за временную недоступность Сервиса при отсутствии умысла или грубой неосторожности.
          В пределах, допускаемых законом, ответственность ограничивается суммой реально уплаченных пользователем платных услуг Сервиса за
          последние 12 месяцев по конкретному спорному случаю, если применимо.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-950">15. Интеллектуальные права</h2>
        <p className="mt-3">
          Контент Пользователя принадлежит Пользователю; размещая материалы, Пользователь предоставляет Администрации безвозмездную
          неисключительную лицензию на их использование в объёме, необходимом для работы Сервиса (отображение, хранение, техническая
          обработка).
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-950">16. Персональные данные</h2>
        <p className="mt-3">
          Обработка персональных данных осуществляется по{" "}
          <Link href={LEGAL_LINKS.privacyPolicy} className="underline underline-offset-2">
            Политике обработки персональных данных
          </Link>
          .
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-950">17. Изменение условий</h2>
        <p className="mt-3">
          Администрация может изменять Соглашение; новая редакция вступает в силу с момента публикации на сайте, если иное не указано.
          Продолжение использования после изменений означает согласие, если иное не установлено законом.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-950">18. Контакты и реквизиты</h2>
        <p className="mt-3">
          По вопросам персональных данных:{" "}
          <a href={`mailto:${CONTACT_EMAIL_PRIVACY}`} className="underline underline-offset-2">
            {CONTACT_EMAIL_PRIVACY}
          </a>
          . Реквизиты:{" "}
          <Link href={LEGAL_LINKS.requisites} className="underline underline-offset-2">
            страница реквизитов
          </Link>
          .
        </p>
      </section>
    </LegalPageShell>
  )
}
