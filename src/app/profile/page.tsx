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

type ProfileMenuItem = {
  label: string
  href: string
  strong?: boolean
}

const menuGroups: ProfileMenuItem[][] = [
  [
    { label: "Мои объявления", href: "/my-listings", strong: true },
    { label: "Избранное", href: "/favorites" },
    { label: "Сообщения", href: "/chat" },
    { label: "Отзывы", href: "/profile#reviews" },
  ],
  [
    { label: "Редактировать профиль", href: "/profile/settings" },
    { label: "Безопасность", href: "/profile/settings" },
    { label: "Реклама на сайте", href: "/advertising" },
  ],
]

const statusLabel: Record<string, string> = {
  ACTIVE: "Активно",
  MODERATION: "На проверке",
  ARCHIVED: "Архив",
  SOLD: "Продано",
  REJECTED: "Отклонено",
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
  const [user, setUser] = useState<User | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [listingOpens, setListingOpens] = useState<Record<string, number>>({})

  useEffect(() => {
    async function load() {
      const me = await fetch("/api/auth/me")
      if (!me.ok) {
        router.push("/login?from=/profile")
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
      setLoading(false)
    }

    load().catch(() => {
      router.push("/login?from=/profile")
    })
  }, [router])

  const stats = useMemo(() => {
    const views = listings.reduce((sum, item) => sum + (item.views || 0), 0)
    const favorites = listings.reduce((sum, item) => sum + (item._count?.favorites || 0), 0)
    const active = listings.filter((item) => item.status === "ACTIVE").length
    const archived = listings.filter((item) => item.status === "ARCHIVED" || item.status === "SOLD").length

    return { views, favorites, active, archived }
  }, [listings])

  const totalOpens = useMemo(() => {
    return listings.reduce((sum, item) => sum + (listingOpens[item.id] || 0), 0)
  }, [listingOpens, listings])

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950" />
      </main>
    )
  }

  if (!user) return null

  const initials = (user.name || "П")[0].toUpperCase()
  const primaryListing = listings[0]
  const visibleListings = listings.slice(0, 3)
  const joined = new Date(user.createdAt).toLocaleDateString("ru-RU", { month: "long", year: "numeric" })
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

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 pb-28 lg:py-10">
      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <section className="rounded-[32px] border border-zinc-200 bg-white p-5 shadow-sm lg:border-0 lg:p-0 lg:shadow-none">
            <div className="flex items-center gap-4 lg:block">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[28px] bg-[hsl(var(--nashlo-orange))] lg:h-28 lg:w-28">
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-5xl font-semibold text-white">{initials}</div>
                )}
                <Link href="/profile/settings" className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-xl border-4 border-white bg-zinc-950 text-xs text-white">
                  ✎
                </Link>
              </div>
              <div className="min-w-0 lg:mt-4">
                <h1 className="truncate text-2xl font-bold leading-tight text-zinc-950">{user.name || "Пользователь"}</h1>
                <p className="mt-1 text-sm font-semibold text-zinc-700">{user.description || "Частное лицо"}</p>
                <div className="mt-2 flex items-center gap-1.5 text-sm">
                  <span className="font-semibold text-zinc-950">{(user.rating || 0).toFixed(1)}</span>
                  <span className="text-[hsl(var(--nashlo-orange))]">★★★★★</span>
                  <Link href="#reviews" className="font-medium text-[hsl(var(--nashlo-blue))]">{user.reviewCount || 0} отзыв</Link>
                </div>
                <div className="mt-3 rounded-2xl bg-zinc-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">ID профиля</p>
                  <p className="mt-1 break-all font-mono text-xs text-zinc-700">{user.id}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              <Link href={publicPath} className="flex items-center justify-center rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white">
                Публичная страница
              </Link>
              <button onClick={copyPublicLink} className="rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
                {copied ? "Ссылка скопирована" : "Скопировать ссылку"}
              </button>
            </div>

            <div className="mt-5 hidden lg:block">
              {menuGroups.map((group, index) => (
                <div key={index} className="border-t border-zinc-100 py-4 first:border-t-0 first:pt-0">
                  <div className="grid gap-2">
                    {group.map((item) => (
                      <Link key={item.label} href={item.href} className={`flex items-center gap-2 text-base transition hover:text-[hsl(var(--nashlo-orange))] ${"strong" in item && item.strong ? "font-bold text-zinc-950" : "font-medium text-[hsl(var(--nashlo-blue))]"}`}>
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>

        <section className="min-w-0">
          <div className="mb-8 rounded-[32px] bg-zinc-950 p-5 text-white sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--nashlo-orange))]">Личный кабинет</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Управляйте продажами в одном месте</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">Публикуйте объявления, отвечайте покупателям, следите за интересом и держите профиль аккуратным.</p>
              </div>
              <Link href="/profile/settings" className="w-fit rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-zinc-950">
                Заполнить профиль
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-4xl font-bold tracking-tight text-zinc-950">Мои объявления</h2>
              <p className="mt-2 text-sm text-zinc-500">Профиль на Нашло с {joined}</p>
            </div>
            <Link href="/create" className="w-fit rounded-2xl bg-[hsl(var(--nashlo-orange))] px-5 py-3 text-sm font-semibold text-white shadow-sm">
              Разместить объявление
            </Link>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="flex items-center gap-4 rounded-[24px] bg-zinc-100 p-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-3xl text-[hsl(var(--nashlo-orange))]">↗</div>
              <div>
                <p className="text-xl font-bold text-zinc-950">Продвигайте лучшее</p>
                <p className="text-sm text-zinc-600">поднимайте объявления, когда нужен быстрый отклик</p>
              </div>
            </div>
            <Link href="/pricing" className="relative flex items-center gap-4 rounded-[24px] bg-zinc-100 p-4 transition hover:bg-zinc-200">
              <span className="absolute -top-2 right-8 rounded-full bg-[hsl(var(--nashlo-orange))] px-2 py-1 text-xs font-semibold text-white">Новое</span>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-3xl text-emerald-600">✓</div>
              <div>
                <p className="text-xl font-bold text-zinc-950">Проверенный профиль</p>
                <p className="text-sm text-zinc-600">добавьте город, описание и фото</p>
              </div>
            </Link>
          </div>

          <div className="mt-7 flex border-b border-zinc-200">
            <button className="-mb-px border-b-4 border-zinc-950 px-0 pb-3 pr-6 text-lg font-bold text-zinc-950">
              Активные <span className="text-zinc-400">{stats.active}</span>
            </button>
            <button className="-mb-px px-0 pb-3 pr-6 text-lg font-bold text-zinc-400">
              Архив <span>{stats.archived}</span>
            </button>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-4">
            <div className="rounded-3xl bg-zinc-50 p-4">
              <p className="text-sm text-zinc-500">Просмотры</p>
              <p className="mt-1 text-2xl font-bold text-zinc-950">{statNumber(stats.views)}</p>
            </div>
            <div className="rounded-3xl bg-zinc-50 p-4">
              <p className="text-sm text-zinc-500">Избранное</p>
              <p className="mt-1 text-2xl font-bold text-zinc-950">{statNumber(stats.favorites)}</p>
            </div>
            <div className="rounded-3xl bg-zinc-50 p-4">
              <p className="text-sm text-zinc-500">Переходы</p>
              <p className="mt-1 text-2xl font-bold text-zinc-950">{statNumber(totalOpens)}</p>
            </div>
            <div className="rounded-3xl bg-zinc-50 p-4">
              <p className="text-sm text-zinc-500">Активные</p>
              <p className="mt-1 text-2xl font-bold text-zinc-950">{stats.active}</p>
            </div>
          </div>

          <div className="mt-8">
            {visibleListings.length === 0 ? (
              <div className="rounded-[28px] border border-zinc-200 bg-white p-10 text-center shadow-sm">
                <p className="text-4xl">📋</p>
                <p className="mt-4 text-xl font-bold text-zinc-950">Объявлений пока нет</p>
                <p className="mt-2 text-sm text-zinc-500">Создайте первое объявление, и оно появится в кабинете.</p>
                <Link href="/create" className="mt-5 inline-flex rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white">Создать объявление</Link>
              </div>
            ) : (
              <div className="space-y-5">
                {visibleListings.map((listing) => {
                  const tone = imageToneForCategory(listing.category.slug)
                  const thumb = listing.images?.[0]
                  const views = listing.views || 0
                  const favorites = listing._count?.favorites || 0
                  const opens = listingOpens[listing.id] || 0
                  const engagement = views > 0 ? Math.round(((favorites + opens) / views) * 100) : 0

                  return (
                    <article key={listing.id} className="grid gap-4 rounded-[28px] bg-white py-3 md:grid-cols-[180px_minmax(0,1fr)_280px]">
                      <Link href={`/listings/${listing.id}`} onClick={() => trackListingOpen(listing.id)} className={`h-32 overflow-hidden rounded-2xl bg-gradient-to-br ${tone}`}>
                        {thumb ? <img src={thumb} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-4xl">📦</div>}
                      </Link>
                      <div className="min-w-0">
                        <Link href={`/listings/${listing.id}`} onClick={() => trackListingOpen(listing.id)} className="text-xl font-bold leading-tight text-zinc-950 hover:underline">
                          {listing.title}
                        </Link>
                        <p className="mt-1 text-xl font-medium text-zinc-950">{formatPrice(listing.price)}</p>
                        <p className="mt-2 text-sm text-zinc-500">{listing.city || "Город не указан"}</p>
                        <p className="mt-1 text-sm text-zinc-400">● {listing.category.nameRu}</p>
                        <span className="mt-3 inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">
                          {statusLabel[listing.status] || listing.status}
                        </span>
                      </div>
                      <div className="text-sm text-zinc-700">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="rounded-2xl bg-zinc-50 p-3">
                            <p className="text-[11px] font-medium text-zinc-400">Видят</p>
                            <p className="mt-1 text-lg font-bold text-zinc-950">{statNumber(views)}</p>
                          </div>
                          <div className="rounded-2xl bg-zinc-50 p-3">
                            <p className="text-[11px] font-medium text-zinc-400">В избранном</p>
                            <p className="mt-1 text-lg font-bold text-zinc-950">{statNumber(favorites)}</p>
                          </div>
                          <div className="rounded-2xl bg-zinc-50 p-3">
                            <p className="text-[11px] font-medium text-zinc-400">Переходы</p>
                            <p className="mt-1 text-lg font-bold text-zinc-950">{statNumber(opens)}</p>
                          </div>
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
                            <Link href={`/my-listings/${listing.id}/edit`} className="flex items-center justify-center rounded-2xl bg-zinc-100 font-bold text-zinc-950">…</Link>
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
            <Link href="/my-listings" className="inline-flex rounded-2xl border border-zinc-200 px-5 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
              Открыть все объявления
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
