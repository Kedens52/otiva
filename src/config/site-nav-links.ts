import { WANT_TO_BUY_PUBLIC_BASE, WANT_TO_BUY_SECTION_LABEL } from "@/config/want-to-buy-brand"
import { LEGAL_LINKS } from "@/lib/legal-meta"

/** Верхняя служебная полоса в шапке (десктоп). */
export const TOP_UTILITY_LINKS = [
  { label: WANT_TO_BUY_SECTION_LABEL, href: WANT_TO_BUY_PUBLIC_BASE },
  { label: "Нашло Бизнес", href: "/business" },
  { label: "Помощь", href: "/help" },
  { label: "Безопасность", href: "/safety" },
  { label: "Реклама на Нашло", href: "/advertising" },
] as const

/** Ссылки B2B в подвале основной площадки */
export const FOOTER_BUSINESS_LINKS = [
  { label: "Нашло Бизнес", href: "/business" },
  { label: "Оптовые предложения", href: "/business/wholesale" },
  { label: "Продажа бизнеса", href: "/business/sell-business" },
  { label: "Реклама для бизнеса", href: "/legal/business-advertising" },
  { label: "Реклама на Нашло", href: "/advertising" },
  { label: "Правила рекламы", href: LEGAL_LINKS.advertisingRules },
  { label: "Оферта на рекламу", href: LEGAL_LINKS.advertisingOffer },
  { label: "Регистрация бизнеса", href: "/business/register" },
] as const

export type FooterNavLink = { label: string; href: string }

export type FooterNavGroup = {
  title: string
  links: readonly FooterNavLink[]
}

/** Группы ссылок в подвале — 5 колонок на десктопе */
export const FOOTER_NAV_GROUPS: readonly FooterNavGroup[] = [
  {
    title: "Пользователям",
    links: [
      { label: WANT_TO_BUY_SECTION_LABEL, href: WANT_TO_BUY_PUBLIC_BASE },
      { label: "Помощь", href: "/help" },
      { label: "Безопасность", href: "/safety" },
      { label: "Правила размещения", href: LEGAL_LINKS.listingRules },
      { label: "Отзывы", href: LEGAL_LINKS.reviews },
      { label: "Поддержка", href: "/support" },
    ],
  },
  {
    title: "Документы",
    links: [
      { label: "Все документы", href: LEGAL_LINKS.index },
      { label: "Пользовательское соглашение", href: LEGAL_LINKS.userAgreement },
      { label: "Политика персональных данных", href: LEGAL_LINKS.privacyPolicy },
      { label: "Согласие на обработку данных", href: LEGAL_LINKS.personalDataConsent },
      { label: "Cookies", href: LEGAL_LINKS.cookiePolicy },
    ],
  },
  {
    title: "Платные услуги",
    links: [
      { label: "Тарифы", href: "/pricing" },
      { label: "Продвижение", href: "/profile/promotion" },
      { label: "Оферта на платные услуги", href: LEGAL_LINKS.promotionOffer },
      { label: "Правила продвижения", href: LEGAL_LINKS.promotionRules },
      { label: "Баллы Нашло", href: "/profile/bonuses" },
    ],
  },
  {
    title: "Для бизнеса",
    links: [
      ...FOOTER_BUSINESS_LINKS,
      {
        label: "Требования к медиа-рекламе",
        href: `${LEGAL_LINKS.advertisingRules}#требования-к-креативам`,
      },
    ],
  },
  {
    title: "Компания",
    links: [
      { label: "О проекте", href: "/about" },
      { label: "Реквизиты", href: LEGAL_LINKS.requisites },
      { label: "Контакты", href: LEGAL_LINKS.contacts },
      {
        label: "Правила рекомендательных технологий",
        href: LEGAL_LINKS.recommendationTechnologies,
      },
    ],
  },
] as const

/** Соцсети в подвале — только VK и MAX */
export const FOOTER_SOCIAL_LINKS = [
  // TODO: заменить на официальную страницу Нашло во ВКонтакте
  { label: "ВКонтакте", href: "https://vk.com", short: "VK" },
  // TODO: заменить на официальный канал Нашло в MAX
  { label: "MAX", href: "https://max.ru", short: "MAX" },
] as const

/** @deprecated Используйте FOOTER_NAV_GROUPS */
export const FOOTER_SECTION_LINKS = FOOTER_NAV_GROUPS[4].links

/** @deprecated Используйте FOOTER_NAV_GROUPS */
export const FOOTER_LEGAL_PRIMARY = FOOTER_NAV_GROUPS[1].links

/** @deprecated Используйте FOOTER_NAV_GROUPS */
export const FOOTER_LEGAL_SECONDARY = [
  ...FOOTER_NAV_GROUPS[2].links,
  ...FOOTER_NAV_GROUPS[3].links,
] as const

export const FOOTER_LEGAL_LINKS = [
  ...FOOTER_NAV_GROUPS[1].links,
  ...FOOTER_NAV_GROUPS[2].links,
  ...FOOTER_NAV_GROUPS[3].links,
] as const
