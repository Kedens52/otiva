import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { LegalHubIllustration } from "@/components/legal/LegalHubIllustration"
import { LEGAL_HUB_QUICK_LINKS } from "@/lib/legal-documents"
import { LEGAL_PUBLISHED_DATE_RU } from "@/lib/legal-meta"

export function LegalHubHero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-zinc-200/90 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)] sm:p-8 lg:p-10">
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[hsl(var(--nashlo-orange)/0.08)] blur-3xl"
        aria-hidden
      />
      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)] lg:items-center lg:gap-10">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[hsl(var(--nashlo-orange))]">
            Центр правил
          </p>
          <h1 className="mt-2 text-[1.875rem] font-bold leading-tight tracking-tight text-zinc-950 sm:text-4xl lg:text-[2.5rem]">
            Правила Нашло
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-600 sm:text-lg">
            Здесь собраны правила, документы и условия, по которым работает сервис: объявления, покупки, продажи,
            отзывы, реклама, продвижение и защита данных.
          </p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-500">
            На Нашло пользователи размещают объявления, находят товары и услуги, общаются и договариваются напрямую.
            Эти документы помогают понять, как работает сервис и какие правила нужно соблюдать.
          </p>
          <p className="mt-4 text-xs text-zinc-400">Обновлено: {LEGAL_PUBLISHED_DATE_RU}</p>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Быстрые ссылки</p>
            <ul className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {LEGAL_HUB_QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm font-medium text-zinc-800 transition hover:border-[hsl(var(--nashlo-orange)/0.4)] hover:bg-[hsl(var(--nashlo-orange)/0.06)] hover:text-[hsl(var(--nashlo-orange))]"
                  >
                    {link.label}
                    <ArrowRight className="h-3.5 w-3.5 opacity-50" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[340px] lg:max-w-none lg:justify-self-end">
          <LegalHubIllustration className="hidden aspect-[5/4] sm:block" />
          <LegalHubIllustration className="mx-auto aspect-[5/3] max-h-40 sm:hidden" />
        </div>
      </div>
    </section>
  )
}
