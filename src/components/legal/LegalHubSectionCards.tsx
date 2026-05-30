import Link from "next/link"
import {
  Building2,
  Coins,
  FileText,
  Megaphone,
  MessageSquareQuote,
  Shield,
  Sparkles,
} from "lucide-react"
import { LEGAL_HUB_SECTIONS, type LegalHubSection } from "@/lib/legal-documents"
import { cn } from "@/lib/utils"

const SECTION_ICONS: Record<string, typeof FileText> = {
  listings: FileText,
  paid: Sparkles,
  ads: Megaphone,
  bonuses: Coins,
  reviews: MessageSquareQuote,
  privacy: Shield,
  company: Building2,
}

function SectionCard({ section }: { section: LegalHubSection }) {
  const Icon = SECTION_ICONS[section.id] ?? FileText

  return (
    <article className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-[hsl(var(--nashlo-orange)/0.3)] hover:shadow-md sm:p-6">
      <div className="flex items-start gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--nashlo-orange)/0.1)] text-[hsl(var(--nashlo-orange))]"
          aria-hidden
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-zinc-950">{section.title}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">{section.description}</p>
        </div>
      </div>
      <ul className="mt-5 flex flex-1 flex-col gap-1 border-t border-zinc-100 pt-4">
        {section.links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="group flex items-center justify-between gap-2 rounded-xl px-2 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 hover:text-[hsl(var(--nashlo-orange))]"
            >
              <span className="min-w-0">{link.label}</span>
              <span className="shrink-0 text-xs text-zinc-300 transition group-hover:text-[hsl(var(--nashlo-orange))]">
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </article>
  )
}

export function LegalHubSectionCards({ className }: { className?: string }) {
  return (
    <section className={cn("space-y-5", className)}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-950 sm:text-2xl">Разделы правил</h2>
          <p className="mt-1 text-sm text-zinc-500">Выберите тему или откройте нужный документ из списка</p>
        </div>
        <Link
          href="/legal#search"
          className="text-sm font-semibold text-[hsl(var(--nashlo-orange))] hover:underline"
        >
          Все документы ↓
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {LEGAL_HUB_SECTIONS.map((section) => (
          <SectionCard key={section.id} section={section} />
        ))}
      </div>
    </section>
  )
}
