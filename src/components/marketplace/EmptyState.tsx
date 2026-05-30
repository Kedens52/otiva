import Link from "next/link"

type EmptyStateProps = {
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  compact?: boolean
}

export function EmptyState({ title, description, actionLabel, actionHref, compact = false }: EmptyStateProps) {
  return (
    <section className={`mx-auto flex max-w-3xl flex-col items-center justify-center rounded-2xl border border-white/80 bg-white px-5 text-center shadow-[0_1px_3px_rgba(15,23,42,0.05)] ${compact ? "min-h-[280px] py-9 sm:min-h-[320px] sm:py-10" : "min-h-[320px] py-10 sm:min-h-[460px] sm:py-14"}`}>
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">
        <div className="h-8 w-8 rounded-full border-2 border-[hsl(var(--nashlo-orange))]" />
      </div>
      <h1 className={`${compact ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"} font-semibold tracking-tight text-zinc-950`}>{title}</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-6 rounded-xl bg-[hsl(var(--nashlo-orange))] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(var(--nashlo-orange)/0.92)]"
        >
          {actionLabel}
        </Link>
      )}
    </section>
  )
}
