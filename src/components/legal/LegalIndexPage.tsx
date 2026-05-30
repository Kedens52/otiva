import Link from "next/link"
import { LegalBreadcrumbs } from "@/components/legal/LegalBreadcrumbs"
import { LegalHubHero } from "@/components/legal/LegalHubHero"
import { LegalHubSectionCards } from "@/components/legal/LegalHubSectionCards"
import { LegalSearch } from "@/components/legal/LegalSearch"
import { LEGAL_DOCUMENTS, groupLegalDocumentsByCategory } from "@/lib/legal-documents"
import { LEGAL_LINKS } from "@/lib/legal-meta"

export function LegalIndexPage() {
  const allDocGroups = groupLegalDocumentsByCategory(LEGAL_DOCUMENTS)

  return (
    <div className="min-w-0 space-y-10 lg:space-y-12">
      <LegalBreadcrumbs items={[]} />

      <LegalHubHero />

      <section id="search" className="scroll-mt-24">
        <h2 className="text-xl font-bold text-zinc-950 sm:text-2xl">Поиск по правилам</h2>
        <p className="mt-1 text-sm text-zinc-500">Найдите документ или раздел по ключевому слову</p>
        <div className="mt-4">
          <LegalSearch showResults size="lg" placeholder="Найти в правилах и документах" />
        </div>
      </section>

      <LegalHubSectionCards />

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8">
        <h2 className="text-lg font-bold text-zinc-950">Все документы</h2>
        <p className="mt-1 text-sm text-zinc-500">Полный перечень правил и юридических материалов Нашло</p>
        <div className="mt-6 space-y-8">
          {allDocGroups.map((group) => (
            <div key={group.category}>
              <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-400">{group.label}</h3>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((doc) => (
                  <li key={doc.href}>
                    <Link
                      href={doc.href}
                      className="block rounded-xl border border-zinc-100 bg-zinc-50/50 px-3 py-2.5 text-sm font-medium text-zinc-700 transition hover:border-[hsl(var(--nashlo-orange)/0.3)] hover:bg-white hover:text-[hsl(var(--nashlo-orange))]"
                    >
                      {doc.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-zinc-500">
          Не нашли ответ?{" "}
          <Link href="/help" className="font-semibold text-[hsl(var(--nashlo-orange))] hover:underline">
            Центр помощи
          </Link>{" "}
          или{" "}
          <Link href={LEGAL_LINKS.contacts} className="font-semibold text-[hsl(var(--nashlo-orange))] hover:underline">
            контакты
          </Link>
        </p>
      </section>
    </div>
  )
}
