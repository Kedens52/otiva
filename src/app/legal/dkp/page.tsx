import type { Metadata } from "next"
import Link from "next/link"
import { LEGAL_LINKS } from "@/lib/legal-meta"
import { buildPageMetadata } from "@/lib/seo/site"

export const metadata: Metadata = buildPageMetadata({
  title: "Договор купли-продажи — справка — Нашло",
  description: "Справочная информация о типовых договорах. Нашло не является стороной сделки и не даёт юридических консультаций.",
  path: "/legal/dkp",
})

export default function DkpInfoPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 pb-28 lg:pb-12">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Договор купли-продажи</h1>
      <p className="mt-3 text-sm leading-7 text-zinc-600">
        Нашло — площадка объявлений: мы помогаем найти контакт, но не участвуем в сделке и не проверяем юридическую сторону ваших договорённостей.
      </p>
      <p className="mt-4 text-sm leading-7 text-zinc-600">
        Типовой договор купли-продажи (в т.ч. для авто или иного имущества) вы можете подготовить самостоятельно, скачать проверенный шаблон в открытых источниках или оформить у нотариуса. Перед подписанием проверяйте реквизиты, паспорт и предмет сделки.
      </p>
      <p className="mt-4 text-sm leading-7 text-zinc-600">
        Советы по общению и личной встрече — в разделе{" "}
        <Link href="/safety" className="font-medium text-zinc-950 underline underline-offset-2 hover:text-[hsl(var(--nashlo-orange))]">
          безопасность и советы
        </Link>
        .
      </p>
      <Link
        href={LEGAL_LINKS.userAgreement}
        className="mt-8 inline-block text-sm font-medium text-zinc-950 underline underline-offset-2"
      >
        Пользовательское соглашение
      </Link>
    </main>
  )
}
