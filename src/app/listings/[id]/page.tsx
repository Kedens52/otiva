"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { notFound } from "next/navigation"
import { formatPrice, imageToneForCategory, categorySlug } from "@/lib/listing-types"
import { ContactSellerModal } from "@/components/marketplace/ContactSellerModal"
import { ReportModal } from "@/components/marketplace/ReportModal"
import { YandexMap } from "@/components/YandexMap"
import type { AppListing } from "@/lib/listing-types"
import { trackListingInterest } from "@/lib/recommendations"

type FullListing = AppListing & {
  video?: string | null
  lat?: number | null
  lng?: number | null
  location?: string | null
  seller?: {
    id?: string
    name?: string | null
    avatar?: string | null
    phone?: string | null
    rating?: number
    reviewCount?: number
    isVerified?: boolean
    createdAt?: string
  }
}

export default function ListingDetailPage({ params }: { params: { id: string } }) {
  const [listing, setListing] = useState<FullListing | null>(null)
  const [loading, setLoading] = useState(true)
  const [contactOpen, setContactOpen] = useState(false)
  const [contactTab, setContactTab] = useState<"write" | "call">("write")
  const [reportOpen, setReportOpen] = useState(false)
  const [currentImage, setCurrentImage] = useState(0)
  const [me, setMe] = useState<{ id: string } | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewText, setReviewText] = useState("")
  const [reviewSent, setReviewSent] = useState(false)
  const [isFav, setIsFav] = useState(false)
  const [shared, setShared] = useState(false)
  const [markingSold, setMarkingSold] = useState(false)

  useEffect(() => {
    fetch(`/api/listings/${params.id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        const nextListing = data?.listing ?? null
        setListing(nextListing)
        if (nextListing) trackListingInterest(nextListing, 5)
        setLoading(false)
      })
      .catch(() => setLoading(false))

    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.user ?? data) setMe(data?.user ?? data) })
      .catch(() => {})

    fetch("/api/favorites")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.favorites?.some((f: { id: string }) => f.id === params.id)) setIsFav(true)
      })
      .catch(() => {})
  }, [params.id])

  async function toggleFav() {
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: params.id }),
    })
    if (res.ok) setIsFav((v) => !v)
  }

  async function submitReview() {
    if (!listing?.seller?.id) return
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sellerId: listing.seller.id, rating: reviewRating, text: reviewText }),
    })
    if (res.ok) { setReviewSent(true); setReviewOpen(false) }
  }

  async function shareListing() {
    const url = window.location.href
    if (navigator.share) {
      try { await navigator.share({ title: listing?.title, url }) } catch {}
    } else {
      await navigator.clipboard.writeText(url).catch(() => {})
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    }
  }

  async function markAsSold() {
    if (!listing) return
    setMarkingSold(true)
    const res = await fetch(`/api/listings/${listing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "SOLD" }),
    })
    if (res.ok) setListing((prev) => prev ? { ...prev, status: "SOLD" } : prev)
    setMarkingSold(false)
  }

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-20 text-center text-sm text-zinc-400">...</div>
  if (!listing) return notFound()

  const slug = categorySlug(listing)
  const tone = imageToneForCategory(slug)
  const images = listing.images?.length ? listing.images : []
  const mainImage = images[currentImage] ?? null
  const attrs = (listing as unknown as { attributes?: Record<string, unknown> }).attributes
  const ATTR_LABELS: Record<string, string> = {
    make: "Марка", model: "Модель", year: "Год выпуска", mileage: "Пробег",
    fuel: "Тип топлива", transmission: "КПП", body_type: "Тип кузова",
    vehicle_type: "Тип ТС", color: "Цвет", condition: "Состояние",
    property_type: "Тип жилья", rooms: "Комнат", area: "Площадь, м²",
    floor: "Этаж", floors_total: "Этажей в доме", deal_type: "Тип сделки",
    brand: "Бренд", storage: "Память", ram: "ОЗУ", size: "Размер",
    gender: "Пол", material: "Материал", subcategory: "Подкатегория",
    employment_type: "Тип занятости", experience: "Опыт", salary: "Зарплата",
    schedule: "График", breed: "Порода", age: "Возраст", weight: "Вес",
    service_type: "Формат", duration: "Длительность",
  }
  function attrLabel(key: string): string { return ATTR_LABELS[key] ?? key.replace(/_/g, " ") }
  function attrValue(key: string, value: unknown): string {
    const v = String(value)
    const VALUES: Record<string, Record<string, string>> = {
      condition: { new: "Новое", used: "Б/у", excellent: "Отличное", good: "Хорошее" },
      fuel: { petrol: "Бензин", diesel: "Дизель", electric: "Электро", hybrid: "Гибрид", gas: "Газ" },
      transmission: { manual: "Механика", automatic: "Автомат", robot: "Робот", variator: "Вариатор" },
      deal_type: { sell: "Продажа", rent: "Аренда", rent_daily: "Посуточно" },
      employment_type: { full: "Полная", part: "Частичная", remote: "Удалённо", contract: "Договор" },
      gender: { men: "Мужское", women: "Женское", kids: "Детское", unisex: "Унисекс" },
      vehicle_type: { car: "Легковой", truck: "Грузовой", moto: "Мотоцикл", commercial: "Коммерческий", special: "Спецтехника", trailer: "Прицеп" },
    }
    return VALUES[key]?.[v] ?? v
  }
  const isOwn = me?.id === listing.seller?.id

  function openWrite() { setContactTab("write"); setContactOpen(true) }
  function openCall() { setContactTab("call"); setContactOpen(true) }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 lg:py-10">
      {contactOpen && listing.seller?.id && (
        <ContactSellerModal
          sellerId={listing.seller.id}
          sellerName={listing.seller?.name ?? "Продавец"}
          sellerPhone={listing.seller?.phone ?? undefined}
          listingTitle={listing.title}
          listingId={listing.id}
          listingCategory={slug}
          city={listing.city ?? ""}
          onClose={() => setContactOpen(false)}
          initialTab={contactTab}
        />
      )}
      {reportOpen && (
        <ReportModal listingId={listing.id} listingTitle={listing.title} onClose={() => setReportOpen(false)} />
      )}

      {reviewOpen && !isOwn && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center px-4 pb-[env(safe-area-inset-bottom)] sm:items-center"
          onClick={() => setReviewOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-md rounded-t-[32px] bg-white p-6 shadow-2xl sm:rounded-[32px]"
            onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-200 sm:hidden" />
            <h2 className="text-xl font-semibold">Отзыв о продавце</h2>
            <div className="mt-4 flex gap-1">
              {[1,2,3,4,5].map((s) => (
                <button key={s} type="button" onClick={() => setReviewRating(s)}
                  className={"text-2xl transition " + (s <= reviewRating ? "text-amber-400" : "text-zinc-200")}>
                  ★
                </button>
              ))}
            </div>
            <textarea rows={3} value={reviewText} onChange={(e) => setReviewText(e.target.value)}
              placeholder="Расскажите о сделке..."
              className="mt-4 w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-sm outline-none focus:border-zinc-400 focus:bg-white" />
            <div className="mt-4 flex gap-3">
              <button onClick={() => setReviewOpen(false)}
                className="flex-1 rounded-2xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-600">
                Отмена
              </button>
              <button onClick={submitReview}
                className="flex-1 rounded-2xl bg-zinc-950 py-3 text-sm font-semibold text-white hover:bg-zinc-800">
                Отправить
              </button>
            </div>
          </div>
        </div>
      )}

      <Link href="/search" className="text-sm font-semibold text-zinc-500 hover:text-zinc-950">&#8592; Назад</Link>

      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] left-0 right-0 z-40 border-t border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur-sm lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-zinc-400">{listing.title}</p>
            <p className="text-xl font-bold text-zinc-950">{formatPrice(listing.price)}</p>
          </div>
          {!isOwn && (
            <>
              <button onClick={openWrite} className="shrink-0 rounded-full bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white">Написать</button>
              <button onClick={openCall} className="shrink-0 rounded-full border-2 border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-950">Позвонить</button>
            </>
          )}
          {isOwn && (
            <Link href={"/my-listings/" + listing.id + "/edit"}
              className="shrink-0 rounded-full border-2 border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-950">
              Изменить
            </Link>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div>
          <div className={"relative overflow-hidden rounded-[32px] bg-gradient-to-br " + tone}>
            {mainImage ? (
              <img src={mainImage} alt={listing.title}
                className="h-64 w-full object-cover sm:h-80 lg:h-96"
                onError={(e) => { (e.target as HTMLImageElement).src = "/categories/" + slug + ".svg" }} />
            ) : (
              <div className="flex h-64 w-full items-center justify-center sm:h-80 lg:h-96">
                <img src={"/categories/" + slug + ".svg"} alt="" className="h-24 w-24 opacity-50" />
              </div>
            )}
            <button onClick={toggleFav} aria-label="Избранное"
              className={"absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-2xl border shadow-sm backdrop-blur-sm transition " + (isFav ? "border-red-200 bg-red-50 text-red-500" : "border-white/30 bg-white/80 text-zinc-500 hover:text-red-400")}>
              {isFav ? "♥" : "♡"}
            </button>
            {listing.status === "SOLD" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="rounded-2xl bg-white px-6 py-3 text-lg font-bold text-zinc-950">Продано</span>
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button key={i} type="button" onClick={() => setCurrentImage(i)}
                  className={"h-16 w-16 shrink-0 overflow-hidden rounded-xl transition " + (i === currentImage ? "ring-2 ring-zinc-950" : "opacity-60 hover:opacity-100")}>
                  <img src={img} alt="" className="h-full w-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none" }} />
                </button>
              ))}
            </div>
          )}

          {listing.video && (
            <div className="mt-4">
              <div className="overflow-hidden rounded-[28px] bg-black">
                <video src={listing.video} controls className="max-h-72 w-full" />
              </div>
            </div>
          )}

          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">{listing.title}</h1>
          {listing.description && (
            <p className="mt-4 text-base leading-7 text-zinc-500">{listing.description}</p>
          )}

          {attrs && Object.keys(attrs).length > 0 && (
            <div className="mt-6 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-zinc-950">Характеристики</h2>
              <dl className="mt-4 grid gap-2 sm:grid-cols-2">
                {Object.entries(attrs).filter(([, v]) => v !== null && v !== undefined && v !== "").map(([name, value]) => (
                  <div key={name} className="rounded-xl bg-zinc-50 px-4 py-3">
                    <dt className="text-xs text-zinc-500">{attrLabel(name)}</dt>
                    <dd className="mt-0.5 text-sm font-semibold text-zinc-950">{attrValue(name, value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {listing.lat && listing.lng && (
            <div className="mt-6">
              <h2 className="mb-3 text-base font-semibold text-zinc-950">
                Расположение{listing.location ? " — " + listing.location : listing.city ? " — " + listing.city : ""}
              </h2>
              <YandexMap lat={listing.lat} lng={listing.lng} className="h-56 w-full" />
            </div>
          )}
        </div>

        <aside className="order-first h-fit rounded-[32px] border border-zinc-200 bg-zinc-50 p-5 shadow-inner lg:order-last lg:sticky lg:top-6">
          <div className="flex items-start justify-between gap-2">
            <div>
              {listing.city && <p className="text-sm text-zinc-500">{listing.city}</p>}
              <p className="mt-1 text-4xl font-semibold tracking-tight text-zinc-950">{formatPrice(listing.price)}</p>
            </div>
          </div>

          {listing.seller && (
            <div className="mt-5 rounded-[24px] bg-white p-4 shadow-sm">
              <Link href={"/profile/" + listing.seller.id} className="flex items-center gap-3 hover:opacity-80">
                {listing.seller.avatar ? (
                  <img src={listing.seller.avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-sm font-semibold text-white">
                    {(listing.seller.name ?? "П")[0]}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-zinc-950">{listing.seller.name ?? "Продавец"}</p>
                  {(listing.seller.rating ?? 0) > 0 && (
                    <p className="mt-0.5 text-sm text-zinc-500">★ {listing.seller.rating!.toFixed(1)} · {listing.seller.reviewCount} отз.</p>
                  )}
                </div>
              </Link>
              {listing.seller.isVerified && (
                <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                  ✓ Проверенный продавец
                </p>
              )}
            </div>
          )}

          {isOwn ? (
            <div className="mt-4 grid gap-2">
              <Link href={"/my-listings/" + listing.id + "/edit"}
                className="flex items-center justify-center rounded-full border-2 border-zinc-200 bg-white px-5 py-3.5 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-50">
                Редактировать
              </Link>
              {listing.status === "ACTIVE" && (
                <button onClick={markAsSold} disabled={markingSold}
                  className="flex items-center justify-center rounded-full border-2 border-blue-200 bg-blue-50 px-5 py-3.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50">
                  {markingSold ? "Обновляем..." : "Отметить как продано"}
                </button>
              )}
              {listing.status === "SOLD" && (
                <div className="flex items-center justify-center rounded-full bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700">
                  ✓ Продано
                </div>
              )}
              <button onClick={shareListing}
                className="flex items-center justify-center rounded-full border-2 border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50">
                {shared ? "Ссылка скопирована" : "Поделиться"}
              </button>
            </div>
          ) : (
            <div className="mt-4 grid gap-2">
              <button onClick={openWrite}
                className="rounded-full bg-zinc-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-zinc-800">
                Написать продавцу
              </button>
              <button onClick={openCall}
                className="rounded-full border-2 border-zinc-200 bg-white px-5 py-4 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-50">
                Позвонить продавцу
              </button>
              <button onClick={shareListing}
                className="flex items-center justify-center rounded-full border-2 border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50">
                {shared ? "Ссылка скопирована" : "Поделиться"}
              </button>
              {me && !reviewSent && (
                <button onClick={() => setReviewOpen(true)}
                  className="rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50">
                  Оставить отзыв
                </button>
              )}
              {reviewSent && <p className="text-center text-sm text-emerald-600">Отзыв отправлен ✓</p>}
              <button onClick={() => setReportOpen(true)}
                className="rounded-full py-2 text-xs font-medium text-zinc-400 transition hover:text-zinc-600">
                Пожаловаться
              </button>
            </div>
          )}
        </aside>
      </div>
    </main>
  )
}
