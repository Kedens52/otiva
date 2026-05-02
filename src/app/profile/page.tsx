"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { formatPrice, imageToneForCategory } from "@/lib/listing-types"

type User = {
  id: string
  phone: string | null
  name: string | null
  avatar: string | null
  description: string | null
  city: string | null
  rating: number
  reviewCount: number
  isVerified: boolean
  createdAt: string
}

type Listing = {
  id: string
  title: string
  price: number
  city: string | null
  status: string
  createdAt: string
  images: string[]
  views: number
  category: { slug: string; nameRu: string }
  _count?: { favorites: number }
}

const statusLabel: Record<string, string> = {
  ACTIVE: "Активно",
  MODERATION: "На проверке",
  ARCHIVED: "Архив",
  SOLD: "Продано",
  REJECTED: "Отклонено",
}

const statusColor: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  MODERATION: "bg-amber-50 text-amber-700",
  ARCHIVED: "bg-zinc-100 text-zinc-500",
  SOLD: "bg-blue-50 text-blue-700",
  REJECTED: "bg-red-50 text-red-600",
}

function statNumber(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value)
}

const listingOpenStorageKey = "nashlo-profile-listing-opens"

function readListingOpens() {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(listingOpenStorageKey)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return typeof parsed === "object" && parsed ? (parsed as Record<string, number>) : {}
  } catch {
    return {}
  }
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser]           = useState<User | null>(null)
  const [listings, setListings]   = useState<Listing[]>([])
  const [loading, setLoading]     = useState(true)
  const [copied, setCopied]       = useState(false)
  const [listingOpens, setListingOpens] = useState<Record<string, number>>({})
  const [activeTab, setActiveTab] = useState<"active" | "archive">("active")

  useEffect(() => {
    async function load() {
      const me = await fetch("/api/auth/me")
      if (!me.ok) { router.push("/login?from=/profile"); return }
      const data = await me.json()
      setUser(data.user)
      const listingRes = await fetch("/api/my-listings")
      if (listingRes.ok) {
        const listingData = await listingRes.json()
        setListings(listingData.listings ?? [])
      }
      setListingOpens(readListingOpens())
      setLoading(false)
    }
    load().catch(() => router.push("/login?from=/profile"))
  }, [router])

  const stats = useMemo(() => {
    const views     = listings.reduce((sum, i) => sum + (i.views || 0), 0)
    const favorites = listings.reduce((sum, i) => sum + (i._count?.favorites || 0), 0)
    const active    = listings.filter((i) => i.status === "ACTIVE").length
    const archived  = listings.filter((i) => i.status === "ARCHIVED" || i.status === "SOLD").length
    return { views, favorites, active, archived }
  }, [listings])

  const totalOpens = useMemo(
    () => listings.reduce((sum, i) => sum + (listingOpens[i.id] || 0), 0),
    [listingOpens, listings]
  )

  const visibleListings = useMemo(() => {
    const filtered = activeTab === "active"
      ? listings.filter((i) => i.status === "ACTIVE" || i.status === "MODERATION")
      : listings.filter((i) => i.status === "ARCHIVED" || i.status === "SOLD" || i.status === "REJECTED")
    return filtered.slice(0, 5)
  }, [listings, activeTab])

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950" />
      </main>
    )
  }

  if (!user) return null

  const initials   = (user.name || "П")[0].toUpperCase()
  const joined     = new Date(user.createdAt).toLocaleDateString("ru-RU", { month: "long", year: "numeric" })
  const publicPath = `/profile/${user.id}`

  async function copyPublicLink() {
    const link = `${window.location.origin}${publicPath}`
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      window.prompt("Ссылка на профиль", link)
    }
  }

  function trackListingOpen(id: string) {
    setListingOpens((current) => {
      const next = { ...current, [id]: (current[id] || 0) + 1 }
      window.localStorage.setItem(listingOpenStorageKey, JSON.stringify(next))
      return next
    })
  }

  const avatarEl = (size: string) => user.avatar ? (
    <img src={user.avatar} alt="" className={`${size} object-cover`} />
  ) : (
    <div className={`${size} flex items-center justify-center font-semibold text-white`}>{initials}</div>
  )

  /* ─── shared listing card for mobile ─── */
  function MobileListingCard({ listing }: { listing: Listing }) {
    const tone  = imageToneForCategory(listing.category.slug)
    const thumb = listing.images?.[0]
    const views = listing.views || 0
    const favs  = listing._count?.favorites || 0
    const opens = listingOpens[listing.id] || 0
    const engagement = views > 0 ? Math.round(((favs + opens) / views) * 100) : 0
    return (
      <article className="overflow-hidden rounded-[24px] border border-zinc-200 bg-white">
        <div className="flex gap-3 p-3">
          <Link href={`/listings/${listing.id}`} onClick={() => trackListingOpen(listing.id)}
            className={`h-[72px] w-[72px] shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br ${tone}`}>
            {thumb
              ? <img src={thumb} alt="" className="h-full w-full object-cover" />
              : <div className="flex h-full w-full items-center justify-center text-2xl">&#128230;</div>}
          </Link>
          <div className="min-w-0 flex-1">
            <Link href={`/listings/${listing.id}`} onClick={() => trackListingOpen(listing.id)}
              className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-950">
              {listing.title}
            </Link>
            <p className="mt-0.5 text-base font-bold text-zinc-950">{formatPrice(listing.price)}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusColor[listing.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                {statusLabel[listing.status] ?? listing.status}
              </span>
              <span className="text-[11px] text-zinc-400">{listing.category.nameRu}</span>
            </div>
          </div>
          <Link href={`/my-listings/${listing.id}/edit`}
            className="flex h-8 w-8 shrink-0 items-center justify-center self-start rounded-xl bg-zinc-100 text-zinc-500">
            &#8943;
          </Link>
        </div>
        {/* Stats strip */}
        <div className="grid grid-cols-4 border-t border-zinc-100">
          {[
            { label: "Видят",      value: statNumber(views) },
            { label: "Избранное",  value: statNumber(favs) },
            { label: "Переходы",   value: statNumber(opens) },
            { label: "Интерес",    value: `${engagement}%` },
          ].map((s, i) => (
            <div key={i} className={`px-2 py-2 text-center ${i < 3 ? "border-r border-zinc-100" : ""}`}>
              <p className="text-sm font-bold text-zinc-950">{s.value}</p>
              <p className="text-[10px] text-zinc-400">{s.label}</p>
            </div>
          ))}
        </div>
      </article>
    )
  }

  return (
    <main className="pb-28 lg:pb-10">

      {/* ══════════ MOBILE ══════════ */}
      <div className="lg:hidden">

        {/* Profile header */}
        <div className="bg-white px-4 pb-4 pt-5">
          <div className="flex items-center gap-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[hsl(var(--nashlo-orange))]">
              {avatarEl("h-full w-full")}
              <Link href="/profile/settings"
                className="absolute bottom-0.5 right-0.5 flex h-6 w-6 items-center justify-center rounded-lg border-2 border-white bg-zinc-950 text-[10px] text-white">
                &#9998;
              </Link>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-bold text-zinc-950">{user.name || "Пользователь"}</h1>
              <p className="text-sm text-zinc-500">{user.description || "Частное лицо"}</p>
              <div className="mt-1 flex items-center gap-1 text-sm">
                <span className="font-semibold text-zinc-950">{(user.rating || 0).toFixed(1)}</span>
                <span className="text-[11px] text-[hsl(var(--nashlo-orange))]">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
                <Link href="#reviews" className="text-xs text-[hsl(var(--nashlo-blue))]">{user.reviewCount || 0} отзыв</Link>
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link href={publicPath}
              className="flex items-center justify-center rounded-2xl bg-zinc-950 py-2.5 text-sm font-semibold text-white">
              Публичная страница
            </Link>
            <button onClick={copyPublicLink}
              className="rounded-2xl border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-700">
              {copied ? "Скопировано &#10003;" : "Скопировать ссылку"}
            </button>
          </div>

          {/* Quick links */}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5">
            {[
              { label: "Объявления", href: "/my-listings" },
              { label: "Избранное",  href: "/favorites" },
              { label: "Сообщения",  href: "/chat" },
              { label: "Настройки", href: "/profile/settings" },
              { label: "Реклама",    href: "/advertising" },
            ].map((item) => (
              <Link key={item.href} href={item.href}
                className="shrink-0 rounded-full border border-zinc-200 bg-zinc-50 px-3.5 py-1.5 text-xs font-medium text-zinc-700">
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Header + create button */}
        <div className="mx-4 mt-4 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-950">Мои объявления</h2>
            <p className="mt-0.5 text-xs text-zinc-400">Нашло с {joined}</p>
          </div>
          <Link href="/create"
            className="shrink-0 rounded-2xl bg-[hsl(var(--nashlo-orange))] px-4 py-2.5 text-sm font-semibold text-white shadow-sm">
            + Создать
          </Link>
        </div>

        {/* Promo cards */}
        <div className="mx-4 mt-3 grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 rounded-[20px] bg-zinc-100 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-xl text-[hsl(var(--nashlo-orange))]">&#8599;</div>
            <div>
              <p className="text-xs font-bold text-zinc-950 leading-tight">Продвигайте лучшее</p>
              <p className="mt-0.5 text-[10px] text-zinc-500 leading-tight">быстрый отклик</p>
            </div>
          </div>
          <Link href="/pricing" className="relative flex items-center gap-2 rounded-[20px] bg-zinc-100 p-3">
            <span className="absolute -top-1.5 right-4 rounded-full bg-[hsl(var(--nashlo-orange))] px-1.5 py-0.5 text-[9px] font-semibold text-white">Новое</span>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-xl text-emerald-600">&#10003;</div>
            <div>
              <p className="text-xs font-bold text-zinc-950 leading-tight">Проверенный профиль</p>
              <p className="mt-0.5 text-[10px] text-zinc-500 leading-tight">фото и описание</p>
            </div>
          </Link>
        </div>

        {/* Tabs */}
        <div className="mx-4 mt-4 flex rounded-2xl border border-zinc-200 bg-white p-1">
          <button onClick={() => setActiveTab("active")}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${activeTab === "active" ? "bg-zinc-950 text-white" : "text-zinc-500"}`}>
            Активные <span className={activeTab === "active" ? "text-white/60" : "text-zinc-400"}>{stats.active}</span>
          </button>
          <button onClick={() => setActiveTab("archive")}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${activeTab === "archive" ? "bg-zinc-950 text-white" : "text-zinc-500"}`}>
            Архив <span className={activeTab === "archive" ? "text-white/60" : "text-zinc-400"}>{stats.archived}</span>
          </button>
        </div>

        {/* Stats grid */}
        <div className="mx-4 mt-3 grid grid-cols-4 gap-2">
          {[
            { label: "Просмотры",  value: statNumber(stats.views) },
            { label: "Избранное",  value: statNumber(stats.favorites) },
            { label: "Переходы",   value: statNumber(totalOpens) },
            { label: "Активных",   value: stats.active },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-zinc-50 p-2.5 text-center">
              <p className="text-base font-bold text-zinc-950">{s.value}</p>
              <p className="mt-0.5 text-[10px] text-zinc-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Listings */}
        <div className="mx-4 mt-3 space-y-2.5 pb-4">
          {visibleListings.length === 0 ? (
            <div className="rounded-[24px] border border-zinc-200 bg-white p-8 text-center">
              <p className="text-3xl">&#128203;</p>
              <p className="mt-3 font-semibold text-zinc-950">
                {activeTab === "active" ? "Нет активных объявлений" : "Архив пуст"}
              </p>
              {activeTab === "active" && (
                <Link href="/create" className="mt-4 inline-flex rounded-2xl bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white">
                  Создать объявление
                </Link>
              )}
            </div>
          ) : (
            <>
              {visibleListings.map((l) => <MobileListingCard key={l.id} listing={l} />)}
              <Link href="/my-listings"
                className="flex w-full items-center justify-center rounded-2xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-700">
                Все объявления &#8594;
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ══════════ DESKTOP ══════════ */}
      <div className="mx-auto hidden max-w-7xl px-4 py-10 lg:block">
        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <div className="relative h-28 w-28 overflow-hidden rounded-[28px] bg-[hsl(var(--nashlo-orange))]">
              {avatarEl("h-full w-full")}
              <Link href="/profile/settings"
                className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-xl border-4 border-white bg-zinc-950 text-xs text-white">
                &#9998;
              </Link>
            </div>
            <div className="mt-4">
              <h1 className="text-2xl font-bold leading-tight text-zinc-950">{user.name || "Пользователь"}</h1>
              <p className="mt-1 text-sm font-semibold text-zinc-700">{user.description || "Частное лицо"}</p>
              <div className="mt-2 flex items-center gap-1.5 text-sm">
                <span className="font-semibold text-zinc-950">{(user.rating || 0).toFixed(1)}</span>
                <span className="text-[hsl(var(--nashlo-orange))]">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
                <Link href="#reviews" className="font-medium text-[hsl(var(--nashlo-blue))]">{user.reviewCount || 0} отзыв</Link>
              </div>
              <div className="mt-3 rounded-2xl bg-zinc-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">ID профиля</p>
                <p className="mt-1 break-all font-mono text-xs text-zinc-700">{user.id}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-2">
              <Link href={publicPath}
                className="flex items-center justify-center rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white">
                Публичная страница
              </Link>
              <button onClick={copyPublicLink}
                className="rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
                {copied ? "Ссылка скопирована" : "Скопировать ссылку"}
              </button>
            </div>
            <div className="mt-5">
              {[
                [
                  { label: "Мои объявления", href: "/my-listings", strong: true },
                  { label: "Избранное",       href: "/favorites" },
                  { label: "Сообщения",       href: "/chat" },
                ],
                [
                  { label: "Редактировать профиль", href: "/profile/settings" },
                  { label: "Реклама на сайте",       href: "/advertising" },
                ],
              ].map((group, gi) => (
                <div key={gi} className="border-t border-zinc-100 py-4 first:border-t-0 first:pt-0">
                  {group.map((item) => (
                    <Link key={item.label} href={item.href}
                      className={`mb-2 flex items-center gap-2 text-base transition hover:text-[hsl(var(--nashlo-orange))] ${"strong" in item && item.strong ? "font-bold text-zinc-950" : "font-medium text-[hsl(var(--nashlo-blue))]"}`}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </aside>

          <section className="min-w-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-4xl font-bold tracking-tight text-zinc-950">Мои объявления</h2>
                <p className="mt-2 text-sm text-zinc-500">Профиль на Нашло с {joined}</p>
              </div>
              <Link href="/create"
                className="w-fit rounded-2xl bg-[hsl(var(--nashlo-orange))] px-5 py-3 text-sm font-semibold text-white shadow-sm">
                Разместить объявление
              </Link>
            </div>

            {/* Promo cards */}
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <div className="flex items-center gap-4 rounded-[24px] bg-zinc-100 p-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-3xl text-[hsl(var(--nashlo-orange))]">&#8599;</div>
                <div>
                  <p className="text-xl font-bold text-zinc-950">Продвигайте лучшее</p>
                  <p className="text-sm text-zinc-600">поднимайте объявления, когда нужен быстрый отклик</p>
                </div>
              </div>
              <Link href="/pricing"
                className="relative flex items-center gap-4 rounded-[24px] bg-zinc-100 p-4 transition hover:bg-zinc-200">
                <span className="absolute -top-2 right-8 rounded-full bg-[hsl(var(--nashlo-orange))] px-2 py-1 text-xs font-semibold text-white">Новое</span>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-3xl text-emerald-600">&#10003;</div>
                <div>
                  <p className="text-xl font-bold text-zinc-950">Проверенный профиль</p>
                  <p className="text-sm text-zinc-600">добавьте город, описание и фото</p>
                </div>
              </Link>
            </div>

            {/* Tabs */}
            <div className="mt-7 flex border-b border-zinc-200">
              <button
                onClick={() => setActiveTab("active")}
                className={`-mb-px border-b-4 px-0 pb-3 pr-6 text-lg font-bold transition ${activeTab === "active" ? "border-zinc-950 text-zinc-950" : "border-transparent text-zinc-400 hover:text-zinc-600"}`}>
                Активные <span className={activeTab === "active" ? "text-zinc-400" : ""}>{stats.active}</span>
              </button>
              <button
                onClick={() => setActiveTab("archive")}
                className={`-mb-px border-b-4 px-0 pb-3 pr-6 text-lg font-bold transition ${activeTab === "archive" ? "border-zinc-950 text-zinc-950" : "border-transparent text-zinc-400 hover:text-zinc-600"}`}>
                Архив <span>{stats.archived}</span>
              </button>
            </div>

            {/* Stats */}
            <div className="mt-7 grid gap-3 sm:grid-cols-4">
              {[
                { label: "Просмотры", value: statNumber(stats.views) },
                { label: "Избранное", value: statNumber(stats.favorites) },
                { label: "Переходы",  value: statNumber(totalOpens) },
                { label: "Активные",  value: stats.active },
              ].map((s) => (
                <div key={s.label} className="rounded-3xl bg-zinc-50 p-4">
                  <p className="text-sm text-zinc-500">{s.label}</p>
                  <p className="mt-1 text-2xl font-bold text-zinc-950">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Listing articles */}
            <div className="mt-8">
              {visibleListings.length === 0 ? (
                <div className="rounded-[28px] border border-zinc-200 bg-white p-10 text-center shadow-sm">
                  <p className="text-4xl">&#128203;</p>
                  <p className="mt-4 text-xl font-bold text-zinc-950">
                    {activeTab === "active" ? "Объявлений пока нет" : "Архив пуст"}
                  </p>
                  {activeTab === "active" && (
                    <>
                      <p className="mt-2 text-sm text-zinc-500">Создайте первое объявление, и оно появится в кабинете.</p>
                      <Link href="/create"
                        className="mt-5 inline-flex rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white">
                        Создать объявление
                      </Link>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-5">
                  {visibleListings.map((listing) => {
                    const tone       = imageToneForCategory(listing.category.slug)
                    const thumb      = listing.images?.[0]
                    const views      = listing.views || 0
                    const favorites  = listing._count?.favorites || 0
                    const opens      = listingOpens[listing.id] || 0
                    const engagement = views > 0 ? Math.round(((favorites + opens) / views) * 100) : 0
                    return (
                      <article key={listing.id} className="grid gap-4 rounded-[28px] bg-white py-3 md:grid-cols-[180px_minmax(0,1fr)_280px]">
                        <Link href={`/listings/${listing.id}`} onClick={() => trackListingOpen(listing.id)}
                          className={`h-32 overflow-hidden rounded-2xl bg-gradient-to-br ${tone}`}>
                          {thumb
                            ? <img src={thumb} alt="" className="h-full w-full object-cover" />
                            : <div className="flex h-full w-full items-center justify-center text-4xl">&#128230;</div>}
                        </Link>
                        <div className="min-w-0">
                          <Link href={`/listings/${listing.id}`} onClick={() => trackListingOpen(listing.id)}
                            className="text-xl font-bold leading-tight text-zinc-950 hover:underline">
                            {listing.title}
                          </Link>
                          <p className="mt-1 text-xl font-medium text-zinc-950">{formatPrice(listing.price)}</p>
                          <p className="mt-2 text-sm text-zinc-500">{listing.city || "Город не указан"}</p>
                          <p className="mt-1 text-sm text-zinc-400">&#9679; {listing.category.nameRu}</p>
                          <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusColor[listing.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                            {statusLabel[listing.status] || listing.status}
                          </span>
                        </div>
                        <div>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { label: "Видят",      value: statNumber(views) },
                              { label: "Избранное",  value: statNumber(favorites) },
                              { label: "Переходы",   value: statNumber(opens) },
                            ].map((s) => (
                              <div key={s.label} className="rounded-2xl bg-zinc-50 p-3">
                                <p className="text-[11px] font-medium text-zinc-400">{s.label}</p>
                                <p className="mt-1 text-lg font-bold text-zinc-950">{s.value}</p>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 rounded-2xl bg-orange-50 px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-semibold text-zinc-950">Интерес</span>
                              <span className="font-bold text-[hsl(var(--nashlo-orange))]">{engagement}%</span>
                            </div>
                            <p className="mt-1 text-xs leading-5 text-zinc-500">Избранное и переходы относительно просмотров.</p>
                          </div>
                          <div className="mt-4 grid gap-2">
                            <button className="rounded-2xl bg-zinc-100 px-4 py-3 font-semibold text-zinc-950">Поднять просмотры</button>
                            <div className="grid grid-cols-[1fr_48px] gap-2">
                              <button className="rounded-2xl bg-zinc-100 px-4 py-3 font-semibold text-zinc-950">Рассылка</button>
                              <Link href={`/my-listings/${listing.id}/edit`}
                                className="flex items-center justify-center rounded-2xl bg-zinc-100 font-bold text-zinc-950">&#8943;</Link>
                            </div>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="mt-8">
              <Link href="/my-listings"
                className="inline-flex rounded-2xl border border-zinc-200 px-5 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
                Открыть все объявления
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
