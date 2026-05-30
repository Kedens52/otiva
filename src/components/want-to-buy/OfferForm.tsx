"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { OfferStatusBadge } from "@/components/want-to-buy/OfferStatusBadge"
import { getWantToBuyDetailPath, getWantToBuyOfferPath } from "@/lib/want-to-buy/routes"

type OfferFormProps = {
  wantToBuyId: string
  categorySlug: string
  title: string
  existingOffer?: {
    id: string
    status: string
    price: number
    message: string
    listingPath: string | null
    createdAt: string
  } | null
}

export function OfferForm({ wantToBuyId, categorySlug, title, existingOffer }: OfferFormProps) {
  const router = useRouter()
  const detailPath = getWantToBuyDetailPath({ id: wantToBuyId, categorySlug })
  const offerPath = getWantToBuyOfferPath({ id: wantToBuyId, categorySlug })
  const [message, setMessage] = useState("")
  const [price, setPrice] = useState("")
  const [listingPath, setListingPath] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (existingOffer) {
    return (
      <div className="rounded-[18px] border border-[rgba(15,23,42,0.06)] bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-[#000000]">Ваш отклик</h2>
          <OfferStatusBadge status={existingOffer.status} />
        </div>
        <p className="text-sm text-[#4B4B4B]">{existingOffer.message}</p>
        <p className="mt-3 text-lg font-bold text-[#000000]">
          {existingOffer.price.toLocaleString("ru-RU")} ₽
        </p>
        {existingOffer.listingPath ? (
          <Link
            href={existingOffer.listingPath}
            className="mt-2 inline-block text-sm font-medium text-[hsl(var(--nashlo-orange))] hover:underline"
          >
            Ваше объявление
          </Link>
        ) : null}
        <Button asChild variant="outline" className="mt-6 w-full">
          <Link href={detailPath}>К заявке</Link>
        </Button>
      </div>
    )
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const priceNum = Number.parseInt(price.replace(/\s/g, ""), 10)
    if (!message.trim() || message.trim().length < 10) {
      setError("Сообщение — минимум 10 символов")
      return
    }
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setError("Укажите корректную цену")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/want-to-buy/${wantToBuyId}/offer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          price: priceNum,
          listingPath: listingPath.trim() || null,
        }),
      })
      const data = (await res.json()) as { error?: string }
      if (res.status === 401) {
        router.push(`/login?return=${encodeURIComponent(offerPath)}`)
        return
      }
      if (!res.ok) {
        setError(data.error ?? "Не удалось отправить отклик")
        return
      }
      router.push(`${detailPath}?offered=1`)
      router.refresh()
    } catch {
      setError("Ошибка сети")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[18px] border border-[rgba(15,23,42,0.06)] bg-white p-6 shadow-sm"
    >
      <p className="mb-6 text-sm text-[#4B4B4B]">
        Заявка: <span className="font-semibold text-[#000000]">{title}</span>
      </p>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="offer-message">Ваше предложение</Label>
          <Textarea
            id="offer-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Опишите товар, состояние, комплектацию…"
            rows={5}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="offer-price">Цена, ₽</Label>
          <Input
            id="offer-price"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="60 000"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="offer-listing">Ссылка на ваше объявление (необязательно)</Label>
          <Input
            id="offer-listing"
            value={listingPath}
            onChange={(e) => setListingPath(e.target.value)}
            placeholder="/listings/iphone-14-pro-moskva-…"
          />
          <p className="text-xs text-[#4B4B4B]">
            Только объявления на Нашло. Внешние ссылки не принимаются.
          </p>
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Отправка…" : "Отправить предложение"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={detailPath}>Отмена</Link>
        </Button>
      </div>
    </form>
  )
}
