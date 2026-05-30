"use client"

import Link from "next/link"

type CategoryHeroLink = {
  label: string
  href: string
}

type CategoryHeroProps = {
  title: string
  scopeLabel?: string
  total: number
  loading: boolean
  quickLinks?: CategoryHeroLink[]
  activeQuickLinkHref?: string
}

export function CategoryHero({
  title,
  scopeLabel,
  total,
  loading,
  quickLinks,
  activeQuickLinkHref,
}: CategoryHeroProps) {
  const statLabel = loading ? "Загрузка..." : `${total.toLocaleString("ru-RU")} объявлений`

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/80 bg-white px-5 py-6 shadow-[0_1px_3px_rgba(15,23,42,0.05)] sm:px-6 sm:py-6">
      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              {scopeLabel ? (
                <span className="inline-flex rounded-full border border-[hsl(var(--nashlo-orange)/0.18)] bg-[hsl(var(--nashlo-orange)/0.08)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[hsl(var(--nashlo-orange))]">
                  {scopeLabel}
                </span>
              ) : null}
              <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-500">
                {statLabel}
              </span>
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
              {title}
            </h1>
          </div>
        </div>

        {quickLinks?.length ? (
          <div className="mt-6 flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] scrollbar-none">
            {quickLinks.map((link) => {
              const active = activeQuickLinkHref === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`shrink-0 rounded-full border px-3.5 py-2 text-sm font-medium transition ${
                    active
                      ? "border-[hsl(var(--nashlo-orange))] bg-[hsl(var(--nashlo-orange))] text-white shadow-sm"
                      : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300 hover:bg-white hover:shadow-sm"
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>
        ) : null}
      </div>
    </section>
  )
}
