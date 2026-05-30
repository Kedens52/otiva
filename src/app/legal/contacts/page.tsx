import type { Metadata } from "next"
import Link from "next/link"
import {
  CONTACT_EMAIL_ADS,
  CONTACT_EMAIL_PRIVACY,
  CONTACT_EMAIL_SUPPORT,
  LEGAL_LINKS,
} from "@/lib/legal-meta"
import { LegalPageShell } from "@/components/legal/LegalPageShell"
import { buildPageMetadata } from "@/lib/seo/site"

export const metadata: Metadata = buildPageMetadata({
  title: "Контакты для обращений — Нашло",
  description: "Контакты для юридических и пользовательских обращений по сервису Нашло.",
  path: "/legal/contacts",
})

export default function LegalContactsPage() {
  return (
    <LegalPageShell title="Контакты для обращений">
      <section>
        <h2 className="text-base font-semibold text-zinc-950">Поддержка пользователей</h2>
        <p className="mt-3">
          Вопросы по работе сайта, объявлениям, чатам и аккаунту — раздел{" "}
          <Link href="/support" className="font-medium text-zinc-950 underline underline-offset-2">
            Поддержка
          </Link>{" "}
          или e-mail:{" "}
          <a href={`mailto:${CONTACT_EMAIL_SUPPORT}`} className="font-medium text-zinc-950 underline underline-offset-2">
            {CONTACT_EMAIL_SUPPORT}
          </a>
          .
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-zinc-950">Реклама на Нашло</h2>
        <p className="mt-3">
          Вопросы по рекламным кампаниям, модерации креативов и оплате размещения:{" "}
          <a href={`mailto:${CONTACT_EMAIL_ADS}`} className="font-medium text-zinc-950 underline underline-offset-2">
            {CONTACT_EMAIL_ADS}
          </a>
          . Правила и оферта —{" "}
          <Link href={LEGAL_LINKS.advertisingRules} className="underline underline-offset-2">
            правила рекламы
          </Link>
          ,{" "}
          <Link href={LEGAL_LINKS.advertisingOffer} className="underline underline-offset-2">
            оферта на рекламу
          </Link>
          .
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-zinc-950">Продвижение объявлений</h2>
        <p className="mt-3">
          Технические вопросы по платному продвижению и возвратам при сбое — через{" "}
          <Link href="/support" className="underline underline-offset-2">
            поддержку
          </Link>{" "}
          с указанием ID объявления и платежа. Условия —{" "}
          <Link href={LEGAL_LINKS.promotionOffer} className="underline underline-offset-2">
            оферта на продвижение
          </Link>
          .
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-zinc-950">Персональные данные</h2>
        <p className="mt-3">
          Запросы по обработке ПДн и реализации прав субъекта:{" "}
          <a href={`mailto:${CONTACT_EMAIL_PRIVACY}`} className="font-medium text-zinc-950 underline underline-offset-2">
            {CONTACT_EMAIL_PRIVACY}
          </a>
          . Срок ответа — до 30 календарных дней, если иное не предусмотрено законом.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-zinc-950">Жалобы и модерация</h2>
        <p className="mt-3">
          Жалобы на объявления, отзывы и профили — кнопка «Пожаловаться» в интерфейсе. При необходимости приложите ссылки и пояснения
          в обращении в поддержку.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-zinc-950">Юридические обращения</h2>
        <p className="mt-3">
          Претензии по нарушению прав, спорным материалам и исполнению договоров с Оператором — на{" "}
          <a href={`mailto:${CONTACT_EMAIL_SUPPORT}`} className="font-medium text-zinc-950 underline underline-offset-2">
            {CONTACT_EMAIL_SUPPORT}
          </a>{" "}
          с пометкой «Юридическое обращение». Реквизиты Оператора — на странице{" "}
          <Link href={LEGAL_LINKS.requisites} className="underline underline-offset-2">
            Реквизиты
          </Link>
          .
        </p>
      </section>
    </LegalPageShell>
  )
}
