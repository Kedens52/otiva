"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

export function InstallAppBanner() {
  const [isIos, setIsIos] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent
    const win = window as Window & { MSStream?: unknown }
    setIsIos(/iPad|iPhone|iPod/.test(ua) && !win.MSStream)
  }, [])

  if (!isIos) return null

  return (
    <section className="mt-5 overflow-hidden rounded-[24px] border border-zinc-200 bg-white p-3 shadow-sm sm:p-4 lg:mt-0">
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-zinc-100 sm:h-16 sm:w-16">
          <div className="grid grid-cols-2 gap-1">
            {["bg-emerald-200", "bg-orange-200", "bg-blue-200", "bg-violet-200"].map((tone) => (
              <span key={tone} className={`h-4 w-4 rounded-md sm:h-5 sm:w-5 ${tone}`} />
            ))}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold leading-tight text-zinc-950 sm:text-lg">
            Нашло на экране айфона
          </h2>
          <ol className="mt-2 grid gap-1.5 text-xs leading-5 text-zinc-600 sm:mt-3 sm:text-sm">
            <li><span className="font-semibold text-zinc-950">1. </span>Откройте <Link href="/feed" className="font-semibold text-[hsl(var(--nashlo-blue))]">nashlo.ru</Link> в Safari.</li>
            <li><span className="font-semibold text-zinc-950">2. </span>Нажмите «Поделиться» и выберите «На экран Домой».</li>
          </ol>
          <p className="mt-2 text-xs text-zinc-400 sm:mt-3">Быстрый доступ без установки из магазина.</p>
        </div>
      </div>
    </section>
  )
}
