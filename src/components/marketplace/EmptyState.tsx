import Link from "next/link"

type EmptyStateProps = {
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
}

export function EmptyState({ title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <section className="mx-auto flex min-h-[520px] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-[32px] bg-zinc-100 shadow-inner">
        <div className="h-10 w-10 rounded-full border-2 border-zinc-950" />
      </div>
      <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">{title}</h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-zinc-500">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-8 rounded-full bg-zinc-950 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-zinc-950/10 transition hover:bg-zinc-800"
        >
          {actionLabel}
        </Link>
      )}
    </section>
  )
}
