"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { formatPrice, imageToneForCategory } from "@/lib/listing-types"

type User = {
  id: string
  phone: string | null
  email?: string | null
  name: string | null
  avatar: string | null
  description: string | null
  city: string | null
  rating: number
  reviewCount: number
  isVerified: boolean
  createdAt: string
  authProviders?: { phone: boolean; vk: boolean; yandex: boolean }
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

const listingOpenStorageKey = "nashlo-profile-listing-opens"

function statNumber(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value)
}

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

function providerLabel(key: "phone" | "vk" | "yandex") {
  if (key === "phone") return "Телефон"
  if (key === "vk") return "VK"
  return "Яндекс"
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<"active" | "archive">("active")
  const [listingOpens, setListingOpens] = useState<Record<string, number>>({})

  async function load() {
    setError(false)
    setLoading(true)
    try {
      const me = await fetch("/api/auth/me")
      if (me.status === 401) {
        router.push("/login?from=/profile")
        return
      }
      if (!me.ok) {
        setError(true)
        setLoading(false)
        return
      }
      const data = await me.json()
      setUser(data.user)

      const listingRes = await fetch("/api/my-listings")
      if (listingRes.ok) {
        const listingData = await listingRes.json()
        setListings(listingData.listings ?? [])
      }
      setListingOpens(readListingOpens())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stats = useMemo(() => {
    const views = listings.reduce((sum, item) => sum + (item.views || 0), 0)
    const favorites = listings.reduce((sum, item) => sum + (item._count?.favorites || 0), 0)
    const active = listings.filter((item) => item.status === "ACTIVE").length
    const moderation = listings.filter((item) => item.status === "MODERATION").length
    const archived = listings.filter((item) => ["ARCHIVED", "SOLD", "REJECTED"].includes(item.status)).length
    return { views, favorites, active, moderation, archived, total: listings.length }
  }, [listings])

  const totalOpens = useMemo(
    () => listings.reduce((sum, item) => sum + (listingOpens[item.id] || 0), 0),
    [listingOpens, listings],
  )

  const visibleListings = useMemo(() => {
    const filtered = activeTab === "active"
      ? listings.filter((item) => item.status === "ACTIVE" || item.status === "MODERATION")
      : listings.filter((item) => item.status === "ARCHIVED" || item.status === "SOLD" || item.status === "REJECTED")
    return filtered.slice(0, 6)
  }, [activeTab, listings])

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-5xl items-center px-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950" />
      </main>
    )
  }

  if (error) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-5xl flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-3xl">!</div>
        <div>
          <p className="text-lg font-bold text-zinc-950">Не удалось загрузить данные</p>
          <p className="mt-1 text-sm text-zinc-500">Проверьте соединение и попробуйте снова</p>
        </div>
        <button
          onClick={() => load()}
          className="rounded-2xl bg-[hsl(var(--nashlo-orange))] px-6 py-3 text-sm font-semibold text-white"
        >
          Повторить
        </button>
      </main>
    )
  }

  if (!user) return null

  const initials = (user.name || "П")[0].toUpperCase()
  const joined = new Date(user.createdAt).toLocaleDateString("ru-RU", { month: "long", year: "numeric" })
  const publicPath = `/profile/${user.id}`
  const profileFilled = [user.name, user.city, user.description, user.avatar].filter(Boolean).length
  const profileProgress = Math.round((profileFilled / 4) * 100)
  const authProviders = user.authProviders ?? {
    phone: Boolean(user.phone),
    vk: false,
    yandex: false,
  }

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

  function Avatar({ size = "h-20 w-20" }: { size?: string }) {
    if (user?.avatar) {
      return <img src={user.avatar} alt="" className={`${size} rounded-full object-cover`} />
    }
    return (
      <div className={`${size} flex items-center justify-center rounded-full bg-zinc-950 text-2xl font-semibold text-white`}>
        {initials}
      </div>
    )
  }

  function ListingRow({ listing }: { listing: Listing }) {
    const tone = imageToneForCategory(listing.category.slug)
    const thumb = listing.images?.[0]
    const views = listing.views || 0
    const favorites = listing._count?.favorites || 0
    const opens = listingOpens[listing.id] || 0

    return (
      <article className="flex min-w-0 gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
        <Link
          href={`/listings/${listing.id}`}
          onClick={() => trackListingOpen(listing.id)}
          className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br ${tone} sm:h-24 sm:w-24`}
        >
          {thumb ? (
            <img src={thumb} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-zinc-400">Фото</div>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusColor[listing.status] ?? "bg-zinc-100 text-zinc-500"}`}>
              {statusLabel[listing.status] || listing.status}
            </span>
            <span className="text-xs text-zinc-400">{new Date(listing.createdAt).toLocaleDateString("ru-RU")}</span>
          </div>
          <Link
            href={`/listings/${listing.id}`}
            onClick={() => trackListingOpen(listing.id)}
            className="mt-1.5 block truncate text-sm font-bold text-zinc-950 hover:underline"
          >
            {listing.title}
          </Link>
          <p className="text-base font-bold text-zinc-950">{formatPrice(listing.price)}</p>
          <div className="mt-2 flex items-center gap-3 text-xs text-zinc-400">
            <span>👁 {statNumber(views)}</span>
            <span>♡ {statNumber(favorites)}</span>
            <span>↗ {statNumber(opens)}</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-1.5">
          <Link
            href={`/my-listings/${listing.id}/edit`}
            className="rounded-xl bg-zinc-100 px-3 py-2 text-center text-xs font-semibold text-zinc-950 hover:bg-zinc-200"
          >
            Управлять
          </Link>
          <Link
            href={`/listings/${listing.id}`}
            className="flex items-center justify-center rounded-xl bg-zinc-50 px-3 py-2 text-sm font-bold text-zinc-500 hover:bg-zinc-100"
          >
            ›
          </Link>
        </div>
      </article>
    )
  }

  return (
    <main className="pb-28 lg:pb-10">
      <div className="mx-auto min-w-0 max-w-5xl px-4 py-4 lg:py-8">

        {/* ── MOBILE profile card (compact, horizontal) ── */}
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm lg:hidden">
          <div className="relative shrink-0">
            <Avatar size="h-14 w-14" />
            <Link
              href="/profile/settings"
              className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[hsl(var(--nashlo-orange))] text-xs font-bold text-white"
            >
              +
            </Link>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold text-zinc-950">{user.name || "Заполните профиль"}</p>
            <p className="text-xs text-zinc-500">{user.city || user.description || "Частное лицо"}</p>
            <p className="mt-0.5 text-[11px] text-zinc-400">На Нашло с {joined}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1 text-right">
            <p className="text-lg font-bold text-zinc-950">{(user.rating || 0).toFixed(1)}</p>
            <p className="text-[11px] text-zinc-400">{user.reviewCount || 0} отзывов</p>
          </div>
        </div>

        {/* ── MOBILE quick actions ── */}
        <div className="mb-4 grid grid-cols-2 gap-2 lg:hidden">
          <Link href="/create" className="flex items-center justify-center gap-2 rounded-xl bg-[hsl(var(--nashlo-orange))] py-3 text-sm font-semibold text-white shadow-sm">
            <span>+</span> Разместить
          </Link>
          <Link href="/my-listings" className="flex items-center justify-center rounded-xl border border-zinc-200 bg-white py-3 text-sm font-semibold text-zinc-700">
            Мои объявления
          </Link>
        </div>

        {/* ── DESKTOP grid ── */}
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">

          {/* ── Sidebar (desktop only) ── */}
          <aside className="hidden lg:block lg:sticky lg:top-24 lg:h-fit lg:space-y-4">
            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <Avatar size="h-20 w-20" />
                  <Link
                    href="/profile/settings"
                    className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[hsl(var(--nashlo-orange))] text-sm font-bold text-white"
                    aria-label="Редактировать профиль"
                  >
                    +
                  </Link>
                </div>
                <h1 className="mt-3 truncate text-lg font-bold text-zinc-950">
                  {user.name || "Заполните профиль"}
                </h1>
                <p className="text-sm text-zinc-500">{user.description || "Частное лицо"}</p>
                <p className="mt-1 text-xs text-zinc-400">На Нашло с {joined}</p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-zinc-50 p-3 text-center">
                  <p className="text-xl font-bold text-zinc-950">{(user.rating || 0).toFixed(1)}</p>
                  <p className="text-xs text-zinc-500">рейтинг</p>
                </div>
                <div className="rounded-xl bg-zinc-50 p-3 text-center">
                  <p className="text-xl font-bold text-zinc-950">{user.reviewCount || 0}</p>
                  <p className="text-xs text-zinc-500">отзывов</p>
                </div>
              </div>

              {profileProgress < 100 && (
                <div className="mt-3 rounded-xl bg-zinc-50 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-zinc-700">Профиль заполнен</p>
                    <p className="text-xs font-bold text-[hsl(var(--nashlo-orange))]">{profileProgress}%</p>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full bg-[hsl(var(--nashlo-orange))]" style={{ width: `${profileProgress}%` }} />
                  </div>
                  <Link href="/profile/settings" className="mt-2 inline-flex text-xs font-semibold text-[hsl(var(--nashlo-orange))]">
                    Дополнить данные →
                  </Link>
                </div>
              )}

              <div className="mt-3 space-y-2">
                <Link href={publicPath} className="flex items-center justify-center rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white">
                  Открыть публичный профиль
                </Link>
                <button onClick={copyPublicLink} className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
                  {copied ? "✓ Скопировано" : "Скопировать ссылку"}
                </button>
              </div>
            </section>

            <nav className="rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm">
              {[
                { label: "Мои объявления", href: "/my-listings", icon: "☰" },
                { label: "Сообщения", href: "/chat", icon: "◌" },
                { label: "Избранное", href: "/favorites", icon: "♡" },
                { label: "Настройки", href: "/profile/settings", icon: "⚙" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950"
                >
                  <span className="w-5 text-center text-base text-zinc-400">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Способы входа</p>
              <div className="mt-3 space-y-1.5">
                {(["phone", "vk", "yandex"] as const).map((key) => {
                  const active = authProviders[key]
                  return (
                    <div key={key} className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2">
                      <span className="text-sm font-medium text-zinc-800">{providerLabel(key)}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${active ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-400"}`}>
                        {active ? "Подключен" : "Нет"}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </aside>

          {/* ── Main content ── */}
          <section className="min-w-0">
            {/* Header */}
            <div className="hidden items-center justify-between gap-4 lg:flex">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-zinc-950">Личный кабинет</h2>
                <p className="mt-1 text-sm text-zinc-500">Здравствуйте, {user.name || "Пользователь"}!</p>
              </div>
              <Link href="/create" className="rounded-xl bg-[hsl(var(--nashlo-orange))] px-4 py-2.5 text-sm font-semibold text-white shadow-sm">
                + Разместить объявление
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: "Объявлений", value: stats.total },
                { label: "Активных", value: stats.active },
                { label: "Просмотры", value: statNumber(stats.views) },
                { label: "В избранном", value: statNumber(stats.favorites) },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                  <p className="text-xs text-zinc-500">{item.label}</p>
                  <p className="mt-1 text-2xl font-bold text-zinc-950">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Quick links */}
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Link href="/my-listings" className="rounded-2xl bg-zinc-950 p-4 text-white">
                <p className="text-sm font-bold">Все объявления</p>
                <p className="mt-1 text-xs text-white/60">Управление, архив</p>
              </Link>
              <Link href="/chat" className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-bold text-zinc-950">Сообщения</p>
                <p className="mt-1 text-xs text-zinc-500">Чаты с покупателями</p>
              </Link>
              <Link href="/favorites" className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:block hidden">
                <p className="text-sm font-bold text-zinc-950">Избранное</p>
                <p className="mt-1 text-xs text-zinc-500">Сохранённые товары</p>
              </Link>
            </div>

            {/* Listings tabs */}
            <div className="mt-6 flex items-center gap-4 border-b border-zinc-200 pb-0">
              <button
                onClick={() => setActiveTab("active")}
                className={`border-b-2 pb-3 text-sm font-semibold transition ${activeTab === "active" ? "border-zinc-950 text-zinc-950" : "border-transparent text-zinc-400"}`}
              >
                Активные{stats.active + stats.moderation > 0 && (
                  <span className="ml-1.5 rounded-full bg-zinc-100 px-2 py-0.5 text-xs">{stats.active + stats.moderation}</span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("archive")}
                className={`border-b-2 pb-3 text-sm font-semibold transition ${activeTab === "archive" ? "border-zinc-950 text-zinc-950" : "border-transparent text-zinc-400"}`}
              >
                Архив{stats.archived > 0 && (
                  <span className="ml-1.5 rounded-full bg-zinc-100 px-2 py-0.5 text-xs">{stats.archived}</span>
                )}
              </button>
              <div className="ml-auto text-xs text-zinc-400">
                {totalOpens > 0 && `${statNumber(totalOpens)} переходов`}
              </div>
            </div>


            <div className="mt-3 space-y-2">
              {visibleListings.length ? (
                visibleListings.map((listing) => <ListingRow key={listing.id} listing={listing} />)
              ) : (
                <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
                  <p className="text-base font-bold text-zinc-950">
                    {activeTab === "active" ? "Активных объявлений пока нет" : "Архив пуст"}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {activeTab === "active"
                      ? "Создайте объявление, и оно появится здесь после проверки."
                      : "Снятые и проданные объявления будут здесь."}
                  </p>
                  {activeTab === "active" && (
                    <Link href="/create" className="mt-4 inline-flex rounded-xl bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white">
                      Создать объявление
                    </Link>
                  )}
                </div>
              )}
            </div>

            {visibleListings.length > 0 && (
              <div className="mt-4">
                <Link href="/my-listings" className="inline-flex rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
                  Все объявления
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
