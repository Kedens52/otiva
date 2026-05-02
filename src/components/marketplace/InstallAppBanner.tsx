"use client"

import Link from "next/link"

export function InstallAppBanner() {
  const steps = [
    "Откройте nashlo.ru в Safari.",
    "Нажмите «Поделиться» и выберите «На экран Домой».",
  ]

  return (
    <section className="mt-5 overflow-hidden rounded-[28px] border border-zinc-200 bg-white p-4 shadow-sm lg:mt-0">
      <div className="flex items-start gap-3">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-zinc-100">
          <div className="grid grid-cols-2 gap-1">
            {["bg-emerald-200", "bg-orange-200", "bg-blue-200", "bg-violet-200"].map((tone) => (
              <span key={tone} className={`h-5 w-5 rounded-md ${tone}`} />
            ))}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold leading-tight text-zinc-950">
            Нашло на экране айфона
          </h2>
          <ol className="mt-3 grid gap-2 text-sm leading-5 text-zinc-600">
            {steps.slice(0, 2).map((step, index) => (
              <li key={step}>
                <span className="font-semibold text-zinc-950">{index + 1}. </span>
                {index === 0 ? <>Откройте <Link href="/feed" className="font-semibold text-[hsl(var(--nashlo-blue))]">nashlo.ru</Link> в Safari.</> : step}
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-zinc-400">Быстрый доступ без установки из магазина.</p>
        </div>
      </div>
    </section>
  )
}
