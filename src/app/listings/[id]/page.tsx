"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { notFound } from "next/navigation"
import { BadgeCheck, CalendarDays, Eye, Flag, Heart, MapPin, MessageCircle, Phone, ShieldCheck } from "lucide-react"
import { ListingShareButtons } from "@/components/marketplace/ListingShareButtons"
import { formatPrice, imageToneForCategory, categorySlug, normalizeListingImageUrl } from "@/lib/listing-types"
import { ContactSellerModal } from "@/components/marketplace/ContactSellerModal"
import { ReportModal } from "@/components/marketplace/ReportModal"
import { YandexMap } from "@/components/YandexMap"
import { ListingCard } from "@/components/marketplace/ListingCard"
import { ListingPriceInsightBadge } from "@/components/marketplace/ListingPriceInsightBadge"
import type { AppListing } from "@/lib/listing-types"
import { trackListingInterest } from "@/lib/recommendations"
import { ListingBreadcrumbs } from "@/components/listings/ListingBreadcrumbs"
import { getListingBreadcrumbs } from "@/lib/categories/listing-breadcrumbs"
import { getVisibleListingAttributes } from "@/lib/listings/format-listing-attributes"
import { UserBadges } from "@/components/profile/UserBadges"
import type { PublicUserBadge } from "@/lib/badges/badge-map"
import { buildListingImageAlt } from "@/lib/seo/image-alt"
import { parseListingIdFromSlug, isListingCuid } from "@/lib/seo/slug"
import { getSellerPublicPath } from "@/lib/seo/paths"
import { AdSlot } from "@/components/marketplace/AdSlot"
import { ListingSeoLinks } from "@/components/listings/ListingSeoLinks"
import { PAGE_CONTAINER_WIDE_CLASS } from "@/components/layout/PageContainer"

type PriceInsight = {
  status: string
  message?: string | null
  min?: number | null
  max?: number | null
  sampleSize?: number
}

type FullListing = AppListing & {
  priceInsight?: PriceInsight | null
  buyerPriceHint?: string | null
  video?: string | null
  lat?: number | null
  lng?: number | null
  location?: string | null
  seller?: {
    id?: string
    name?: string | null
    avatar?: string | null
    phone?: string | null
    phoneAvailable?: boolean
    phoneMasked?: string
    rating?: number
    reviewCount?: number
    isVerified?: boolean
    badges?: PublicUserBadge[]
    createdAt?: string
    publicSlug?: string | null
    profileHeadline?: string | null
    profileTypeLabel?: string
    sellerRoleLabel?: string | null
    companyName?: string | null
    locationLabel?: string | null
    avgResponseMinutes?: number | null
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
  const [pageUrl, setPageUrl] = useState("")
  const [isFav, setIsFav] = useState(false)
  const [markingSold, setMarkingSold] = useState(false)
  const [similar, setSimilar] = useState<AppListing[]>([])
  const [sellerListings, setSellerListings] = useState<AppListing[]>([])
  const [fetchError, setFetchError] = useState<string | null>(null)

  const routeParam = params.id

  async function loadListing(segment: string) {
    const res = await fetch(`/api/listings/${encodeURIComponent(segment)}`)
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      return {
        listing: null as FullListing | null,
        sellerOtherListings: [] as AppListing[],
        error: data?.error ?? `Ошибка ${res.status}`,
      }
    }
    return {
      listing: (data?.listing ?? null) as FullListing | null,
      sellerOtherListings: (data?.sellerOtherListings ?? []) as AppListing[],
      error: null as string | null,
    }
  }

  useEffect(() => {
    setLoading(true)
    setFetchError(null)

    void (async () => {
      let result = await loadListing(routeParam)

      if (!result.listing) {
        const parsedId = parseListingIdFromSlug(routeParam)
        if (parsedId !== routeParam && isListingCuid(parsedId)) {
          result = await loadListing(parsedId)
        }
      }

      const nextListing = result.listing
      if (!nextListing) {
        setFetchError(result.error)
        setListing(null)
        setSellerListings([])
        setLoading(false)
        return
      }

      setListing(nextListing)
      setSellerListings(result.sellerOtherListings ?? [])
        if (nextListing) {
          trackListingInterest(nextListing, 5)
          const slug = categorySlug(nextListing)
          if (slug) {
            fetch(`/api/listings?category=${slug}&pageSize=7`)
              .then((r) => r.ok ? r.json() : null)
              .then((d) => {
                const items: AppListing[] = d?.items ?? []
                setSimilar(items.filter((l) => l.id !== nextListing.id).slice(0, 6))
              })
              .catch(() => {})
          }
        }
      setLoading(false)
    })().catch(() => {
      setFetchError("Не удалось загрузить объявление")
      setLoading(false)
    })

    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.user ?? data) setMe(data?.user ?? data) })
      .catch(() => {})

  }, [routeParam])

  useEffect(() => {
    if (!listing?.id) return
    fetch("/api/favorites")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.favorites?.some((f: { id: string }) => f.id === listing.id)) setIsFav(true)
      })
      .catch(() => {})
  }, [listing?.id])

  useEffect(() => {
    if (typeof window !== "undefined") setPageUrl(window.location.href)
  }, [routeParam])

  async function toggleFav() {
    if (!listing?.id) return
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: listing.id }),
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

  if (loading) return (
    <div className={`${PAGE_CONTAINER_WIDE_CLASS} animate-pulse py-4 lg:py-10`}>
      <div className="h-4 w-24 rounded-full bg-zinc-200" />
      <div className="mt-3 grid gap-5 lg:mt-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
        <div className="min-w-0 space-y-4">
          <div className="h-[220px] w-full rounded-xl bg-zinc-200 sm:h-80 sm:rounded-[28px] lg:aspect-[16/9] lg:h-[500px]" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 w-16 shrink-0 rounded-2xl bg-zinc-200" />
            ))}
          </div>
          <div className="space-y-3 pt-2">
            <div className="h-8 w-3/4 rounded-full bg-zinc-200" />
            <div className="h-5 w-1/2 rounded-full bg-zinc-100" />
          </div>
          <div className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm space-y-3">
            <div className="h-5 w-28 rounded-full bg-zinc-200" />
            <div className="h-4 w-full rounded-full bg-zinc-100" />
            <div className="h-4 w-11/12 rounded-full bg-zinc-100" />
            <div className="h-4 w-4/5 rounded-full bg-zinc-100" />
          </div>
        </div>
        <div className="hidden lg:block">
          <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
            <div className="h-8 w-28 rounded-full bg-zinc-200" />
            <div className="h-5 w-40 rounded-full bg-zinc-100" />
            <div className="h-[1px] bg-zinc-100" />
            <div className="flex items-center gap-3 rounded-[24px] bg-zinc-50 p-4">
              <div className="h-12 w-12 shrink-0 rounded-full bg-zinc-200" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-32 rounded-full bg-zinc-200" />
                <div className="h-3 w-24 rounded-full bg-zinc-100" />
              </div>
            </div>
            <div className="space-y-2 pt-1">
              <div className="h-12 rounded-full bg-zinc-200" />
              <div className="h-12 rounded-full bg-zinc-100" />
              <div className="h-11 rounded-full bg-zinc-100" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
  if (!listing) {
    if (fetchError) {
      return (
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <p className="text-lg font-semibold text-zinc-950">Объявление недоступно</p>
          <p className="mt-2 text-sm text-zinc-500">{fetchError}</p>
          <p className="mt-3 text-sm text-zinc-500">
            Если это ваше объявление на проверке или в черновике — откройте ссылку после входа в тот же аккаунт, что на компьютере.
          </p>
          <div className="mt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
            <Link
              href={`/login?from=${encodeURIComponent(`/listings/${routeParam}`)}`}
              className="inline-flex rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-950"
            >
              Войти
            </Link>
            <Link href="/" className="inline-flex rounded-xl bg-[hsl(var(--nashlo-orange))] px-5 py-2.5 text-sm font-semibold text-white">
              На главную
            </Link>
          </div>
        </div>
      )
    }
    return notFound()
  }

  const slug = categorySlug(listing)
  const tone = imageToneForCategory(slug)
  const images = (listing.images?.length ? listing.images : []).map(normalizeListingImageUrl)
  const mainImage = images[currentImage] ?? null
  const attrs = (listing as unknown as { attributes?: Record<string, unknown> }).attributes
  const visibleAttrs = getVisibleListingAttributes(attrs, slug)
  const isOwn = me?.id === listing.seller?.id
  const phoneAvailable = Boolean(listing.seller?.phoneAvailable)
  const favoriteCount = listing._count?.favorites ?? 0
  const viewCount = listing.views ?? listing.uniqueViews ?? 0
  const publishedAt = listing.createdAt ? new Date(listing.createdAt).toLocaleDateString("ru-RU") : null
  const sellerSince = listing.seller?.createdAt ? new Date(listing.seller.createdAt).toLocaleDateString("ru-RU", { month: "long", year: "numeric" }) : null
  const sellerHref = listing.seller?.id
    ? getSellerPublicPath({
        id: listing.seller.id,
        slug: listing.seller.publicSlug,
        name: listing.seller.name,
      })
    : null

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
    attributes: attrs as Record<string, unknown> | null | undefined,
  })
  return (
    <>
      <ListingBreadcrumbs crumbs={breadcrumbs} />
      <main className={`${PAGE_CONTAINER_WIDE_CLASS} py-4 pb-[calc(env(safe-area-inset-bottom)+var(--nashlo-mobile-nav-h)+4.75rem)] sm:py-5 lg:py-8 lg:pb-8`}>
      {contactOpen && listing.seller?.id && (
        <ContactSellerModal
          sellerId={listing.seller.id}
          sellerName={listing.seller?.name ?? "Продавец"}
          phoneAvailable={phoneAvailable}
          phoneMasked={listing.seller?.phoneMasked}
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
                className="flex-1 rounded-xl bg-[hsl(var(--nashlo-orange))] py-3 text-sm font-semibold text-white hover:bg-[hsl(var(--nashlo-orange)/0.92)]">
                Отправить
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => window.history.length > 1 ? window.history.back() : (window.location.href = "/")}
        className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-zinc-500 shadow-[0_1px_3px_rgba(15,23,42,0.05)] transition hover:text-zinc-950"
      >
        &#8592; Назад
      </button>

      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+var(--nashlo-mobile-nav-h))] left-0 right-0 z-40 border-t border-zinc-200 bg-white/95 px-3 py-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur-sm lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] text-zinc-400">{listing.title}</p>
            <p className="text-lg font-bold leading-tight text-zinc-950">{formatPrice(listing.price)}</p>
          </div>
          {!isOwn && (
            <>
              <button onClick={openWrite} className="shrink-0 rounded-xl bg-[hsl(var(--nashlo-orange))] px-3.5 py-2 text-sm font-semibold text-white">
                Написать
              </button>
              {phoneAvailable && (
                <button onClick={openCall} className="shrink-0 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm font-semibold text-zinc-950">
                  Звонок
                </button>
              )}
            </>
          )}
          {isOwn && (
            <Link href={"/my-listings/" + listing.id + "/edit"}
              className="shrink-0 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm font-semibold text-zinc-950">
              Изменить
            </Link>
          )}
        </div>
      </div>

      <div className="mt-3 grid gap-5 lg:mt-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <div className={"relative overflow-hidden rounded-xl border border-white/80 bg-gradient-to-br shadow-[0_1px_3px_rgba(15,23,42,0.05)] sm:rounded-2xl lg:rounded-[24px] " + tone}>
            {mainImage ? (
              <img src={mainImage} alt={buildListingImageAlt(listing.title, listing.city, currentImage)}
                className="h-[220px] w-full object-cover sm:h-80 lg:h-[500px]"
                onError={(e) => { (e.target as HTMLImageElement).src = "/categories/" + slug + ".svg" }} />
            ) : (
              <div className="flex h-[220px] w-full items-center justify-center sm:h-80 lg:h-[500px]">
                <img src={"/categories/" + slug + ".svg"} alt="" className="h-16 w-16 opacity-50 sm:h-24 sm:w-24" />
              </div>
            )}
            <button onClick={toggleFav} aria-label="Избранное"
              className={"absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border shadow-sm backdrop-blur-md transition active:scale-95 sm:right-4 sm:top-4 sm:h-11 sm:w-11 " + (isFav ? "border-orange-200 bg-orange-50 text-[hsl(var(--nashlo-orange))]" : "border-white/60 bg-white/90 text-zinc-700 hover:text-[hsl(var(--nashlo-orange))]")}>
              <Heart className="h-4 w-4 sm:h-5 sm:w-5" fill={isFav ? "currentColor" : "none"} />
            </button>
            {images.length > 0 && (
              <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 shadow-sm backdrop-blur sm:bottom-4 sm:left-4 sm:px-3 sm:py-1.5 sm:text-xs">
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
            <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mt-3 sm:gap-2">
              {images.map((img, i) => (
                <button key={i} type="button" onClick={() => setCurrentImage(i)}
                  className={"h-12 w-12 shrink-0 overflow-hidden rounded-xl border bg-zinc-100 transition sm:h-16 sm:w-16 sm:rounded-2xl " + (i === currentImage ? "border-zinc-950 opacity-100 ring-2 ring-zinc-950/10" : "border-transparent opacity-70 hover:opacity-100")}>
                  <img src={img} alt={buildListingImageAlt(listing.title, listing.city, i)} className="h-full w-full object-cover"
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

          <div className="mt-3 flex items-end justify-between gap-3 rounded-xl border border-white/80 bg-white px-3.5 py-3 shadow-[0_1px_3px_rgba(15,23,42,0.05)] lg:hidden">
            <div className="min-w-0">
              {listing.city && (
                <p className="flex items-center gap-1 text-xs text-zinc-500">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {listing.city}
                </p>
              )}
              <p className="mt-0.5 text-2xl font-semibold leading-tight tracking-tight text-zinc-950">
                {formatPrice(listing.price)}
              </p>
              {listing.price > 0 && (
                <div className="mt-2">
                  <ListingPriceInsightBadge
                    insight={listing.priceInsight}
                    buyerHint={listing.buyerPriceHint}
                    compact
                  />
                </div>
              )}
            </div>
            {favoriteCount > 0 && (
              <p className="shrink-0 text-[11px] text-zinc-400">{favoriteCount} в избранном</p>
            )}
          </div>

          <h1 className="mt-4 text-xl font-semibold leading-snug tracking-tight text-[#111827] sm:mt-6 sm:text-2xl lg:text-[2rem]">
            {listing.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 sm:mt-3 sm:gap-x-4 sm:text-sm">
            {listing.city && (
              <span className="hidden items-center gap-1 sm:inline-flex">
                <MapPin className="h-3.5 w-3.5" />
                {listing.city}
              </span>
            )}
            {publishedAt && (
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                {publishedAt}
              </span>
            )}
            {viewCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                {viewCount.toLocaleString("ru-RU")} просм.
              </span>
            )}
            <span className="text-zinc-400">ID {listing.id.slice(0, 8)}</span>
          </div>

          {listing.seller && sellerHref && (
            <div className="mt-4 rounded-xl border border-white/80 bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.05)] lg:hidden">
              <Link href={sellerHref} className="flex items-center gap-3">
                {listing.seller.avatar ? (
                  <img src={listing.seller.avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--nashlo-orange))] text-sm font-semibold text-white">
                    {(listing.seller.name ?? "П")[0]}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-zinc-950">{listing.seller.name ?? "Продавец"}</p>
                  {listing.seller.profileHeadline ? (
                    <p className="text-xs font-medium text-zinc-600">{listing.seller.profileHeadline}</p>
                  ) : null}
                  {listing.seller.locationLabel ? (
                    <p className="text-xs text-zinc-500">{listing.seller.locationLabel}</p>
                  ) : null}
                  {(listing.seller.rating ?? 0) > 0 && (
                    <p className="text-xs text-zinc-500">
                      ★ {listing.seller.rating!.toFixed(1)} · {listing.seller.reviewCount} отз.
                    </p>
                  )}
                </div>
                <span className="text-xs font-semibold text-zinc-400">Профиль →</span>
              </Link>
            </div>
          )}

          <section className="mt-4 rounded-xl border border-white/80 bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.05)] sm:mt-6 sm:rounded-2xl sm:p-5 lg:p-6">
            <h2 className="text-base font-semibold tracking-tight text-zinc-950 sm:text-xl">Описание</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-zinc-600 sm:mt-4 sm:text-base sm:leading-7">
              {listing.description?.trim() || "Описание не указано"}
            </p>
            <p className="mt-3 rounded-lg border border-orange-100 bg-orange-50/70 px-3 py-2 text-[11px] leading-relaxed text-orange-950 sm:mt-4 sm:rounded-xl sm:px-4 sm:py-3 sm:text-xs">
              Перед встречей и оплатой проверьте объявление и собеседника. Nashlo не участвует в сделке между пользователями.
            </p>
          </section>

          <ListingSeoLinks
            title={listing.title}
            city={listing.city}
            categorySlug={catSlug}
            categoryName={catNameRu ?? undefined}
            attributes={attrs as Record<string, unknown> | null | undefined}
          />

          {visibleAttrs.length > 0 && (
            <div className="mt-4 rounded-xl border border-white/80 bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.05)] sm:mt-6 sm:rounded-2xl sm:p-5 lg:p-6">
              <h2 className="text-base font-semibold tracking-tight text-zinc-950 sm:text-xl">Характеристики</h2>
              <dl className="mt-2.5 grid grid-cols-2 gap-1.5 sm:mt-4 sm:gap-2">
                {visibleAttrs.map((attr) => (
                  <div key={attr.key} className="rounded-lg bg-zinc-50 px-2.5 py-2 sm:rounded-2xl sm:px-4 sm:py-3">
                    <dt className="text-[10px] font-medium leading-tight text-zinc-500 sm:text-xs">{attr.label}</dt>
                    <dd className="mt-0.5 text-xs font-semibold leading-snug text-zinc-950 sm:mt-1 sm:text-sm">{attr.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {listing.lat && listing.lng && (
            <div className="mt-4 sm:mt-6">
              <h2 className="mb-2 text-sm font-semibold text-zinc-950 sm:mb-3 sm:text-base">
                Расположение{listing.location ? " — " + listing.location : listing.city ? " — " + listing.city : ""}
              </h2>
              <YandexMap lat={listing.lat} lng={listing.lng} className="h-44 w-full rounded-xl sm:h-56 sm:rounded-2xl" />
            </div>
          )}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-3">
            <div className="rounded-2xl border border-white/80 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
          <div className="flex items-start justify-between gap-2">
            <div>
              {listing.city && <p className="flex items-center gap-1.5 text-sm font-medium text-zinc-500"><MapPin className="h-4 w-4" />{listing.city}</p>}
              <p className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">{formatPrice(listing.price)}</p>
              {listing.price > 0 && (
                <div className="mt-2">
                  <ListingPriceInsightBadge
                    insight={listing.priceInsight}
                    buyerHint={listing.buyerPriceHint}
                  />
                </div>
              )}
              {favoriteCount > 0 && <p className="mt-1 text-sm text-zinc-400">{favoriteCount.toLocaleString("ru-RU")} добавили в избранное</p>}
            </div>
          </div>

          {listing.seller && (
            <div className="mt-5 rounded-2xl bg-zinc-50 p-4">
              <Link href={sellerHref ?? "/"} className="flex items-center gap-3 hover:opacity-80">
                {listing.seller.avatar ? (
                  <img src={listing.seller.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--nashlo-orange))] text-sm font-semibold text-white">
                    {(listing.seller.name ?? "П")[0]}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-zinc-950">{listing.seller.name ?? "Продавец"}</p>
                  {listing.seller.profileHeadline ? (
                    <p className="text-xs font-medium text-zinc-600">{listing.seller.profileHeadline}</p>
                  ) : null}
                  {listing.seller.locationLabel ? (
                    <p className="text-xs text-zinc-500">{listing.seller.locationLabel}</p>
                  ) : null}
                  {listing.seller.badges && listing.seller.badges.length > 0 && (
                    <div className="mt-2">
                      <UserBadges badges={listing.seller.badges} max={4} variant="chips" />
                    </div>
                  )}
                  {(listing.seller.rating ?? 0) > 0 && (
                    <p className="mt-0.5 text-sm text-zinc-500">★ {listing.seller.rating!.toFixed(1)} · {listing.seller.reviewCount} отз.</p>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
                    {listing.seller.isVerified && <span className="inline-flex items-center gap-1 text-emerald-600"><BadgeCheck className="h-3.5 w-3.5" />Проверен</span>}
                    {sellerSince && <span>На Нашло с {sellerSince}</span>}
                  </div>
                </div>
              </Link>
            </div>
          )}

          {isOwn ? (
            <div className="mt-4 grid gap-2">
              <Link href={"/my-listings/" + listing.id + "/edit"}
                className="flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 py-3.5 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-50">
                Редактировать
              </Link>
              {listing.status === "ACTIVE" && (
                <button onClick={markAsSold} disabled={markingSold}
                  className="flex items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-5 py-3.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50">
                  {markingSold ? "Обновляем..." : "Отметить как продано"}
                </button>
              )}
              {listing.status === "SOLD" && (
                <div className="flex items-center justify-center rounded-xl bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700">
                  &#10003; Продано
                </div>
              )}
              <ListingShareButtons
                listingId={listing.id}
                title={listing.title}
                shareUrl={pageUrl}
                isOwner
                className="mt-1"
              />
            </div>
          ) : (
            <div className="mt-4 grid gap-2">
              <button onClick={openWrite}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[hsl(var(--nashlo-orange))] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[hsl(var(--nashlo-orange)/0.92)]">
                <MessageCircle className="h-4 w-4" />
                Написать продавцу
              </button>
              {phoneAvailable && (
                <button onClick={openCall}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-4 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-50">
                  <Phone className="h-4 w-4" />
                  Позвонить продавцу
                </button>
              )}
              <button onClick={toggleFav}
                className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50">
                <Heart className="h-4 w-4" fill={isFav ? "currentColor" : "none"} />
                {isFav ? "В избранном" : "В избранное"}
              </button>
              <ListingShareButtons
                listingId={listing.id}
                title={listing.title}
                shareUrl={pageUrl}
                isOwner={me?.id === listing.seller?.id}
              />
              {me && !reviewSent && (
                <button onClick={() => setReviewOpen(true)}
                  className="rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50">
                  Оставить отзыв
                </button>
              )}
              {reviewSent && <p className="text-center text-sm text-emerald-600">Отзыв отправлен &#10003;</p>}
              <button onClick={() => setReportOpen(true)}
                className="flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-medium text-zinc-400 transition hover:text-zinc-600">
                <Flag className="h-3.5 w-3.5" />
                Пожаловаться
              </button>
              <p className="flex items-start gap-2 rounded-xl bg-orange-50/70 px-3 py-2.5 text-[11px] leading-relaxed text-orange-950">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(var(--nashlo-orange))]" />
                Проверяйте информацию перед сделкой. Nashlo не является стороной сделки между пользователями.
              </p>
            </div>
          )}
            </div>
            <AdSlot slot="listingSidebar" />
          </div>
        </aside>
      </div>

      {sellerListings.length > 0 && sellerHref && (
        <section className="mt-8 sm:mt-12">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-950 sm:text-2xl">
              Другие объявления продавца
            </h2>
            <Link
              href={sellerHref}
              className="text-sm font-semibold text-zinc-500 hover:text-zinc-950"
            >
              Все объявления &#8594;
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-2 items-stretch gap-3 md:gap-4 lg:grid-cols-3 2xl:grid-cols-4">
            {sellerListings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </section>
      )}

      {similar.length > 0 && (
        <section className="mt-8 sm:mt-12">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-950 sm:text-2xl">Похожие объявления</h2>
            <Link href={`/search?category=${slug}`}
              className="text-sm font-semibold text-zinc-500 hover:text-zinc-950">
              Все в категории &#8594;
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-2 items-stretch gap-3 md:gap-4 lg:grid-cols-3 2xl:grid-cols-4">
            {similar.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        </section>
      )}
    </main>
    </>
  )
}
