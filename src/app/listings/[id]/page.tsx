"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { notFound } from "next/navigation"
import { CalendarDays, Eye, Flag, Heart, MapPin, MessageCircle, Phone, Share2 } from "lucide-react"
import { formatPrice, imageToneForCategory, categorySlug } from "@/lib/listing-types"
import { ContactSellerModal } from "@/components/marketplace/ContactSellerModal"
import { ReportModal } from "@/components/marketplace/ReportModal"
import { YandexMap } from "@/components/YandexMap"
import { ListingCard } from "@/components/marketplace/ListingCard"
import type { AppListing } from "@/lib/listing-types"
import { trackListingInterest } from "@/lib/recommendations"
import { ListingBreadcrumbs } from "@/components/listings/ListingBreadcrumbs"
import { getListingBreadcrumbs } from "@/lib/categories/listing-breadcrumbs"
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonld"
import { getVisibleListingAttributes } from "@/lib/listings/format-listing-attributes"

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
  const [similar, setSimilar] = useState<AppListing[]>([])

  useEffect(() => {
    fetch(`/api/listings/${params.id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        const nextListing = data?.listing ?? null
        setListing(nextListing)
        if (nextListing) {
          trackListingInterest(nextListing, 5)
          const slug = categorySlug(nextListing)
          if (slug) {
            fetch(`/api/listings?category=${slug}&pageSize=7`)
              .then((r) => r.ok ? r.json() : null)
              .then((d) => {
                const items: AppListing[] = d?.items ?? []
                setSimilar(items.filter((l) => l.id !== params.id).slice(0, 6))
              })
              .catch(() => {})
          }
        }
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
      body: JSON.stringify({
        targetUserId: listing.seller.id,
        listingId: listing.id,
        rating: reviewRating,
        text: reviewText,
      }),
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
  const visibleAttrs = getVisibleListingAttributes(attrs, slug)
  const isOwn = me?.id === listing.seller?.id
  const favoriteCount = listing._count?.favorites ?? 0
  const viewCount = listing.views ?? listing.uniqueViews ?? 0
  const publishedAt = listing.createdAt ? new Date(listing.createdAt).toLocaleDateString("ru-RU") : null
  const sellerSince = listing.seller?.createdAt ? new Date(listing.seller.createdAt).toLocaleDateString("ru-RU", { month: "long", year: "numeric" }) : null

  function openWrite() { setContactTab("write"); setContactOpen(true) }
  function openCall() { setContactTab("call"); setContactOpen(true) }

  // ── Breadcrumbs ───────────────────────────────────────────────────────────
  const catSlug = slug || null
  const catNameRu =
    typeof listing.category === "object" ? (listing.category?.nameRu ?? null) : null
  const subcatValue =
    (attrs as Record<string, unknown> | null | undefined)?.subcategory as string | null ?? null
  const breadcrumbs = getListingBreadcrumbs({
    title: listing.title,
    categorySlug: catSlug,
    categoryNameRu: catNameRu,
    subcategoryValue: subcatValue,
  })
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(breadcrumbs, listing.id)

  return (
    <>
      <ListingBreadcrumbs crumbs={breadcrumbs} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
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
        <ReportModal variant="listing" listingId={listing.id} listingTitle={listing.title} onClose={() => setReportOpen(false)} />
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
                  &#9733;
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
        <div className="min-w-0">
          <div className={"relative overflow-hidden rounded-[28px] border border-zinc-100 bg-gradient-to-br shadow-sm sm:rounded-[32px] " + tone}>
            {mainImage ? (
              <img src={mainImage} alt={listing.title}
                className="h-72 w-full object-cover sm:h-96 lg:h-[500px]"
                onError={(e) => { (e.target as HTMLImageElement).src = "/categories/" + slug + ".svg" }} />
            ) : (
              <div className="flex h-72 w-full items-center justify-center sm:h-96 lg:h-[500px]">
                <img src={"/categories/" + slug + ".svg"} alt="" className="h-24 w-24 opacity-50" />
              </div>
            )}
            <button onClick={toggleFav} aria-label="Избранное"
              className={"absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border shadow-sm backdrop-blur-md transition active:scale-95 " + (isFav ? "border-red-200 bg-red-50 text-red-500" : "border-white/50 bg-white/85 text-zinc-700 hover:text-red-500")}>
              <Heart className="h-5 w-5" fill={isFav ? "currentColor" : "none"} />
            </button>
            {images.length > 0 && (
              <div className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm backdrop-blur">
                {currentImage + 1} / {images.length}
              </div>
            )}
            {listing.status === "SOLD" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="rounded-2xl bg-white px-6 py-3 text-lg font-bold text-zinc-950">Продано</span>
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {images.map((img, i) => (
                <button key={i} type="button" onClick={() => setCurrentImage(i)}
                  className={"h-16 w-16 shrink-0 overflow-hidden rounded-2xl border bg-zinc-100 transition " + (i === currentImage ? "border-zinc-950 opacity-100 ring-2 ring-zinc-950/10" : "border-transparent opacity-70 hover:opacity-100")}>
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

          <div className="mt-5 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm lg:hidden">
            {listing.city && <p className="flex items-center gap-1.5 text-sm font-medium text-zinc-500"><MapPin className="h-4 w-4" />{listing.city}</p>}
            <p className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950">{formatPrice(listing.price)}</p>
            {!isOwn ? (
              <>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button onClick={openWrite} className="flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-4 text-sm font-semibold text-white">
                    <MessageCircle className="h-4 w-4" /> Написать
                  </button>
                  <button onClick={openCall} className="flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-950">
                    <Phone className="h-4 w-4" /> Позвонить
                  </button>
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-zinc-400">
                  Проверяйте информацию перед сделкой. Nashlo не является стороной сделки между пользователями.
                </p>
              </>
            ) : (
              <Link href={"/my-listings/" + listing.id + "/edit"} className="mt-4 flex min-h-11 items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-950">
                Редактировать
              </Link>
            )}
          </div>

          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">{listing.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-500">
            {listing.city && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{listing.city}</span>}
            {publishedAt && <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{publishedAt}</span>}
            {viewCount > 0 && <span className="flex items-center gap-1.5"><Eye className="h-4 w-4" />{viewCount.toLocaleString("ru-RU")} просмотров</span>}
            <span>ID {listing.id.slice(0, 8)}</span>
          </div>

          <section className="mt-6 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-950">Описание</h2>
            <p className="mt-4 whitespace-pre-line text-base leading-7 text-zinc-600">
              {listing.description?.trim() || "Описание не указано"}
            </p>
            <p className="mt-4 rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-xs leading-relaxed text-amber-950">
              Перед встречей и оплатой проверьте объявление и собеседника. Nashlo не участвует в сделке между пользователями и не принимает деньги за товар или услугу из объявления.
            </p>
          </section>

          {visibleAttrs.length > 0 && (
            <div className="mt-6 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-xl font-semibold tracking-tight text-zinc-950">Характеристики</h2>
              <dl className="mt-4 grid gap-2 sm:grid-cols-2">
                {visibleAttrs.map((attr) => (
                  <div key={attr.key} className="rounded-2xl bg-zinc-50 px-4 py-3">
                    <dt className="text-xs font-medium text-zinc-500">{attr.label}</dt>
                    <dd className="mt-1 text-sm font-semibold text-zinc-950">{attr.value}</dd>
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

        <aside className="hidden h-fit rounded-[32px] border border-zinc-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] lg:sticky lg:top-6 lg:block">
          <div className="flex items-start justify-between gap-2">
            <div>
              {listing.city && <p className="flex items-center gap-1.5 text-sm font-medium text-zinc-500"><MapPin className="h-4 w-4" />{listing.city}</p>}
              <p className="mt-1 text-4xl font-semibold tracking-tight text-zinc-950">{formatPrice(listing.price)}</p>
              {favoriteCount > 0 && <p className="mt-1 text-sm text-zinc-400">{favoriteCount.toLocaleString("ru-RU")} добавили в избранное</p>}
            </div>
          </div>

          {listing.seller && (
            <div className="mt-5 rounded-[24px] bg-zinc-50 p-4">
              <Link href={"/profile/" + listing.seller.id} className="flex items-center gap-3 hover:opacity-80">
                {listing.seller.avatar ? (
                  <img src={listing.seller.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-sm font-semibold text-white">
                    {(listing.seller.name ?? "П")[0]}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-zinc-950">{listing.seller.name ?? "Продавец"}</p>
                  {(listing.seller.rating ?? 0) > 0 && (
                    <p className="mt-0.5 text-sm text-zinc-500">★ {listing.seller.rating!.toFixed(1)} · {listing.seller.reviewCount} отз.</p>
                  )}
                  {sellerSince && <p className="mt-0.5 text-xs text-zinc-400">На Нашло с {sellerSince}</p>}
                </div>
              </Link>
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
                  &#10003; Продано
                </div>
              )}
              <button onClick={shareListing}
                className="flex items-center justify-center gap-2 rounded-full border-2 border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50">
                <Share2 className="h-4 w-4" />
                {shared ? "Ссылка скопирована" : "Поделиться"}
              </button>
            </div>
          ) : (
            <div className="mt-4 grid gap-2">
              <button onClick={openWrite}
                className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-zinc-800">
                <MessageCircle className="h-4 w-4" />
                Написать продавцу
              </button>
              <button onClick={openCall}
                className="flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-zinc-200 bg-white px-5 py-4 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-50">
                <Phone className="h-4 w-4" />
                Позвонить продавцу
              </button>
              <button onClick={toggleFav}
                className="flex items-center justify-center gap-2 rounded-full border-2 border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50">
                <Heart className="h-4 w-4" fill={isFav ? "currentColor" : "none"} />
                {isFav ? "В избранном" : "В избранное"}
              </button>
              <button onClick={shareListing}
                className="flex items-center justify-center gap-2 rounded-full border-2 border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50">
                <Share2 className="h-4 w-4" />
                {shared ? "Ссылка скопирована" : "Поделиться"}
              </button>
              {me && !reviewSent && (
                <button onClick={() => setReviewOpen(true)}
                  className="rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50">
                  Оставить отзыв
                </button>
              )}
              {reviewSent && <p className="text-center text-sm text-emerald-600">Отзыв отправлен &#10003;</p>}
              <button onClick={() => setReportOpen(true)}
                className="flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-medium text-zinc-400 transition hover:text-zinc-600">
                <Flag className="h-3.5 w-3.5" />
                Пожаловаться
              </button>
              <p className="text-center text-[11px] leading-relaxed text-zinc-400">
                Проверяйте информацию перед сделкой. Nashlo не является стороной сделки между пользователями.
              </p>
            </div>
          )}
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-12">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">Похожие объявления</h2>
            <Link href={`/search?category=${slug}`}
              className="text-sm font-semibold text-zinc-500 hover:text-zinc-950">
              Все в категории &#8594;
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-3">
            {similar.map((l) => <ListingCard key={l.id} listing={l} compact />)}
          </div>
        </section>
      )}
    </main>
    </>
  )
}
