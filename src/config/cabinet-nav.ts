export type CabinetNavItem = {
  label: string
  href: string
  exact?: boolean
  badge?: boolean
  /** Короткое пояснение сценария (профиль, сайдбар). */
  subtitle?: string
}

export type CabinetNavSection = {
  title?: string
  items: CabinetNavItem[]
}

export const CABINET_NAV_SECTIONS: CabinetNavSection[] = [
  {
    title: "Продажи",
    items: [
      {
        label: "Мои объявления",
        href: "/my-listings",
        subtitle: "Активные и архивные",
      },
      {
        label: "Продвижение",
        href: "/profile/promotion",
        subtitle: "Поднять в поиске",
      },
      {
        label: "Моя реклама",
        href: "/profile/ads",
        subtitle: "Рекламный кабинет",
      },
      { label: "Отзывы", href: "/profile/reviews" },
    ],
  },
  {
    title: "Покупки",
    items: [
      {
        label: "Избранное",
        href: "/profile/favorites",
        subtitle: "Сохранённые объявления",
      },
      {
        label: "Мои заявки «Куплю»",
        href: "/profile/want-to-buy",
        subtitle: "Что вы хотите купить",
      },
      {
        label: "Отклики продавцов",
        href: "/profile/want-to-buy/offers",
        subtitle: "Предложения по вашим заявкам",
      },
      {
        label: "Мои предложения",
        href: "/profile/my-offers",
        subtitle: "Отклики на заявки других",
      },
    ],
  },
  {
    title: "Общение",
    items: [
      { label: "Сообщения", href: "/chat", badge: true },
    ],
  },
  {
    title: "Финансы",
    items: [
      {
        label: "Кошелёк",
        href: "/profile/finance",
        subtitle: "Баланс и пополнение",
      },
      {
        label: "Баллы Нашло",
        href: "/profile/bonuses",
        subtitle: "Бонусная программа",
      },
    ],
  },
  {
    title: "Аккаунт",
    items: [
      { label: "Настройки", href: "/profile/settings" },
      {
        label: "Личные данные",
        href: "/profile",
        exact: true,
      },
    ],
  },
]

/** Плоский список для обратной совместимости. */
export const CABINET_NAV_ITEMS: CabinetNavItem[] = CABINET_NAV_SECTIONS.flatMap(
  (section) => section.items,
)

export function isCabinetNavActive(pathname: string, item: CabinetNavItem): boolean {
  if (item.href === "/chat") {
    return (
      pathname === "/chat" ||
      pathname.startsWith("/chat/") ||
      pathname.startsWith("/messages/")
    )
  }
  if (item.exact) return pathname === item.href
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}
