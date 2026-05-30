import type { Metadata } from "next"
import Link from "next/link"
import { LegalPageShell } from "@/components/legal/LegalPageShell"
import {
  CONTACT_EMAIL_PRIVACY,
  LEGAL_LINKS,
  OWNER_LEGAL_NAME,
  OWNER_INN,
} from "@/lib/legal-meta"
import { buildPageMetadata } from "@/lib/seo/site"

export const metadata: Metadata = buildPageMetadata({
  title: "Политика обработки персональных данных — Нашло",
  description: "Правила обработки и защиты персональных данных пользователей сервиса Нашло.",
  path: "/legal/privacy-policy",
})

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      title="Политика обработки персональных данных"
      description={`Оператор: ${OWNER_LEGAL_NAME}, ИНН ${OWNER_INN}. Документ разработан с учётом 152-ФЗ.`}
    >
      <section>
        <h2 className="text-base font-semibold text-zinc-950">1. Общие положения</h2>
        <p className="mt-3">
          Настоящая Политика определяет порядок обработки и защиты персональных данных пользователей сервиса Нашло,
          размещённого на домене nashlo.ru (далее — Сервис). Оператор персональных данных —{" "}
          <strong className="text-zinc-950">{OWNER_LEGAL_NAME}</strong>, ИНН {OWNER_INN}.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-zinc-950">2. Какие данные обрабатываются</h2>
        <p className="mt-3">
          В зависимости от используемых функций могут обрабатываться: номер телефона; имя, фамилия и отображаемое имя; адрес
          электронной почты; аватар; город и регион; описание публичного профиля; текст объявлений, адреса и координаты в объявлениях;
          фотографии, GIF и видео в объявлениях и рекламных кампаниях; сообщения в чатах между пользователями; отзывы и ответы на отзывы;
          данные авторизации VK ID и Яндекс ID (идентификатор, имя, e-mail — в объёме, разрешённом провайдером); история бонусных
          баллов «Баллы Нашло»; параметры рекламных кампаний и креативов; технические данные (IP-адрес, cookie, идентификатор сессии,
          тип браузера и устройства); данные об оплате продвижения и рекламы (без полных реквизитов банковских карт — их обработка
          осуществляется платёжным провайдером).
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-zinc-950">3. Цели обработки</h2>
        <p className="mt-3">
          Регистрация и авторизация (телефон, VK ID, Яндекс ID); работа профиля и публичной страницы продавца; размещение и поиск
          объявлений; обмен сообщениями; отзывы после взаимодействия; модерация объявлений, отзывов, профилей и рекламы; бонусная
          программа; платное продвижение и рекламные кампании; уведомления и поддержка; аналитика и безопасность; исполнение
          пользовательского соглашения и требований законодательства РФ; подбор объявлений и материалов с использованием
          рекомендательных технологий — в объёме, описанном в{" "}
          <Link href={LEGAL_LINKS.recommendationTechnologies} className="underline underline-offset-2">
            Правилах применения рекомендательных технологий
          </Link>
          .
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-zinc-950">4. Правовые основания</h2>
        <p className="mt-3">
          Согласие субъекта персональных данных; исполнение пользовательского договора (оферты); исполнение обязанностей Оператора,
          предусмотренных законодательством РФ.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-zinc-950">5. Передача третьим лицам</h2>
        <p className="mt-3">
          Данные могут передаваться платёжным организациям, хостинг-провайдерам и иным подрядчикам, обеспечивающим работу Сервиса,
          при условии конфиденциальности. Передача государственным органам — по основаниям, предусмотренным законом.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-zinc-950">6. Хранение и безопасность</h2>
        <p className="mt-3">
          Применяются организационные и технические меры защиты информации. Сроки хранения определяются целями обработки и
          требованиями закона; после удаления аккаунта данные подлежат удалению или обезличиванию с учётом резервного копирования и
          спорных обязательств.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-zinc-950">7. Права субъекта персональных данных</h2>
        <p className="mt-3">
          Вы вправе запросить сведения об обработке, потребовать уточнения, блокирования или удаления данных, отозвать согласие,
          обжаловать действия Оператора в Роскомнадзоре. Обращения направляйте на{" "}
          <a href={`mailto:${CONTACT_EMAIL_PRIVACY}`} className="underline underline-offset-2">
            {CONTACT_EMAIL_PRIVACY}
          </a>
          .
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-zinc-950">8. Cookies</h2>
        <p className="mt-3">
          Подробнее — в{" "}
          <Link href={LEGAL_LINKS.cookiePolicy} className="underline underline-offset-2">
            Политике использования cookie
          </Link>
          .
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-zinc-950">9. Изменение Политики</h2>
        <p className="mt-3">
          Оператор вправе обновлять Политику; актуальная версия размещается на сайте. При существенных изменениях возможно уведомление
          через интерфейс Сервиса или по контактным данным пользователя.
        </p>
      </section>
    </LegalPageShell>
  )
}
