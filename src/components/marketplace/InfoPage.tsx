import Link from "next/link"
import { PAGE_CONTAINER_CLASS } from "@/components/layout/PageContainer"

type InfoPageProps = {
  title: string
  description?: string
  items: string[]
}

export function InfoPage({ title, description, items }: InfoPageProps) {
  return (
    <main className={`${PAGE_CONTAINER_CLASS} max-w-[1120px] py-6 pb-8 lg:py-8 lg:pb-12`}>
      <section className="rounded-3xl border border-white/80 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)] sm:p-6 lg:p-8">
        <span className="inline-flex rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-[hsl(var(--nashlo-orange))]">
          Нашло
        </span>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
            {description}
          </p>
        ) : null}
      </section>

      <section className="mt-6 grid gap-3 sm:mt-8 md:grid-cols-2">
        {items.map((item, index) => (
          <div key={item} className="rounded-2xl border border-white/80 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
              {String(index + 1).padStart(2, "0")}
            </p>
            <h2 className="mt-2 font-semibold text-zinc-950">{item}</h2>
          </div>
        ))}
      </section>

      <Link href="/" className="nashlo-btn-primary mt-6 inline-flex sm:mt-8">
        Вернуться на главную
      </Link>
    </main>
  )
}
