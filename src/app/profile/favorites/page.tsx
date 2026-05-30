"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Heart, MapPin, Search } from "lucide-react"
import { CabinetPage } from "@/components/profile/CabinetPage"
import { EmptyState } from "@/components/profile/EmptyState"
import { cn } from "@/lib/utils"

type Listing = {
  id: string
  title: string
  price: number
  images: string[]
  status: string
  city: string | null
  createdAt?: string
  seller: { id: string; name: string | null; avatar: string | null }
}

type WantToBuyItem = {
  id: string
  title: string
  priceMax: number | null
  city: string | null
  category: string | null
  status: string
  createdAt?: string
  offerCount?: number
}

type TabId = "listings" | "want" | "searches"

const TABS: { id: TabId; label: string }[] = [
  { id: "listings", label: "Объявления" },
  { id: "want", label: "Куплю" },
  { id: "searches", label: "Поиски" },
]

function formatPrice(price: number): string {
  if (price === 0) return "Бесплатно"
  return price.toLocaleString("ru-RU") + " ₽"
}

function formatMaxPrice(price: number | null): string {
  if (!price) return "Цена не указана"
  return "до " + price.toLocaleString("ru-RU") + " ₽"
}

function formatDate(value?: string): string {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
}

function SkeletonList() {
  return (
    <div className="space-y-2.5">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex gap-3 overflow-hidden rounded-2xl border border-zinc-100 bg-white p-3 animate-pulse"
        >
          <div className="h-[88px] w-[88px] shrink-0 rounded-xl bg-zinc-100" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-3 w-3/4 rounded-full bg-zinc-100" />
            <div className="h-4 w-2/5 rounded-full bg-zinc-200" />
            <div className="h-3 w-1/2 rounded-full bg-zinc-100" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ProfileFavoritesPage() {
  const [tab, setTab] = useState<TabId>("listings")

  const [listings, setListings] = useState<Listing[]>([])
  const [listingsLoading, setListingsLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)

  const [wantItems, setWantItems] = useState<WantToBuyItem[]>([])
  const [wantLoading, setWantLoading] = useState(false)
  const [wantFetched, setWantFetched] = useState(false)

  // Fetch listings favorites on mount
  useEffect(() => {
    fetch("/api/favorites")
      .then((r) => r.json())
      .then((d) => {
        setListings(d.favorites ?? d.listings ?? [])
        setListingsLoading(false)
      })
      .catch(() => setListingsLoading(false))
  }, [])

  // Fetch want-to-buy only when tab is opened for the first time
  useEffect(() => {
    if (tab !== "want" || wantFetched) return
    setWantLoading(true)
    setWantFetched(true)
    fetch("/api/want-to-buy?mine=1&limit=50")
      .then((r) => r.json())
      .then((d) => {
        setWantItems(d.items ?? [])
        setWantLoading(false)
      })
      .catch(() => setWantLoading(false))
  }, [tab, wantFetched])

  const removeListingFav = async (id: string) => {
    setRemoving(id)
    await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: id }),
    })
    setListings((prev) => prev.filter((l) => l.id !== id))
    setRemoving(null)
  }

  const listingsCount = listingsLoading ? null : listings.length
  const wantCount = wantFetched && !wantLoading ? wantItems.length : null

  const subtitle =
    tab === "listings"
      ? listingsCount === null
        ? "Загружаем..."
        : listingsCount === 0
          ? "Сохраняйте объявления сердечком"
          : listingsCount + " сохранённых"
      : tab === "want"
        ? wantCount === null
          ? "Ваши активные заявки"
          : wantCount === 0
            ? "Нет активных заявок"
            : wantCount + " заявок"
        : "Сохранённые фильтры поиска"

  return (
    <CabinetPage title="Избранное" subtitle={subtitle}>
      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-xl bg-[#F3F4F6] p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 rounded-lg py-2 text-[13px] font-medium transition",
              tab === t.id
                ? "bg-white text-[#111827] shadow-sm"
                : "text-[#6B7280] hover:text-[#374151]",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Listings tab */}
      {tab === "listings" && (
        <>
          {listingsLoading ? (
            <SkeletonList />
          ) : listings.length === 0 ? (
            <EmptyState
              icon="&#x2764;&#xFE0F;"
              title="В избранном пока пусто"
              description="Нажимайте на сердечко на объявлениях, чтобы сохранить их сюда."
              actionLabel="Смотреть объявления"
              actionHref="/"
            />
          ) : (
            <div className="space-y-2.5">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className="flex gap-3 overflow-hidden rounded-2xl border border-zinc-100 bg-white p-3 shadow-[0_1px_4px_rgba(15,23,42,0.04)]"
                >
                  <Link href={"/listings/" + listing.id} className="shrink-0">
                    <div className="h-[88px] w-[88px] overflow-hidden rounded-xl bg-zinc-100">
                      {listing.images[0] ? (
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl">
                          {"&#x1F4E6;"}
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                    <div className="min-w-0">
                      <Link href={"/listings/" + listing.id}>
                        <p className="line-clamp-2 text-[13px] font-medium leading-snug text-zinc-800">
                          {listing.title}
                        </p>
                      </Link>
                      <p className="mt-1 text-[15px] font-bold text-zinc-950">
                        {formatPrice(listing.price)}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        {listing.city ? (
                          <span className="flex items-center gap-0.5 text-[11px] text-zinc-400">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {listing.city}
                          </span>
                        ) : null}
                        {listing.createdAt ? (
                          <span className="text-[11px] text-zinc-400">
                            {formatDate(listing.createdAt)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <Link
                      href={"/listings/" + listing.id}
                      className="mt-2 inline-flex text-[12px] font-semibold text-[#FF4F12]"
                    >
                      Смотреть
                    </Link>
                  </div>

                  <div className="flex shrink-0 items-start pt-0.5">
                    <button
                      type="button"
                      onClick={() => removeListingFav(listing.id)}
                      disabled={removing === listing.id}
                      aria-label="Убрать из избранного"
                      className="flex h-10 w-10 items-center justify-center rounded-full transition active:bg-red-50 disabled:opacity-40"
                    >
                      {removing === listing.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-200 border-t-[#FF4F12]" />
                      ) : (
                        <Heart className="h-5 w-5 fill-[#FF4F12] text-[#FF4F12]" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Want-to-buy tab */}
      {tab === "want" && (
        <>
          {wantLoading ? (
            <SkeletonList />
          ) : wantItems.length === 0 ? (
            <EmptyState
              icon="&#x1F6D2;"
              title="Нет активных заявок"
              description="Разместите заявку — продавцы сами предложат вам товар."
              actionLabel="Создать заявку"
              actionHref="/kyplu/create"
            />
          ) : (
            <div className="space-y-2.5">
              {wantItems.map((item) => (
                <Link
                  key={item.id}
                  href={"/kyplu/" + item.id}
                  className="flex gap-3 overflow-hidden rounded-2xl border border-zinc-100 bg-white p-3 shadow-[0_1px_4px_rgba(15,23,42,0.04)] transition hover:border-[#FF4F12]/20"
                >
                  <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-xl bg-[#FFF3EC] text-2xl">
                    {"&#x1F6D2;"}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                    <div className="flex items-start gap-2">
                      <span className="rounded-full bg-[#FFF3EC] px-2 py-0.5 text-[10px] font-semibold text-[#FF4F12]">
                        Куплю
                      </span>
                      {item.status === "ACTIVE" ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                          Активна
                        </span>
                      ) : (
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">
                          {item.status === "CLOSED" ? "Закрыта" : "Архив"}
                        </span>
                      )}
                    </div>
                    <p className="line-clamp-2 text-[13px] font-medium leading-snug text-zinc-800">
                      {item.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-[13px] font-semibold text-zinc-900">
                        {formatMaxPrice(item.priceMax)}
                      </span>
                      {item.city ? (
                        <span className="flex items-center gap-0.5 text-[11px] text-zinc-400">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {item.city}
                        </span>
                      ) : null}
                    </div>
                    {item.offerCount != null && item.offerCount > 0 ? (
                      <p className="text-[11px] text-[#FF4F12]">
                        {item.offerCount} {item.offerCount === 1 ? "предложение" : item.offerCount < 5 ? "предложения" : "предложений"}
                      </p>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {/* Saved searches tab */}
      {tab === "searches" && (
        <EmptyState
          icon="&#x1F50D;"
          title="Сохранённые поиски"
          description="Сохраняйте поисковые запросы, чтобы следить за новыми объявлениями."
          actionLabel="Перейти к поиску"
          actionHref="/search"
        />
      )}
    </CabinetPage>
  )
}
