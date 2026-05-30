"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { OfferForm } from "@/components/want-to-buy/OfferForm"
import { Button } from "@/components/ui/button"
import type { WantToBuyDetailItem } from "@/lib/want-to-buy/client-types"
import { getWantToBuyDetailPath, getWantToBuyHubPath } from "@/lib/want-to-buy/routes"

export function WantToBuyOfferPage({ wantToBuyId }: { wantToBuyId: string }) {
  const router = useRouter()
  const [item, setItem] = useState<WantToBuyDetailItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void fetch(`/api/want-to-buy/${wantToBuyId}`)
      .then(async (res) => {
        const data = (await res.json()) as { item?: WantToBuyDetailItem; error?: string }
        if (res.status === 401) {
          router.replace(`/login?return=${encodeURIComponent(getWantToBuyHubPath())}`)
          return
        }
        if (!res.ok) throw new Error(data.error ?? "Заявка недоступна")
        if (!cancelled) setItem(data.item ?? null)
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [wantToBuyId, router])

  if (loading) {
    return (
      <div className="mx-auto max-w-lg animate-pulse rounded-[18px] bg-white p-8">
        <div className="h-6 w-1/2 rounded bg-zinc-100" />
        <div className="mt-6 h-32 rounded bg-zinc-50" />
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="mx-auto max-w-lg rounded-[18px] bg-white p-8 text-center">
        <p className="font-semibold text-[#000000]">{error ?? "Заявка не найдена"}</p>
        <Button asChild className="mt-6">
          <Link href={getWantToBuyHubPath()}>К ленте</Link>
        </Button>
      </div>
    )
  }

  if (item.isOwner) {
    return (
      <div className="mx-auto max-w-lg rounded-[18px] bg-white p-8 text-center">
        <p className="text-[#4B4B4B]">Это ваша заявка — откликнуться нельзя.</p>
        <Button asChild className="mt-6">
          <Link href={`/profile/want-to-buy/${item.id}/offers`}>Посмотреть отклики</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link
          href={getWantToBuyDetailPath({
            id: item.id,
            categorySlug: item.category.slug,
          })}
          className="text-sm font-medium text-[hsl(var(--nashlo-orange))] hover:underline"
        >
          ← К заявке
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-[#000000]">Предложить товар</h1>
      </div>
      <OfferForm
        wantToBuyId={item.id}
        categorySlug={item.category.slug}
        title={item.title}
        existingOffer={item.myOffer}
      />
    </div>
  )
}
