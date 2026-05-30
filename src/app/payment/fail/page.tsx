"use client"
import { Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

function FailContent() {
  const params = useSearchParams()
  const type = params.get("type")

  return (
    <div className="min-h-screen bg-[#ECECEC] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-[32px] bg-white p-8 shadow-sm text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
        <h1 className="mt-5 text-2xl font-semibold text-zinc-950">Платёж не прошёл</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Что-то пошло не так. Попробуйте ещё раз или выберите другой способ оплаты.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link href={type === "wallet" ? "/profile/finance" : "/profile/promotion"}
            className="h-12 flex items-center justify-center rounded-xl bg-[hsl(var(--nashlo-orange))] text-sm font-semibold text-white transition hover:bg-[hsl(var(--nashlo-orange)/0.92)]">
            Попробовать снова
          </Link>
          <Link href="/"
            className="h-12 flex items-center justify-center rounded-2xl border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition">
            На главную
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#ECECEC] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950" />
      </div>
    }>
      <FailContent />
    </Suspense>
  )
}
