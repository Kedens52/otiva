import type { Metadata } from "next"
import Link from "next/link"
import { LegalPageShell } from "@/components/legal/LegalPageShell"
import { LEGAL_LINKS } from "@/lib/legal-meta"
import { buildPageMetadata } from "@/lib/seo/site"

export const metadata: Metadata = buildPageMetadata({
  title: "Правила модерации — Нашло",
  description: "Как модерируются объявления на сервисе Нашло.",
  path: "/legal/moderation",
})

export default function ModerationRulesPage() {
  return (
    <LegalPageShell
      title="Правила модерации"
      description="Порядок проверки объявлений и реагирования на жалобы."
    >
      <section>
        <h2 className="text-base font-semibold text-zinc-950">1. Цели модерации</h2>
        <p className="mt-3">
          Модерация направлена на соблюдение законодательства РФ, правил Сервиса и прав пользователей. Сервис является информационной
          площадкой и не подменяет собой государственные органы или суд.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-zinc-950">2. Автоматические и ручные проверки</h2>
        <p className="mt-3">
          Могут применяться автоматические фильтры (запрещённые слова, признаки спама) и решения модераторов. Статусы объявлений
          (например, на модерации, активно, отклонено) отображаются в интерфейсе пользователя.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-zinc-950">3. Основания для отклонения или снятия с публикации</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>нарушение Пользовательского соглашения и правил размещения;</li>
          <li>жалобы правообладателей или пользователей, подтверждённые материалами;</li>
          <li>требования уполномоченных органов;</li>
          <li>риски безопасности пользователей при достаточных основаниях.</li>
        </ul>
      </section>
      <section>
        <h2 className="text-base font-semibold text-zinc-950">4. Жалобы</h2>
        <p className="mt-3">
          Пользователи могут направлять жалобы через интерфейс «Пожаловаться». Рассмотрение проводится с учётом доступной информации.
          Уведомление о результате может предоставляться через интерфейс или по контактным данным.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-zinc-950">5. Ограничение ответственности Сервиса</h2>
        <p className="mt-3">
          Решения модерации не являются экспертной оценкой качества товара или услуги и не заменяют проверку пользователями при
          совершении сделки. Подробнее —{" "}
          <Link href={LEGAL_LINKS.userAgreement} className="underline underline-offset-2">
            Пользовательское соглашение
          </Link>
          .
        </p>
      </section>
    </LegalPageShell>
  )
}
