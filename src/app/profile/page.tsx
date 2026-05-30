"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Bell,
  ChevronRight,
  ExternalLink,
  Heart,
  LayoutList,
  MessageCircle,
  Rocket,
  Search,
  Settings,
  ShoppingBag,
  Star,
} from "lucide-react"
import { getWantToBuyCreatePath } from "@/lib/want-to-buy/routes"
import { ProfileBadgesSection } from "@/components/profile/ProfileBadgesSection"
import { ProfileBusinessTeaser } from "@/components/business/ProfileBusinessTeaser"
import { ProfileHubMobileMenu } from "@/components/profile/ProfileHubMobileMenu"
import type { PublicUserBadge } from "@/lib/badges/badge-map"
import {
  resolveProfileLevelDisplay,
  formatJoinedYear,
  formatProfileNumber,
  formatWalletBalance,
  profileTypeLabel,
} from "@/lib/profile-hub"

type ProfileStats = {
  listingsTotal: number
  listingsActive: number
  listingsSold: number
  favorites: number
  reviews: number
}

type ProfileUser = {
  id: string
  name: string | null
  phone: string | null
  email?: string | null
  avatar: string | null
  city: string | null
  rating: number
  reviewCount: number
  walletBalance: number
  bonusBalance?: number
  createdAt: string
  profileType?: string | null
  trustTier?: string | null
  isVerified: boolean
  badges?: PublicUserBadge[]
  stats?: ProfileStats
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="mt-1.5 flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => {
        const filled = rating >= index + 1
        const half = !filled && rating >= index + 0.5
        return (
          <Star
            key={index}
            className={`h-3.5 w-3.5 ${
              filled || half
                ? "fill-[hsl(var(--nashlo-orange))] text-[hsl(var(--nashlo-orange))]"
                : "text-zinc-300"
            }`}
            strokeWidth={1.5}
          />
        )
      })}
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<ProfileUser | null>(null)
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  async function load() {
    setError(false)
    setLoading(true)
    try {
      const [profileRes, chatsRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/messages/conversations"),
      ])

      if (profileRes.status === 401) {
        router.push("/login?from=/profile")
        return
      }
      if (!profileRes.ok) {
        setError(true)
        return
      }

      const profileData = await profileRes.json()
      setUser(profileData.user)

      if (chatsRes.ok) {
        const chatsData = await chatsRes.json()
        const count = (chatsData.conversations ?? []).reduce(
          (sum: number, c: { unreadCount?: number }) => sum + (c.unreadCount ?? 0),
          0,
        )
        setUnread(count)
      }
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

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-[hsl(var(--nashlo-orange))]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-base font-semibold text-zinc-950">Не удалось загрузить профиль</p>
        <button
          type="button"
          onClick={() => load()}
          className="rounded-xl bg-[hsl(var(--nashlo-orange))] px-5 py-2.5 text-sm font-semibold text-white"
        >
          Повторить
        </button>
      </div>
    )
  }

  if (!user) return null

  const stats = user.stats ?? {
    listingsTotal: 0,
    listingsActive: 0,
    listingsSold: 0,
    favorites: 0,
    reviews: 0,
  }
  const level = resolveProfileLevelDisplay(user.trustTier, user.badges)
  const joinedYear = formatJoinedYear(user.createdAt)
  const displayName = user.name || "Пользователь"
  const initials = displayName.trim().slice(0, 1).toUpperCase()

  const quickLinks = [
    {
      href: "/my-listings",
      icon: LayoutList,
      title: "Мои объявления",
      value: stats.listingsActive > 0 ? `${stats.listingsActive} активных` : "Разместить",
      accent: false,
    },
    {
      href: "/chat",
      icon: MessageCircle,
      title: "Сообщения",
      value: unread > 0 ? `${unread} новых` : "Открыть чаты",
      accent: unread > 0,
      badge: unread,
    },
    {
      href: "/profile/favorites",
      icon: Heart,
      title: "Избранное",
      value: stats.favorites > 0 ? `${stats.favorites} объявлений` : "Пусто",
      accent: false,
    },
    {
      href: "/profile/promotion",
      icon: Rocket,
      title: "Продвижение",
      value: "Поднять в поиске",
      accent: true,
    },
  ]

  const wantToBuyQuickLinks = [
    {
      href: "/profile/want-to-buy",
      icon: ShoppingBag,
      title: "Мои заявки",
      value: "Что вы хотите купить",
    },
    {
      href: "/profile/want-to-buy/offers",
      icon: MessageCircle,
      title: "Отклики продавцов",
      value: "Предложения по вашим заявкам",
    },
    {
      href: "/profile/my-offers",
      icon: Search,
      title: "Мои предложения",
      value: "Отклики на заявки других",
    },
  ]

  const mobileExtras = [
    {
      href: "/profile/finance",
      label: "Финансы и кошелёк",
      subtitle: formatWalletBalance(user.walletBalance),
    },
    {
      href: "/support",
      label: "Поддержка",
      subtitle: "Помощь по сервису",
    },
  ]

  const statCard =
    "flex min-h-[108px] flex-col rounded-[18px] bg-white p-3.5 shadow-[0_2px_12px_rgba(15,23,42,0.05)] max-lg:border-0 lg:min-h-0 lg:rounded-2xl lg:border lg:border-zinc-200 lg:p-4 lg:shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
  const statLabel = "text-[10px] font-semibold uppercase tracking-[0.06em] text-zinc-400"
  const metaLine = `На Нашло с ${joinedYear} · ${profileTypeLabel(user.profileType)}${user.city ? ` · ${user.city}` : ""}`

  return (
    <div className="w-full min-w-0 lg:pb-0">
      {/* Mobile header */}
      <div className="sticky top-0 z-20 flex items-center justify-between bg-[#F5F6F8]/90 px-4 pb-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] backdrop-blur-md lg:hidden">
        <Link
          href={`/profile/${user.id}`}
          className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 transition active:bg-white/80"
          aria-label="Публичный профиль"
        >
          <ExternalLink className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </Link>
        <h1 className="text-[17px] font-semibold tracking-tight text-zinc-950">Профиль</h1>
        <div className="flex items-center gap-0.5">
          <Link
            href="/profile/notifications"
            className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-600 transition active:bg-white/80"
            aria-label="Уведомления"
          >
            <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </Link>
          <Link
            href="/profile/settings"
            className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-600 transition active:bg-white/80"
            aria-label="Настройки"
          >
            <Settings className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </Link>
        </div>
      </div>

      <div className="flex w-full flex-col gap-3 px-4 pt-2 max-lg:pb-1 lg:gap-5 lg:px-0 lg:pt-0">
        {/* Identity */}
        <section className="overflow-hidden rounded-[20px] bg-white shadow-[0_2px_12px_rgba(15,23,42,0.05)] lg:rounded-2xl lg:border lg:border-zinc-200 lg:p-6 lg:shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="hidden lg:block">
            <h1 className="text-[22px] font-semibold text-zinc-950">Обзор кабинета</h1>
          </div>

          {/* Mobile hero */}
          <div className="p-4 lg:hidden">
            <div className="flex items-start gap-3.5">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt=""
                  className="h-[72px] w-[72px] shrink-0 rounded-full object-cover ring-2 ring-[hsl(var(--nashlo-orange)/0.12)]"
                />
              ) : (
                <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-[hsl(var(--nashlo-orange))] text-[28px] font-bold text-white ring-2 ring-[hsl(var(--nashlo-orange)/0.2)]">
                  {initials}
                </div>
              )}
              <div className="min-w-0 flex-1 pt-0.5">
                <h2 className="truncate text-[22px] font-bold leading-tight tracking-tight text-zinc-950">
                  {displayName}
                </h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {user.isVerified ? (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      Проверен
                    </span>
                  ) : null}
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
                    {level.title}
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] leading-snug text-zinc-500">{metaLine}</p>
                <p className="mt-0.5 text-[11px] text-zinc-400">№ {formatProfileNumber(user.id)}</p>
              </div>
            </div>
            <ProfileBadgesSection badges={user.badges} scrollRow className="mt-3" />
            <div className="mt-3.5 flex flex-col gap-2">
              <Link
                href="/create"
                className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-[hsl(var(--nashlo-orange))] text-[15px] font-semibold text-white shadow-[0_4px_14px_hsl(var(--nashlo-orange)/0.35)] transition active:scale-[0.98] active:opacity-95"
              >
                + Объявление
              </Link>
              <Link
                href={getWantToBuyCreatePath()}
                className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-[#FF5A00]/25 bg-white text-[15px] font-semibold text-[#FF5A00] transition active:bg-[#FFF8F4]"
              >
                Создать заявку «Куплю»
              </Link>
              <Link
                href={`/profile/${user.id}`}
                className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-2xl text-[15px] font-semibold text-zinc-600 transition active:bg-zinc-100"
              >
                Публичный профиль
                <ExternalLink className="h-4 w-4 opacity-60" strokeWidth={1.75} />
              </Link>
            </div>
          </div>

          {/* Desktop hero */}
          <div className="mt-0 hidden flex-col gap-5 lg:mt-5 lg:flex lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="h-[72px] w-[72px] rounded-2xl object-cover" />
              ) : (
                <div className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-[hsl(var(--nashlo-orange))] text-2xl font-bold text-white">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-2xl font-bold text-zinc-950">{displayName}</h2>
                  {user.isVerified ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      ✓ Проверен
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-zinc-500">{metaLine}</p>
                <p className="text-xs text-zinc-400">Профиль № {formatProfileNumber(user.id)}</p>
                {user.isVerified ? (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    ✓ Проверенный продавец
                  </div>
                ) : null}
                <ProfileBadgesSection badges={user.badges} className="mt-2" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 lg:shrink-0">
              <Link
                href={`/profile/${user.id}`}
                className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
              >
                Публичный профиль
                <ExternalLink className="h-4 w-4" />
              </Link>
              <Link
                href="/create"
                className="inline-flex h-11 items-center rounded-xl bg-[hsl(var(--nashlo-orange))] px-4 text-sm font-semibold text-white transition hover:opacity-95"
              >
                + Объявление
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 auto-rows-fr gap-2.5 lg:grid-cols-3 lg:gap-3 xl:grid-cols-5">
          <div className={statCard}>
            <p className={statLabel}>Рейтинг</p>
            <p className="mt-auto pt-1 text-2xl font-bold tabular-nums text-zinc-950">
              {user.rating.toFixed(1).replace(".", ",")}
            </p>
            <RatingStars rating={user.rating} />
            <Link
              href="/profile/reviews"
              className="mt-1 block text-[11px] text-zinc-500 transition hover:text-[hsl(var(--nashlo-orange))]"
            >
              {user.reviewCount > 0 ? `${user.reviewCount} отзывов` : "Нет отзывов"}
            </Link>
          </div>
          <div className={statCard}>
            <p className={statLabel}>{level.source === "badge" ? "Уровень" : "Уровень"}</p>
            <div className="mt-auto flex items-center gap-2 pt-1">
              {level.icon ? (
                <img src={level.icon} alt="" width={24} height={24} className="shrink-0 object-contain" />
              ) : null}
              <p className="text-sm font-semibold leading-snug text-zinc-950">{level.title}</p>
            </div>
            <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-zinc-500">{level.desc}</p>
          </div>
          <div className={statCard}>
            <p className={statLabel}>Объявления</p>
            <p className="mt-auto pt-1 text-2xl font-bold tabular-nums text-zinc-950">{stats.listingsActive}</p>
            <p className="mt-1 text-[11px] text-zinc-500">
              {stats.listingsTotal} всего · {stats.listingsSold} продано
            </p>
          </div>
          <div className={statCard}>
            <p className={statLabel}>Баллы</p>
            <p className="mt-auto pt-1 text-2xl font-bold tabular-nums text-zinc-950">{user.bonusBalance ?? 0}</p>
            <Link
              href="/profile/bonuses"
              className="mt-1 inline-flex text-[11px] font-semibold text-[hsl(var(--nashlo-orange))]"
            >
              Как получить →
            </Link>
          </div>
          <div className={`${statCard} col-span-2 max-lg:col-span-2 lg:col-span-1`}>
            <p className={statLabel}>Кошелёк</p>
            <p className="mt-auto pt-1 text-xl font-bold text-zinc-950">{formatWalletBalance(user.walletBalance)}</p>
            <Link
              href="/profile/finance"
              className="mt-1 inline-flex text-[11px] font-semibold text-[hsl(var(--nashlo-orange))]"
            >
              Пополнить →
            </Link>
          </div>
        </section>

        {/* Меню кабинета — полный список как в сайдбаре на десктопе */}
        <ProfileHubMobileMenu unreadChats={unread} extras={mobileExtras} />

        <section className="hidden overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-br from-[#FFF8F4] to-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] lg:block">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-zinc-950">Куплю</h2>
              <p className="mt-0.5 text-sm text-zinc-500">Заявки и отклики продавцов</p>
            </div>
            <Link
              href={getWantToBuyCreatePath()}
              className="inline-flex h-10 items-center rounded-xl bg-[#FF5A00] px-4 text-sm font-semibold text-white transition hover:bg-[#E8470F]"
            >
              Создать заявку
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {wantToBuyQuickLinks.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex flex-col rounded-xl border border-zinc-200/80 bg-white p-4 transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF3EC] text-[#FF5A00]">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-zinc-950">{item.title}</p>
                  <p className="mt-0.5 text-xs leading-snug text-zinc-500">{item.value}</p>
                </Link>
              )
            })}
          </div>
        </section>

        <ProfileBusinessTeaser />

        {/* Десктоп: быстрые карточки */}
        <section className="hidden overflow-hidden rounded-[20px] bg-white shadow-[0_2px_12px_rgba(15,23,42,0.05)] lg:grid lg:grid-cols-4 lg:gap-3 lg:overflow-visible lg:rounded-none lg:bg-transparent lg:shadow-none">
          {quickLinks.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-3 transition active:bg-zinc-50 lg:flex-col lg:rounded-2xl lg:border lg:p-4 lg:hover:-translate-y-0.5 lg:hover:shadow-md lg:active:bg-transparent ${
                  item.accent
                    ? "lg:border-orange-100 lg:bg-gradient-to-br lg:from-[#FFF6F0] lg:to-white"
                    : "lg:border-zinc-200 lg:bg-white"
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    item.accent
                      ? "bg-[hsl(var(--nashlo-orange))] text-white"
                      : "bg-zinc-100 text-zinc-700"
                  }`}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1 lg:mt-3 lg:flex-none">
                  <p className="text-[15px] font-semibold text-zinc-950">{item.title}</p>
                  <p className="text-sm text-zinc-500">{item.value}</p>
                </div>
                {item.badge && item.badge > 0 ? (
                  <span className="shrink-0 rounded-full bg-[hsl(var(--nashlo-orange))] px-2 py-0.5 text-[11px] font-bold text-white lg:absolute lg:right-4 lg:top-4">
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight className="hidden h-5 w-5 shrink-0 text-zinc-300 lg:block" strokeWidth={1.75} />
                )}
              </Link>
            )
          })}
        </section>

        <button
          type="button"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" })
            window.dispatchEvent(new Event("nashlo-auth-change"))
            router.push("/")
          }}
          className="flex h-11 w-full items-center justify-center rounded-2xl bg-white text-sm font-semibold text-zinc-500 shadow-[0_2px_12px_rgba(15,23,42,0.05)] transition active:bg-red-50 active:text-red-600 lg:hidden"
        >
          Выйти из аккаунта
        </button>
      </div>
    </div>
  )
}
