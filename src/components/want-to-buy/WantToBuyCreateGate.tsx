"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getWantToBuyCreatePath } from "@/lib/want-to-buy/routes"
import type { WantToBuyCategoryOption } from "@/lib/want-to-buy/client-types"
import { WantToBuyForm } from "@/components/want-to-buy/WantToBuyForm"

export function WantToBuyCreateGate({ categories }: { categories: WantToBuyCategoryOption[] }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => {
        if (r.status === 401) {
          router.replace(`/login?return=${encodeURIComponent(getWantToBuyCreatePath())}`)
          return
        }
        setReady(true)
      })
      .catch(() => {
        router.replace(`/login?return=${encodeURIComponent(getWantToBuyCreatePath())}`)
      })
  }, [router])

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-zinc-200 border-t-[hsl(var(--nashlo-orange))]" />
      </div>
    )
  }

  return (
    <div className="py-8 sm:py-10">
      <div className="mb-8 text-center sm:mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-[#000000]">Новая заявка</h1>
        <p className="mt-2 text-[#4B4B4B]">Опишите, что ищете — продавцы откликнутся сами</p>
      </div>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-[18px] bg-white" />}>
        <WantToBuyForm categories={categories} />
      </Suspense>
    </div>
  )
}
