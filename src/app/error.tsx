"use client"

import { useEffect } from "react"

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-5xl">⚠️</p>
      <h1 className="mt-4 text-2xl font-semibold text-zinc-950">Что-то пошло не так</h1>
      <p className="mt-2 text-sm text-zinc-500">Произошла ошибка. Попробуйте обновить страницу.</p>
      <div className="mt-8 flex gap-3">
        <button onClick={reset}
          className="rounded-xl bg-[hsl(var(--nashlo-orange))] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[hsl(var(--nashlo-orange)/0.92)]">
          Попробовать снова
        </button>
        <a href="/" className="rounded-2xl border border-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition">
          На главную
        </a>
      </div>
    </main>
  )
}
