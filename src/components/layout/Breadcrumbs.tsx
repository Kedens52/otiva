"use client"

import { usePathname } from "next/navigation"
import { ListingBreadcrumbs } from "@/components/listings/ListingBreadcrumbs"
import type { BreadcrumbItem } from "@/lib/categories/listing-breadcrumbs"
import { MARKETPLACE_CATEGORIES } from "@/lib/category-config"
import { isCabinetRoute } from "@/lib/cabinet-routes"
import { getSeoCategoryChild, getSeoCategoryConfig } from "@/lib/seo/categories"
import { isWantToBuyPublicPath, WANT_TO_BUY_SECTION_LABEL } from "@/config/want-to-buy-brand"

const labels: Record<string, string> = {
  feed: "Главная",
  cars: "Транспорт",
  transport: "Транспорт",
  "real-estate": "Недвижимость",
  services: "Услуги",
  electronics: "Электроника",
  "home-and-garden": "Дом и сад",
  "personal-items": "Личные вещи",
  hobby: "Хобби",
  animals: "Животные",
  jobs: "Работа",
  business: "Нашло Бизнес",
  home: "Дом и интерьер",
  fashion: "Одежда и обувь",
  kids: "Детям",
  sport: "Спорт и отдых",
  favorites: "Избранное",
  chat: "Сообщения",
  messages: "Сообщения",
  "my-listings": "Мои объявления",
  profile: "Профиль",
  reviews: "Отзывы",
  ads: "Моя реклама",
  create: "Разместить объявление",
  categories: "Категории",
  listings: "Объявления",
  kyplu: WANT_TO_BUY_SECTION_LABEL,
  search: "Поиск",
  login: "Вход",
  register: "Регистрация",
  advertising: "Реклама",
  "ad-cabinet": "Кабинет рекламодателя",
  about: "О компании",
  help: "Помощь",
  safety: "Безопасность",
  support: "Поддержка",
  pricing: "Тарифы",
  wallet: "Кошелёк",
  legal: "Правовая информация",
  blog: "Блог",
  careers: "Карьера",
  sitemap: "Карта сайта",
  free: "Бесплатно",
  admin: "Админ",
  moderation: "Модерация",
  analytics: "Аналитика",
  users: "Пользователи",
  category: "Категории",
}

function getSegmentLabel(segment: string, segments: string[], index: number): string {
  if (labels[segment]) return labels[segment]

  const seoConfig = getSeoCategoryConfig(segment)
  if (seoConfig && index === 0) return seoConfig.label

  if (index > 0) {
    const parent = segments[0] === "category" ? segments[1] : segments[0]
    if (parent) {
      const child = getSeoCategoryChild(parent, segment)
      if (child) return child.label
    }
    if (segments[index - 1] === "category") {
      const cat = MARKETPLACE_CATEGORIES.find((item) => item.slug === segment)
      if (cat) return cat.title
    }
  }

  const category = MARKETPLACE_CATEGORIES.find((item) => item.slug === segment)
  if (category) return category.title

  if (segments[index - 1] === "messages") return "Диалог"
  if (segment.length > 20) return "Объявление"

  return decodeURIComponent(segment).replace(/-/g, " ")
}

/** Глобальные крошки для страниц без собственных (см. hasDedicatedBreadcrumbs). */
export function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  if (
    segments.length === 0 ||
    pathname === "/" ||
    pathname === "/feed" ||
    isWantToBuyPublicPath(pathname) ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/admin/login" ||
    isCabinetRoute(pathname)
  ) {
    return null
  }

  const crumbs: BreadcrumbItem[] = [
    { label: "Главная", href: "/" },
    ...segments.map((segment, index) => {
      const isLast = index === segments.length - 1
      return {
        label: getSegmentLabel(segment, segments, index),
        href: isLast ? null : `/${segments.slice(0, index + 1).join("/")}`,
        current: isLast,
      }
    }),
  ]

  return <ListingBreadcrumbs crumbs={crumbs} />
}
