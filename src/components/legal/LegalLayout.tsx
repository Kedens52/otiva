import type { ReactNode } from "react"
import Link from "next/link"
import { LegalHeaderNav } from "@/components/legal/LegalHeaderNav"
import { LegalSearch } from "@/components/legal/LegalSearch"
import { LegalSidebar } from "@/components/legal/LegalSidebar"
import { LegalTocAside } from "@/components/legal/LegalTocAside"
import { PAGE_CONTAINER_CLASS } from "@/components/layout/PageContainer"
import { LEGAL_LINKS } from "@/lib/legal-meta"

type Props = {
  children: ReactNode
  /** Страница индекса /legal — полная ширина без бокового меню */
  isIndex?: boolean
}

export function LegalLayout({ children, isIndex = false }: Props) {
  if (isIndex) {
    return (
      <div className="min-h-[50vh] bg-zinc-50">
        <div className={`${PAGE_CONTAINER_CLASS} py-8 pb-8 sm:py-10 lg:pb-14`}>
          <LegalHeaderNav />
          <div className="min-w-0 w-full">{children}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[50vh] bg-zinc-50">
      <div className={`${PAGE_CONTAINER_CLASS} py-8 pb-8 sm:py-10 lg:pb-14`}>
        <LegalHeaderNav />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)_minmax(0,240px)] lg:gap-8 xl:gap-10">
          <aside className="min-w-0 space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="lg:hidden">
              <LegalSearch placeholder="Найти в правилах и документах" />
            </div>
            <LegalSidebar collapsible className="lg:hidden" />
            <div className="hidden space-y-4 lg:block">
              <LegalSearch placeholder="Найти в правилах и документах" />
              <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
                <LegalSidebar />
              </div>
              <Link
                href={LEGAL_LINKS.index}
                className="block rounded-xl px-2 py-2 text-center text-xs font-semibold text-zinc-500 transition hover:text-[hsl(var(--nashlo-orange))]"
              >
                ← Правила Нашло
              </Link>
            </div>
          </aside>

          <div className="min-w-0 w-full lg:max-w-none">{children}</div>

          <div className="hidden min-w-0 lg:block">
            <LegalTocAside />
          </div>
        </div>
      </div>
    </div>
  )
}
