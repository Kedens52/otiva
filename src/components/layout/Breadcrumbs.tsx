"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CATEGORY_META } from "@/lib/listing-types"

const labels: Record<string, string> = {
  feed: "Главная",
  cars: "Транспорт",
  "real-estate": "Недвижимость",
  services: "Услуги",
  electronics: "Электроника",
  home: "Дом и интерьер",
  fashion: "Одежда и обувь",
  kids: "Детям",
  sport: "Спорт и отдых",
  favorites: "Избранное",
  chat: "Чат",
  messages: "Сообщения",
  "my-listings": "Мои объявления",
  profile: "Профиль",
  create: "Разместить объявление",
  categories: "Категории",
  listings: "Объявления",
  search: "Поиск",
  login: "Вход",
  register: "Регистрация",
  advertising: "Реклама",
  "ad-cabinet": "Кабинет рекламодателя",
  about: "О компании",
  help: "Помощь",
  safety: "Безопасность",
  admin: "Админ",
  moderation: "Модерация",
  analytics: "Аналитика",
  users: "Пользователи",
}

const categoryLabel = Object.fromEntries(CATEGORY_META.map((c) => [c.slug, c.title]))

function getSegmentLabel(segment: string, previous?: string): string {
  if (labels[segment]) return labels[segment]
  if (categoryLabel[segment]) return categoryLabel[segment]
  if (previous === "messages") return "Диалог"
  // IDs — skip verbose display
  if (segment.length > 20) return "Объявление"
  return decodeURIComponent(segment)
}

export function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  if (
    segments.length === 0 ||
    pathname === "/feed" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/admin/login"
  ) return null

  const crumbs = segments.map((segment, index) => ({
    href: `/${segments.slice(0, index + 1).join("/")}`,
    label: getSegmentLabel(segment, segments[index - 1]),
  }))

  return (
    <nav className="border-b border-zinc-100 bg-white" aria-label="Хлебные крошки">
      <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-3 text-sm text-zinc-500">
        <Link href="/feed" className="shrink-0 font-medium text-zinc-500 hover:text-zinc-950">
          Главная
        </Link>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1
          return (
            <span key={index} className="flex shrink-0 items-center gap-2">
              <span className="text-zinc-300">/</span>
              {isLast ? (
                <span className="max-w-[220px] truncate font-medium text-zinc-950 sm:max-w-none">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="max-w-[180px] truncate hover:text-zinc-950 sm:max-w-none">{crumb.label}</Link>
              )}
            </span>
          )
        })}
      </div>
    </nav>
  )
}
