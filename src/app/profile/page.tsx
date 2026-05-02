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
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<"active" | "archive">("active")
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

    load().catch(() => router.push("/login?from=/profile"))
  }, [router])

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
      <main className="mx-auto flex min-h-[60vh] max-w-7xl items-center px-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950" />
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
    const interest = views > 0 ? Math.round(((favorites + opens) / views) * 100) : 0

    return (
      <article className="grid min-w-0 gap-4 rounded-[28px] border border-zinc-200 bg-white p-3 shadow-sm md:grid-cols-[160px_minmax(0,1fr)_260px] md:p-4">
        <Link
          href={`/listings/${listing.id}`}
          onClick={() => trackListingOpen(listing.id)}
          className={`h-36 overflow-hidden rounded-3xl bg-gradient-to-br ${tone} md:h-32`}
        >
          {thumb ? (
            <img src={thumb} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-zinc-500">Фото</div>
          )}
        </Link>

        <div className="min-w-0">
          <div className="flex flex-wrap items-start gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor[listing.status] ?? "bg-zinc-100 text-zinc-500"}`}>
              {statusLabel[listing.status] || listing.status}
            </span>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-500">
              {listing.category.nameRu}
            </span>
          </div>
          <Link
            href={`/listings/${listing.id}`}
            onClick={() => trackListingOpen(listing.id)}
            className="mt-3 block text-lg font-bold leading-tight text-zinc-950 hover:underline"
          >
            {listing.title}
          </Link>
          <p className="mt-1 text-xl font-bold text-zinc-950">{formatPrice(listing.price)}</p>
          <p className="mt-2 text-sm text-zinc-500">{listing.city || "Город не указан"}</p>
          <p className="mt-1 text-xs text-zinc-400">
            Создано {new Date(listing.createdAt).toLocaleDateString("ru-RU")}
          </p>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Видят", value: statNumber(views) },
              { label: "В избранном", value: statNumber(favorites) },
              { label: "Переходы", value: statNumber(opens) },
            ].map((item) => (
              <div key={item.label} className="min-w-0 rounded-2xl bg-zinc-50 p-2.5 sm:p-3">
                <p className="text-base font-bold text-zinc-950">{item.value}</p>
                <p className="mt-0.5 truncate text-[10px] text-zinc-400 sm:text-[11px]">{item.label}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl bg-orange-50 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-950">Интерес</span>
              <span className="font-bold text-[hsl(var(--nashlo-orange))]">{interest}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-[hsl(var(--nashlo-orange))]" style={{ width: `${Math.min(100, interest)}%` }} />
            </div>
          </div>
          <div className="grid grid-cols-[1fr_44px] gap-2">
            <Link href={`/my-listings/${listing.id}/edit`} className="rounded-2xl bg-zinc-100 px-4 py-3 text-center text-sm font-semibold text-zinc-950">
              Управлять
            </Link>
            <Link href={`/listings/${listing.id}`} className="flex items-center justify-center rounded-2xl bg-zinc-100 text-lg font-bold text-zinc-950">
              ›
            </Link>
          </div>
        </div>
      </article>
    )
  }

  return (
    <main className="pb-28 lg:pb-12">
      <div className="mx-auto min-w-0 max-w-7xl px-4 py-5 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <section className="rounded-[32px] border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-4 lg:block">
                <div className="relative shrink-0">
                  <Avatar size="h-20 w-20 lg:h-24 lg:w-24" />
                  <Link
                    href="/profile/settings"
                    className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-4 border-white bg-[hsl(var(--nashlo-orange))] text-sm font-bold text-white"
                    aria-label="Редактировать профиль"
                  >
                    +
                  </Link>
                </div>
                <div className="min-w-0 lg:mt-5">
                  <h1 className="truncate text-2xl font-bold tracking-tight text-zinc-950">
                    {user.name || "Заполните профиль"}
                  </h1>
                  <p className="mt-1 text-sm text-zinc-500">{user.description || "Частное лицо"}</p>
                  <p className="mt-1 text-xs text-zinc-400">На Нашло с {joined}</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-zinc-50 p-3">
                  <p className="text-xl font-bold text-zinc-950">{(user.rating || 0).toFixed(1)}</p>
                  <p className="text-xs text-zinc-500">рейтинг</p>
                </div>
                <div className="rounded-2xl bg-zinc-50 p-3">
                  <p className="text-xl font-bold text-zinc-950">{user.reviewCount || 0}</p>
                  <p className="text-xs text-zinc-500">отзывов</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-zinc-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-zinc-950">Профиль заполнен</p>
                  <p className="text-sm font-bold text-[hsl(var(--nashlo-orange))]">{profileProgress}%</p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-[hsl(var(--nashlo-orange))]" style={{ width: `${profileProgress}%` }} />
                </div>
                {profileProgress < 100 && (
                  <Link href="/profile/settings" className="mt-3 inline-flex text-sm font-semibold text-[hsl(var(--nashlo-orange))]">
                    Дополнить данные
                  </Link>
                )}
              </div>

              <div className="mt-4 space-y-2">
                <Link href={publicPath} className="flex items-center justify-center rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white">
                  Открыть публичный профиль
                </Link>
                <button onClick={copyPublicLink} className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-700">
                  {copied ? "Ссылка скопирована" : "Скопировать ссылку"}
                </button>
              </div>
            </section>

            <section className="mt-4 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-bold text-zinc-950">Способы входа</h2>
              <div className="mt-4 space-y-2">
                {(["phone", "vk", "yandex"] as const).map((key) => {
                  const active = authProviders[key]
                  return (
                    <div key={key} className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3">
                      <span className="text-sm font-semibold text-zinc-800">{providerLabel(key)}</span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${active ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-400"}`}>
                        {active ? "Подключен" : "Не подключен"}
                      </span>
                    </div>
                  )
                })}
              </div>
              <p className="mt-3 text-xs leading-5 text-zinc-500">
                Если телефон или почта совпадают, вход через VK, Яндекс и SMS будет вести в один профиль.
              </p>
            </section>

            <nav className="mt-4 grid gap-2 rounded-[28px] border border-zinc-200 bg-white p-3 shadow-sm">
              {[
                { label: "Мои объявления", href: "/my-listings" },
                { label: "Сообщения", href: "/chat" },
                { label: "Избранное", href: "/favorites" },
                { label: "Настройки", href: "/profile/settings" },
                { label: "Реклама и продвижение", href: "/advertising" },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="rounded-2xl px-3 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          <section className="min-w-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-zinc-950 lg:text-5xl">Личный кабинет</h2>
                <p className="mt-2 text-sm text-zinc-500">Управление объявлениями, статистикой и профилем продавца.</p>
              </div>
              <Link href="/create" className="w-fit rounded-2xl bg-[hsl(var(--nashlo-orange))] px-5 py-3 text-sm font-semibold text-white shadow-sm">
                Разместить объявление
              </Link>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Всего объявлений", value: stats.total },
                { label: "Активные", value: stats.active },
                { label: "Просмотры", value: statNumber(stats.views) },
                { label: "В избранном", value: statNumber(stats.favorites) },
              ].map((item) => (
                <div key={item.label} className="rounded-[26px] border border-zinc-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-zinc-500">{item.label}</p>
                  <p className="mt-2 text-3xl font-bold text-zinc-950">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <Link href="/my-listings" className="rounded-[26px] bg-zinc-950 p-5 text-white">
                <p className="text-lg font-bold">Кабинет объявлений</p>
                <p className="mt-2 text-sm text-white/70">Редактирование, архив и статистика по каждому товару.</p>
              </Link>
              <Link href="/ad-cabinet" className="rounded-[26px] bg-orange-50 p-5">
                <p className="text-lg font-bold text-zinc-950">Кабинет рекламодателя</p>
                <p className="mt-2 text-sm text-zinc-600">Баннеры, переходы и рекламные заявки.</p>
              </Link>
              <Link href="/support" className="rounded-[26px] bg-zinc-100 p-5">
                <p className="text-lg font-bold text-zinc-950">Поддержка</p>
                <p className="mt-2 text-sm text-zinc-600">Отдельный чат с командой Нашло.</p>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-3">
              <div className="flex gap-5">
                <button
                  onClick={() => setActiveTab("active")}
                  className={`border-b-4 pb-3 text-lg font-bold transition ${activeTab === "active" ? "border-zinc-950 text-zinc-950" : "border-transparent text-zinc-400"}`}
                >
                  Активные <span className="text-zinc-400">{stats.active + stats.moderation}</span>
                </button>
                <button
                  onClick={() => setActiveTab("archive")}
                  className={`border-b-4 pb-3 text-lg font-bold transition ${activeTab === "archive" ? "border-zinc-950 text-zinc-950" : "border-transparent text-zinc-400"}`}
                >
                  Архив <span className="text-zinc-400">{stats.archived}</span>
                </button>
              </div>
              <p className="text-sm text-zinc-500">Переходы в карточки: {statNumber(totalOpens)}</p>
            </div>

            <div className="mt-5 space-y-4">
              {visibleListings.length ? (
                visibleListings.map((listing) => <ListingRow key={listing.id} listing={listing} />)
              ) : (
                <div className="rounded-[32px] border border-zinc-200 bg-white p-10 text-center shadow-sm">
                  <p className="text-xl font-bold text-zinc-950">
                    {activeTab === "active" ? "Активных объявлений пока нет" : "Архив пуст"}
                  </p>
                  <p className="mt-2 text-sm text-zinc-500">
                    {activeTab === "active"
                      ? "Создайте объявление, и оно появится здесь после проверки."
                      : "Снятые и проданные объявления будут храниться в этом разделе."}
                  </p>
                  {activeTab === "active" && (
                    <Link href="/create" className="mt-5 inline-flex rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white">
                      Создать объявление
                    </Link>
                  )}
                </div>
              )}
            </div>

            {visibleListings.length > 0 && (
              <div className="mt-6">
                <Link href="/my-listings" className="inline-flex rounded-2xl border border-zinc-200 px-5 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
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
