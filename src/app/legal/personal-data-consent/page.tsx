import type { Metadata } from "next"
import Link from "next/link"
import { LegalPageShell } from "@/components/legal/LegalPageShell"
import { LEGAL_LINKS, OWNER_LEGAL_NAME } from "@/lib/legal-meta"
import { buildPageMetadata } from "@/lib/seo/site"

export const metadata: Metadata = buildPageMetadata({
  title: "Согласие на обработку персональных данных — Нашло",
  description: "Форма согласия на обработку персональных данных пользователей Нашло.",
  path: "/legal/personal-data-consent",
})

export default function PersonalDataConsentPage() {
  return (
    <LegalPageShell
      title="Согласие на обработку персональных данных"
      description="Текст согласия для пользователей сервиса Нашло в соответствии с 152-ФЗ."
    >
      <section>
        <p>
          Я, действуя своей волей и в своём интересе, даю согласие{" "}
          <strong className="text-zinc-950">{OWNER_LEGAL_NAME}</strong> (далее — Оператор) на обработку моих персональных данных
          на условиях{" "}
          <Link href={LEGAL_LINKS.privacyPolicy} className="underline underline-offset-2">
            Политики обработки персональных данных
          </Link>
          .
        </p>
        <p className="mt-3">
          Перечень данных и целей обработки — в{" "}
          <Link href={LEGAL_LINKS.privacyPolicy} className="underline underline-offset-2">
            Политике
          </Link>
          ; в том числе: контактные и профильные данные, контент объявлений и рекламы, переписка, отзывы, данные OAuth (VK, Яндекс),
          технические и платёжные метаданные, сведения о бонусных баллах.
        </p>
        <p className="mt-3">
          Обработка включает сбор, запись, систематизацию, накопление, хранение, уточнение (обновление, изменение),
          извлечение, использование, передачу (предоставление, доступ) подрядчикам, обеспечивающим работу Сервиса, обезличивание,
          блокирование, удаление, уничтожение персональных данных с использованием средств автоматизации и без таковых.
        </p>
        <p className="mt-3">
          Согласие даётся при регистрации, входе или использовании Сервиса (в том числе отметкой в форме входа по телефону) и
          действует до отзыва путём обращения на контакт из Политики либо до достижения целей обработки. При отзыве согласия
          отдельные функции (аккаунт, объявления, чаты, оплата услуг) могут стать недоступны.
        </p>
      </section>
    </LegalPageShell>
  )
}
