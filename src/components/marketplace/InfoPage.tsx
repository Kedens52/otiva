import Link from "next/link"

type InfoPageProps = {
  title: string
  description: string
  items: string[]
}

export function InfoPage({ title, description, items }: InfoPageProps) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <section className="rounded-[36px] border border-zinc-200 bg-zinc-50 p-8 shadow-inner">
        <h1 className="text-5xl font-semibold tracking-tight text-zinc-950">{title}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-500">{description}</p>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <div key={item} className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-zinc-950">{item}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">Демо-раздел готов для дальнейшего наполнения текстом и настройками.</p>
          </div>
        ))}
      </section>

      <Link href="/feed" className="mt-8 inline-flex rounded-full bg-zinc-950 px-6 py-3 text-sm font-semibold text-white">
        Вернуться на главную
      </Link>
    </main>
  )
}
