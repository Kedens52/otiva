import Link from 'next/link'

interface EmptyStateProps {
  icon:         string
  title:        string
  description:  string
  actionLabel?: string
  actionHref?:  string
}

export function EmptyState({ icon, title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/80 bg-white px-6 py-14 text-center shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-3xl">{icon}</span>
      <h3 className="mt-4 text-lg font-semibold tracking-tight text-zinc-950">{title}</h3>
      <p className="mt-2 max-w-xs text-sm leading-6 text-zinc-500">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-5 inline-flex items-center rounded-xl bg-[hsl(var(--nashlo-orange))] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(var(--nashlo-orange)/0.92)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--nashlo-orange)/0.45)] focus-visible:ring-offset-2"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
