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
            <li><span className="font-semibold text-zinc-950">1. </span>Откройте <Link href="/feed" className="font-semibold text-[hsl(var(--nashlo-blue))]">nashlo.ru</Link> в Safari.</li>
            <li><span className="font-semibold text-zinc-950">2. </span>Нажмите &#171;Поделиться&#187; и выберите &#171;На экран Домой&#187;.</li>
          </ol>
          <p className="mt-3 text-xs text-zinc-400">Быстрый доступ без установки из магазина.</p>
        </div>
      </div>
    </section>
  )
}
