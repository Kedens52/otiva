"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { getCategoryBySlug, getListingById, type ListingCategory } from "@/lib/mock-marketplace"

const labels: Record<string, string> = {
  feed: "Главная",
  cars: "Авто",
  "real-estate": "Недвижимость",
  services: "Услуги",
  electronics: "Электроника",
  home: "Дом и интерьер",
  fashion: "Одежда",
  kids: "Детям",
  sport: "Спорт",
  favorites: "Избранное",
  chat: "Чат",
  messages: "Сообщения",
  "my-listings": "Мои объявления",
  profile: "Профиль",
  demo: "Демо профиль",
  create: "Разместить объявление",
  categories: "Категории",
  listings: "Объявления",
  login: "Вход",
  register: "Регистрация",
  advertising: "Реклама",
  about: "О компании",
  help: "Помощь",
  safety: "Безопасность",
  careers: "Карьера",
  blog: "Блог",
  app: "Приложение",
  sitemap: "Карта сайта",
  admin: "Админ",
  moderation: "Модерация",
  analytics: "Аналитика",
  users: "Пользователи",
}

function getSegmentLabel(segment: string, previous?: string) {
  if (labels[segment]) return labels[segment]
  if (/^\d+$/.test(segment) && previous === "cars") return "Карточка авто"
  if (/^\d+$/.test(segment) && previous === "listings") return "Объявление"
  if (previous === "messages") return "Диалог"
  return decodeURIComponent(segment)
}

function getCategoryTrail(category: ListingCategory, title: string) {
  const categoryInfo = getCategoryBySlug(category)
  const categoryHref = categoryInfo?.href || `/${category}`
  const sectionByCategory: Record<ListingCategory, string> = {
    cars: "Автомобили",
    "real-estate": "Жилая недвижимость",
    services: "Услуги специалистов",
    electronics: "Техника и электроника",
    home: "Мебель и интерьер",
    fashion: "Одежда и аксессуары",
    kids: "Товары для детей",
    sport: "Спорт и отдых",
  }

  return [
    { href: categoryHref, label: categoryInfo?.title || getSegmentLabel(category) },
    { href: categoryHref, label: sectionByCategory[category] },
    { href: "", label: title },
  ]
}

export function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  if (segments.length === 0 || pathname === "/feed" || pathname === "/login" || pathname === "/register" || pathname === "/admin/login") return null

  const listingId = segments[0] === "listings" || segments[0] === "cars" ? segments[1] : undefined
  const listing = listingId ? getListingById(listingId) : undefined
  const crumbs = listing
    ? getCategoryTrail(listing.category, listing.title)
    : segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join("/")}`
        return {
          href,
          label: getSegmentLabel(segment, segments[index - 1]),
        }
      })

  return (
    <nav className="border-b border-zinc-100 bg-white" aria-label="Хлебные крошки">
      <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-3 text-sm text-zinc-500">
        <Link href="/feed" className="shrink-0 font-medium text-zinc-500 hover:text-zinc-950">
          Главная
        </Link>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1
          const isFeed = crumb.href === "/feed"

          if (isFeed) return null

          return (
            <span key={crumb.href} className="flex shrink-0 items-center gap-2">
              <span className="text-zinc-300">/</span>
              {isLast || !crumb.href ? (
                <span className="max-w-[220px] truncate font-medium text-zinc-950 sm:max-w-none">
                  {crumb.label}
                </span>
              ) : (
                <Link href={crumb.href} className="max-w-[180px] truncate hover:text-zinc-950 sm:max-w-none">
                  {crumb.label}
                </Link>
              )}
            </span>
          )
        })}
      </div>
    </nav>
  )
}
