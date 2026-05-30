"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  ArrowRight, BadgeCheck, Camera, CheckCircle2,
  ShieldCheck, TrendingUp,
} from "lucide-react"
import { AdSlot } from "@/components/marketplace/AdSlot"
import { MixedFeedGrid } from "@/components/ads/MixedFeedGrid"
import { ListingsCategoryGrid } from "@/components/feed/ListingsCategoryGrid"
import { PAGE_CONTAINER_WIDE_CLASS } from "@/components/layout/PageContainer"
import {
  getStoredCity,
  isCityFilterActive,
  NASHLO_CITY_CHANGE_EVENT,
  NASHLO_DEFAULT_CITY,
} from "@/lib/city-selection"
import { useFeedAds } from "@/hooks/useFeedAds"
import type { AdPlacement } from "@prisma/client"
import type { AppListing } from "@/lib/listing-types"
import { rankListingsForUser } from "@/lib/recommendations"
import {
  buildHomeLatestParams,
  buildHomeRecommendationsParams,
  buildHomeSectionSearchHref,
} from "@/lib/listings/home-feed-params"
import { LISTING_GRID_CLASS } from "@/lib/listings/listing-grid"
const safetyTips = [
  "Проверяйте товар перед оплатой",
  "Не переводите предоплату незнакомым",
  "Встречайтесь в безопасных местах",
]

const sellerTips = [
  "Добавьте 3–5 качественных фото",
  "Подробно опишите состояние",
  "Отвечайте на сообщения быстро",
]

function PlaceholderCard({ idx }: { idx: number }) {
  const titleW = ["w-3/4", "w-2/3", "w-4/5", "w-3/5"][idx % 4]
  const priceW = ["w-2/5", "w-1/3", "w-1/4", "w-2/5"][idx % 4]
  const locationW = ["w-1/2", "w-2/5", "w-1/3", "w-3/5"][idx % 4]
  return (
    <div className="overflow-hidden rounded-[14px] border border-zinc-200 bg-white opacity-40 select-none pointer-events-none">
      <div className="aspect-[4/3] bg-zinc-100" />
      <div className="space-y-1.5 p-3">
        <div className={`h-4 ${priceW} rounded-full bg-zinc-300`} />
        <div className={`h-3 ${titleW} rounded-full bg-zinc-200`} />
        <div className={`h-3 ${locationW} rounded-full bg-zinc-100`} />
      </div>
    </div>
  )
}

function ListingSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-[14px] border border-zinc-200 bg-white">
          <div className="aspect-[4/3] animate-pulse bg-zinc-100" />
          <div className="space-y-2 p-3">
            <div className="h-4 w-16 animate-pulse rounded-full bg-zinc-200" />
            <div className="h-3 w-full animate-pulse rounded-full bg-zinc-100" />
            <div className="h-3 w-3/4 animate-pulse rounded-full bg-zinc-100" />
          </div>
        </div>
      ))}
    </>
  )
}

export function FeedPage() {
  const [selectedCity, setSelectedCity] = useState(NASHLO_DEFAULT_CITY)
  const [recommended, setRecommended] = useState<AppListing[]>([])
  const [latest, setLatest] = useState<AppListing[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)

  useEffect(() => {
    setSelectedCity(getStoredCity())
    const onCityChange = () => setSelectedCity(getStoredCity())
    window.addEventListener(NASHLO_CITY_CHANGE_EVENT, onCityChange)
    return () => window.removeEventListener(NASHLO_CITY_CHANGE_EVENT, onCityChange)
  }, [])

  useEffect(() => {
    async function load() {
      setFetchError(false)
      setLoading(true)
      try {
        const recSp = buildHomeRecommendationsParams(selectedCity)
        const latestSp = buildHomeLatestParams(selectedCity)

        const [recRes, latestRes] = await Promise.all([
          fetch(`/api/listings?${recSp.toString()}`),
          fetch(`/api/listings?${latestSp.toString()}`),
        ])
        if (!recRes.ok || !latestRes.ok) throw new Error("listings failed")

        const recPool: AppListing[] = (await recRes.json()).items ?? []
        const recItems = rankListingsForUser(recPool, {
          preferredCity: isCityFilterActive(selectedCity) ? selectedCity : undefined,
        }).slice(0, 8)
        const recIds = new Set(recItems.map((i) => i.id))
        const latestItems: AppListing[] = ((await latestRes.json()).items ?? []).filter(
          (i: AppListing) => !recIds.has(i.id),
        )

        setRecommended(recItems)
        setLatest(latestItems.slice(0, 12))
      } catch {
        setRecommended([])
        setLatest([])
        setFetchError(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [selectedCity])

  const cityId = isCityFilterActive(selectedCity) ? selectedCity : undefined

  const recPlacement: AdPlacement = "HOME_RECOMMENDATIONS"
  const latestPlacement: AdPlacement = "MOBILE_FEED_INLINE"

  const { items: recommendedFeed, sessionId: recSession } = useFeedAds({
    listings: recommended,
    placement: recPlacement,
    enabled: !loading && recommended.length > 0,
    cityId,
  })

  const { items: latestFeed, sessionId: latestSession } = useFeedAds({
    listings: latest,
    placement: latestPlacement,
    enabled: !loading && latest.length > 0,
    cityId,
  })

  const hasListings = latest.length > 0 || recommended.length > 0
  const showPlaceholders = !loading && !hasListings && !fetchError
  const listingGrid = LISTING_GRID_CLASS
  const sideCard = "nashlo-surface p-4"
  const recommendationsHref = buildHomeSectionSearchHref(
    "default",
    selectedCity,
  )
  const latestHref = buildHomeSectionSearchHref("newest", selectedCity)

  return (
    <main className="min-h-screen bg-white lg:bg-[#F5F6F7]">
      <div className={`${PAGE_CONTAINER_WIDE_CLASS} py-4 lg:py-5`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-5">
          <div className="min-w-0 flex-1 space-y-4">
            <ListingsCategoryGrid />

            {/* Реклама: отдельные баннеры для мобильной и десктопной версии */}
            <div className="lg:hidden">
              <AdSlot slot="mobileLeaderboard" />
            </div>
            <div className="hidden lg:block">
              <AdSlot slot="leaderboard" />
            </div>

            {fetchError && (
              <div
                role="alert"
                className="rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
              >
                <p className="font-medium">Не удалось загрузить объявления</p>
                <p className="mt-1 text-amber-900/80">
                  Проверьте подключение или обновите страницу. Если ошибка повторяется —
                  возможна проблема с сервером или базой данных.
                </p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-2 text-sm font-semibold text-[#FF4F12] hover:underline underline-offset-2"
                >
                  Обновить
                </button>
              </div>
            )}

            {/* Рекомендации для вас */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[17px] font-semibold text-[#111827]">Рекомендации для вас</h2>
                <Link
                  href={recommendationsHref}
                  className="text-sm font-medium text-[#FF4F12] hover:underline underline-offset-2"
                >
                  Смотреть все
                </Link>
              </div>
              {isCityFilterActive(selectedCity) ? (
                <p className="mb-2 text-xs text-zinc-500">
                  Подборка с учётом города {selectedCity} и ваших интересов на сайте
                </p>
              ) : null}
              <div className={listingGrid}>
                {loading ? (
                  <ListingSkeletonGrid count={4} />
                ) : recommended.length > 0 ? (
                  <MixedFeedGrid
                    items={recommendedFeed}
                    placement={recPlacement}
                    compact
                    sessionId={recSession}
                    cityId={cityId}
                  />
                ) : showPlaceholders ? (
                  Array.from({ length: 4 }).map((_, i) => <PlaceholderCard key={i} idx={i} />)
                ) : (
                  <p className="col-span-2 text-sm text-zinc-500 lg:col-span-3">
                    Пока нет объявлений — станьте первым.
                  </p>
                )}
              </div>
            </section>

            {/* Свежие объявления */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[17px] font-semibold text-[#111827]">Свежие объявления</h2>
                <Link
                  href={latestHref}
                  className="text-sm font-medium text-[#FF4F12] hover:underline underline-offset-2"
                >
                  Смотреть все
                </Link>
              </div>
              <div className={listingGrid}>
                {loading ? (
                  <ListingSkeletonGrid count={8} />
                ) : showPlaceholders ? (
                  Array.from({ length: 8 }).map((_, i) => <PlaceholderCard key={i} idx={i} />)
                ) : latest.length > 0 ? (
                  <MixedFeedGrid
                    items={latestFeed}
                    placement={latestPlacement}
                    compact
                    sessionId={latestSession}
                    cityId={cityId}
                  />
                ) : !fetchError ? (
                  <p className="col-span-2 text-sm text-zinc-500 lg:col-span-3">
                    Новых объявлений пока нет.
                  </p>
                ) : null}
              </div>
            </section>
          </div>

          {/* Sidebar desktop */}
          <aside className="hidden w-[260px] shrink-0 space-y-3 lg:block">
            <AdSlot slot="sidebarTop" />
            <AdSlot slot="sidebarTall" />

            <div className={sideCard}>
              <div className="mb-2.5 flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 shrink-0 text-emerald-500" />
                <h3 className="text-sm font-semibold text-[#111827]">Доверие к продавцу</h3>
              </div>
              <p className="text-sm leading-relaxed text-[#6B7280]">
                Перед покупкой смотрите отзывы, подтверждение профиля и историю объявлений.
              </p>
            </div>

            <div className={sideCard}>
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-[#FFF3EC] text-[#FF4F12]">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-semibold text-[#111827]">Советы по безопасности</h3>
              </div>
              <ul className="space-y-2">
                {safetyTips.map((tip) => (
                  <li key={tip} className="flex gap-2 text-sm leading-5 text-[#6B7280]">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FF4F12]" />
                    {tip}
                  </li>
                ))}
              </ul>
              <Link
                href="/safety"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#FF4F12] hover:underline underline-offset-4"
              >
                Подробнее <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className={sideCard}>
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-[#FFF3EC] text-[#FF4F12]">
                  <TrendingUp className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-semibold text-[#111827]">Как продать быстрее</h3>
              </div>
              <ul className="space-y-2">
                {sellerTips.map((tip) => (
                  <li key={tip} className="flex gap-2 text-sm leading-5 text-[#6B7280]">
                    <Camera className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#9CA3AF]" />
                    {tip}
                  </li>
                ))}
              </ul>
              <Link
                href="/create"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#FF4F12] hover:underline underline-offset-4"
              >
                Разместить объявление <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
