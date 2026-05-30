"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, MapPin, MessageSquare, UserRound } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { OfferStatusBadge } from "@/components/want-to-buy/OfferStatusBadge"
import type { WantToBuyDetailItem } from "@/lib/want-to-buy/client-types"
import {
  formatDaysLeft,
  formatWantToBuyPriceMax,
  wantToBuyConditionLabel,
} from "@/lib/want-to-buy/labels"
import { getWantToBuyHubPath, wantToBuyItemOfferPath } from "@/lib/want-to-buy/routes"

export function WantToBuyDetail({ id }: { id: string }) {
  const router = useRouter()
  const [item, setItem] = useState<WantToBuyDetailItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => setIsLoggedIn(r.ok))
      .finally(() => setAuthChecked(true))
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void fetch(`/api/want-to-buy/${id}`)
      .then(async (res) => {
        const data = (await res.json()) as { item?: WantToBuyDetailItem; error?: string }
        if (!res.ok) throw new Error(data.error ?? "Не найдено")
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
  }, [id])

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl animate-pulse rounded-[18px] bg-white p-8">
        <div className="h-8 w-2/3 rounded bg-zinc-100" />
        <div className="mt-4 h-24 rounded bg-zinc-50" />
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="mx-auto max-w-3xl rounded-[18px] bg-white p-8 text-center">
        <p className="text-lg font-semibold text-[#000000]">Заявка не найдена</p>
        <Button asChild className="mt-6">
          <Link href={getWantToBuyHubPath()}>К ленте</Link>
        </Button>
      </div>
    )
  }

  const published = new Date(item.createdAt).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <article className="mx-auto max-w-3xl rounded-[18px] border border-[rgba(15,23,42,0.06)] bg-white p-6 shadow-sm sm:p-8">
      <p className="text-sm font-medium text-[hsl(var(--nashlo-orange))]">{item.category.nameRu}</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#000000] sm:text-3xl">{item.title}</h1>

      {item.description ? (
        <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-[#4B4B4B]">
          {item.description}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <span className="text-xl font-bold text-[#000000]">
          {formatWantToBuyPriceMax(item.priceMax)}
        </span>
        {item.city ? (
          <span className="inline-flex items-center gap-1 text-[#4B4B4B]">
            <MapPin className="h-4 w-4" />
            {item.city}
          </span>
        ) : null}
        <span className="text-[#4B4B4B]">{wantToBuyConditionLabel(item.condition)}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#4B4B4B]">
        <span>Опубликовано {published}</span>
        <span>Активна ещё {formatDaysLeft(item.expiresAt)}</span>
        <span className="inline-flex items-center gap-1">
          <Eye className="h-4 w-4" />
          {item.views}
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageSquare className="h-4 w-4" />
          {item.offerCount} откликов
        </span>
      </div>

      <div className="mt-8 flex items-center gap-3 rounded-[14px] bg-[#ECECEC]/60 p-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={item.buyer.avatar ?? undefined} alt="" />
          <AvatarFallback>
            <UserRound className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-[#000000]">{item.buyer.name?.trim() || "Покупатель"}</p>
          <p className="text-xs text-[#4B4B4B]">
            {item.buyer.reviewCount > 0
              ? `Рейтинг ${item.buyer.rating.toFixed(1)} · ${item.buyer.reviewCount} отзывов`
              : "Покупатель на Нашло"}
          </p>
          <p className="mt-1 text-xs text-[#4B4B4B]">Контакты скрыты — связь через отклик</p>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {item.isOwner ? (
          <Button asChild className="flex-1">
            <Link href={`/profile/want-to-buy/${item.id}/offers`}>Посмотреть отклики</Link>
          </Button>
        ) : item.myOffer ? (
          <div className="flex flex-1 flex-col gap-3 rounded-[14px] border border-zinc-100 p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#000000]">Ваш отклик</span>
              <OfferStatusBadge status={item.myOffer.status} />
            </div>
            <p className="text-sm text-[#4B4B4B] line-clamp-3">{item.myOffer.message}</p>
            <p className="font-bold text-[#000000]">
              {item.myOffer.price.toLocaleString("ru-RU")} ₽
            </p>
          </div>
        ) : authChecked && isLoggedIn ? (
          <Button asChild className="flex-1" size="lg">
            <Link href={wantToBuyItemOfferPath(item)}>Предложить товар</Link>
          </Button>
        ) : (
          <Button
            className="flex-1"
            size="lg"
            onClick={() =>
              router.push(
                `/login?return=${encodeURIComponent(wantToBuyItemOfferPath(item))}`,
              )
            }
          >
            Войти, чтобы предложить товар
          </Button>
        )}
        <Button asChild variant="outline">
          <Link href={getWantToBuyHubPath()}>К ленте</Link>
        </Button>
      </div>

      {item.isOwner && item.rejectionReason ? (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {item.rejectionReason}
        </p>
      ) : null}
    </article>
  )
}
