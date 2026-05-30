/** Legal review recommended — финальная проверка юристом желательна. */

/** Версия юридических документов и дата публикации — синхронизировать при обновлении текстов. */
export const LEGAL_DOCUMENT_VERSION = "1.1"
export const LEGAL_PUBLISHED_DATE_RU = "21 мая 2026 г."

export const LEGAL_SERVICE_LABEL =
  "Сервис Нашло, размещённый на домене nashlo.ru"

export const OWNER_LEGAL_NAME =
  "Индивидуальный предприниматель Антонов Александр Сергеевич"

export const OWNER_INN = "291803336080"
export const OWNER_OGRNIP = "324470400081783"

export const BANK_DETAILS = {
  account: "40802810400006464926",
  bankName: 'АО «ТБанк»',
  bik: "044525974",
  bankInn: "7710140679",
  correspondentAccount: "30101810145250000974",
  bankLegalAddress: "127287, г. Москва, ул. Хуторская 2-я, д. 38А, стр. 26",
} as const

export const CONTACT_EMAIL_PRIVACY = "privacy@nashlo.ru"
export const CONTACT_EMAIL_SUPPORT = "support@nashlo.ru"
export const CONTACT_EMAIL_ADS = "support@nashlo.ru"

export const LEGAL_LINKS = {
  index: "/legal",
  userAgreement: "/legal/user-agreement",
  privacyPolicy: "/legal/privacy-policy",
  personalDataConsent: "/legal/personal-data-consent",
  cookiePolicy: "/legal/cookie-policy",
  recommendationTechnologies: "/legal/recommendation-technologies",
  listingRules: "/legal/listing-rules",
  moderation: "/legal/moderation",
  reviews: "/legal/reviews",
  bonusRules: "/legal/bonus-rules",
  promotionRules: "/legal/promotion-rules",
  promotionOffer: "/legal/promotion-offer",
  advertisingRules: "/legal/advertising-rules",
  advertisingOffer: "/legal/advertising-offer",
  /** Общая оферта на платные услуги (исторический URL; см. также специализированные оферты). */
  offer: "/legal/offer",
  disclaimer: "/legal/disclaimer",
  safety: "/legal/safety",
  requisites: "/legal/requisites",
  contacts: "/legal/contacts",
  dkp: "/legal/dkp",
} as const

export const LEGAL_DOCUMENT_INDEX: {
  title: string
  items: { href: string; label: string }[]
}[] = [
  {
    title: "Основные документы",
    items: [
      { href: LEGAL_LINKS.userAgreement, label: "Пользовательское соглашение" },
      { href: LEGAL_LINKS.privacyPolicy, label: "Политика обработки персональных данных" },
      { href: LEGAL_LINKS.personalDataConsent, label: "Согласие на обработку персональных данных" },
      { href: LEGAL_LINKS.cookiePolicy, label: "Политика cookies" },
      {
        href: LEGAL_LINKS.recommendationTechnologies,
        label: "Правила применения рекомендательных технологий",
      },
      { href: LEGAL_LINKS.disclaimer, label: "Отказ от ответственности" },
    ],
  },
  {
    title: "Объявления и общение",
    items: [
      { href: LEGAL_LINKS.listingRules, label: "Правила размещения объявлений" },
      { href: LEGAL_LINKS.moderation, label: "Правила модерации" },
      { href: LEGAL_LINKS.reviews, label: "Правила отзывов" },
      { href: LEGAL_LINKS.safety, label: "Правила безопасности сделок" },
      { href: LEGAL_LINKS.dkp, label: "Справка: договор купли-продажи" },
    ],
  },
  {
    title: "Платные услуги и бонусы",
    items: [
      { href: LEGAL_LINKS.promotionRules, label: "Правила продвижения объявлений" },
      { href: LEGAL_LINKS.promotionOffer, label: "Оферта на платное продвижение" },
      { href: LEGAL_LINKS.bonusRules, label: "Правила бонусной программы «Баллы Нашло»" },
      { href: LEGAL_LINKS.offer, label: "Условия платных услуг (общая оферта)" },
    ],
  },
  {
    title: "Реклама на Нашло",
    items: [
      { href: LEGAL_LINKS.advertisingRules, label: "Правила размещения рекламы" },
      { href: LEGAL_LINKS.advertisingOffer, label: "Оферта на рекламные услуги" },
    ],
  },
  {
    title: "Реквизиты и контакты",
    items: [
      { href: LEGAL_LINKS.requisites, label: "Реквизиты" },
      { href: LEGAL_LINKS.contacts, label: "Контакты" },
    ],
  },
]

export const COOKIE_CONSENT_STORAGE_KEY = "nashlo_cookie_consent"
