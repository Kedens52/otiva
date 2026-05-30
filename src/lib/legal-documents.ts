import { getLegalDocumentSections } from "@/lib/legal-sections"
import { LEGAL_LINKS } from "@/lib/legal-meta"

export type LegalDocCategory =
  | "main"
  | "privacyTech"
  | "listings"
  | "reviews"
  | "paid"
  | "ads"
  | "bonuses"
  | "company"

export type LegalDocumentEntry = {
  title: string
  description: string
  href: string
  keywords: string[]
  category: LegalDocCategory
  categoryLabel: string
  /** Дополнительный текст для client-side поиска по разделам */
  searchText?: string
  related?: string[]
}

export const LEGAL_CATEGORY_LABELS: Record<LegalDocCategory, string> = {
  main: "Основные документы",
  privacyTech: "Защита данных и технологии",
  listings: "Объявления",
  reviews: "Отзывы и профиль",
  paid: "Платные услуги",
  ads: "Реклама",
  bonuses: "Бонусы",
  company: "Компания",
}

export type LegalIndexCard = {
  title: string
  description: string
  href: string
  /** Страница вне /legal (тарифы, помощь) */
  external?: boolean
}

export type LegalIndexGroup = {
  title: string
  items: LegalIndexCard[]
}

export type LegalHubLink = { label: string; href: string }

export type LegalHubSection = {
  id: string
  title: string
  description: string
  links: LegalHubLink[]
}

/** Быстрые ссылки в hero на /legal */
export const LEGAL_HUB_QUICK_LINKS: LegalHubLink[] = [
  { label: "Пользовательское соглашение", href: LEGAL_LINKS.userAgreement },
  { label: "Правила размещения объявлений", href: LEGAL_LINKS.listingRules },
  { label: "Оферта на платные услуги", href: LEGAL_LINKS.promotionOffer },
  {
    label: "Запрещённые объявления",
    href: `${LEGAL_LINKS.listingRules}#запрещённые-товары-и-услуги`,
  },
]

/** Карточки разделов на главной /legal */
export const LEGAL_HUB_SECTIONS: LegalHubSection[] = [
  {
    id: "listings",
    title: "Объявления",
    description: "Правила размещения, модерации, скрытия и удаления объявлений.",
    links: [
      { label: "Правила размещения", href: LEGAL_LINKS.listingRules },
      { label: "Правила модерации", href: LEGAL_LINKS.moderation },
      {
        label: "Запрещённые товары и услуги",
        href: `${LEGAL_LINKS.listingRules}#запрещённые-товары-и-услуги`,
      },
    ],
  },
  {
    id: "paid",
    title: "Платные услуги",
    description: "Продвижение, поднятия, выделения, рекомендации и порядок оплаты.",
    links: [
      { label: "Оферта на платные услуги", href: LEGAL_LINKS.promotionOffer },
      { label: "Правила продвижения", href: LEGAL_LINKS.promotionRules },
      { label: "Тарифы", href: "/pricing" },
    ],
  },
  {
    id: "ads",
    title: "Реклама",
    description: "Условия размещения рекламы, баннеров, медиа и рекламных кампаний.",
    links: [
      { label: "Правила рекламы", href: LEGAL_LINKS.advertisingRules },
      { label: "Оферта на рекламные услуги", href: LEGAL_LINKS.advertisingOffer },
      {
        label: "Требования к медиа-рекламе",
        href: `${LEGAL_LINKS.advertisingRules}#требования-к-креативам`,
      },
    ],
  },
  {
    id: "bonuses",
    title: "Бонусы",
    description: "Как работают Баллы Нашло, начисления, списания и ограничения.",
    links: [{ label: "Правила бонусной программы", href: LEGAL_LINKS.bonusRules }],
  },
  {
    id: "reviews",
    title: "Отзывы и профиль",
    description: "Отзывы, рейтинг, жалобы, публичный профиль и доверие.",
    links: [
      { label: "Правила отзывов", href: LEGAL_LINKS.reviews },
      { label: "Правила публичного профиля", href: `${LEGAL_LINKS.userAgreement}#регистрация-и-аккаунт` },
    ],
  },
  {
    id: "privacy",
    title: "Защита данных и технологии",
    description: "Персональные данные, cookies, рекомендации и безопасность аккаунта.",
    links: [
      {
        label: "Правила применения рекомендательных технологий",
        href: LEGAL_LINKS.recommendationTechnologies,
      },
      { label: "Политика обработки персональных данных", href: LEGAL_LINKS.privacyPolicy },
      { label: "Согласие на обработку персональных данных", href: LEGAL_LINKS.personalDataConsent },
      { label: "Политика cookies", href: LEGAL_LINKS.cookiePolicy },
    ],
  },
  {
    id: "company",
    title: "Компания",
    description: "Реквизиты, контакты, поддержка и юридическая информация.",
    links: [
      { label: "Реквизиты", href: LEGAL_LINKS.requisites },
      { label: "Контакты", href: LEGAL_LINKS.contacts },
      { label: "Отказ от ответственности", href: LEGAL_LINKS.disclaimer },
    ],
  },
]

/** Карточки на странице /legal — 7 логических блоков */
export const LEGAL_INDEX_GROUPS: LegalIndexGroup[] = [
  {
    title: "Основные документы",
    items: [
      {
        title: "Пользовательское соглашение",
        description: "Основные правила использования сервиса, аккаунта и объявлений.",
        href: LEGAL_LINKS.userAgreement,
      },
      {
        title: "Политика обработки персональных данных",
        description: "Какие данные собираются, зачем и как защищаются.",
        href: LEGAL_LINKS.privacyPolicy,
      },
      {
        title: "Согласие на обработку персональных данных",
        description: "Форма согласия при регистрации и использовании сервиса.",
        href: LEGAL_LINKS.personalDataConsent,
      },
      {
        title: "Политика cookies",
        description: "Какие cookie используются и как ими управлять.",
        href: LEGAL_LINKS.cookiePolicy,
      },
    ],
  },
  {
    title: "Объявления",
    items: [
      {
        title: "Правила размещения объявлений",
        description: "Что можно и нельзя публиковать на площадке.",
        href: LEGAL_LINKS.listingRules,
      },
      {
        title: "Правила модерации",
        description: "Как сервис проверяет объявления и жалобы.",
        href: LEGAL_LINKS.moderation,
      },
      {
        title: "Правила безопасности сделок",
        description: "Рекомендации при общении и встрече с другими пользователями.",
        href: LEGAL_LINKS.safety,
      },
      {
        title: "Запрещённые товары и услуги",
        description: "Ограничения по категориям и запрещённому контенту.",
        href: `${LEGAL_LINKS.listingRules}#запрещённые-товары-и-услуги`,
      },
    ],
  },
  {
    title: "Отзывы и профиль",
    items: [
      {
        title: "Правила отзывов",
        description: "Когда можно оставить отзыв и что запрещено.",
        href: LEGAL_LINKS.reviews,
      },
      {
        title: "Правила модерации",
        description: "Проверка отзывов, жалоб и публичного профиля.",
        href: LEGAL_LINKS.moderation,
      },
      {
        title: "Пользовательское соглашение",
        description: "Права на профиль, сообщения и ответственность пользователя.",
        href: LEGAL_LINKS.userAgreement,
      },
    ],
  },
  {
    title: "Платные услуги",
    items: [
      {
        title: "Оферта на платное продвижение",
        description: "Условия оплаты поднятий, выделений и продвижения.",
        href: LEGAL_LINKS.promotionOffer,
      },
      {
        title: "Правила продвижения объявлений",
        description: "Как работают платные инструменты продвижения.",
        href: LEGAL_LINKS.promotionRules,
      },
      {
        title: "Тарифы",
        description: "Актуальные цены на продвижение и платные функции.",
        href: "/pricing",
        external: true,
      },
      {
        title: "Условия платных услуг (общая оферта)",
        description: "Общие условия платных функций сервиса.",
        href: LEGAL_LINKS.offer,
      },
    ],
  },
  {
    title: "Реклама",
    items: [
      {
        title: "Правила размещения рекламы",
        description: "Требования к баннерам, GIF, видео и модерации.",
        href: LEGAL_LINKS.advertisingRules,
      },
      {
        title: "Оферта на рекламные услуги",
        description: "Условия размещения рекламных кампаний.",
        href: LEGAL_LINKS.advertisingOffer,
      },
      {
        title: "Реклама на Нашло",
        description: "Как заказать рекламу и посмотреть форматы.",
        href: "/advertising",
        external: true,
      },
    ],
  },
  {
    title: "Бонусы",
    items: [
      {
        title: "Правила бонусной программы «Баллы Нашло»",
        description: "Начисление, списание и ограничения бонусных баллов.",
        href: LEGAL_LINKS.bonusRules,
      },
    ],
  },
  {
    title: "Защита данных и технологии",
    items: [
      {
        title: "Правила применения рекомендательных технологий",
        description:
          "Как Нашло подбирает объявления, категории и предложения, которые могут быть интересны пользователю.",
        href: LEGAL_LINKS.recommendationTechnologies,
      },
      {
        title: "Политика обработки персональных данных",
        description: "Какие данные собираются, зачем и как защищаются.",
        href: LEGAL_LINKS.privacyPolicy,
      },
      {
        title: "Политика cookies",
        description: "Какие cookie используются и как ими управлять.",
        href: LEGAL_LINKS.cookiePolicy,
      },
    ],
  },
  {
    title: "Компания",
    items: [
      {
        title: "Реквизиты",
        description: "Реквизиты владельца сервиса Нашло.",
        href: LEGAL_LINKS.requisites,
      },
      {
        title: "Контакты для обращений",
        description: "Поддержка, персональные данные и юридические вопросы.",
        href: LEGAL_LINKS.contacts,
      },
      {
        title: "Отказ от ответственности",
        description: "Ограничения ответственности сервиса перед пользователями.",
        href: LEGAL_LINKS.disclaimer,
      },
      {
        title: "О проекте",
        description: "Информация о сервисе Нашло.",
        href: "/about",
        external: true,
      },
    ],
  },
]

/** Порядок документов = порядок в sidebar и prev/next */
export const LEGAL_DOCUMENTS: LegalDocumentEntry[] = [
  {
    title: "Пользовательское соглашение",
    description: "Основные правила использования сервиса Нашло, аккаунта и объявлений",
    href: LEGAL_LINKS.userAgreement,
    category: "main",
    categoryLabel: LEGAL_CATEGORY_LABELS.main,
    keywords: ["аккаунт", "пользователь", "объявления", "сервис", "вход", "телефон", "vk", "яндекс"],
    searchText: "модерация сообщения отзывы бонусы реклама удаление аккаунта профиль",
    related: [LEGAL_LINKS.privacyPolicy, LEGAL_LINKS.listingRules, LEGAL_LINKS.disclaimer],
  },
  {
    title: "Политика обработки персональных данных",
    description: "Какие данные собираются, зачем и как защищаются",
    href: LEGAL_LINKS.privacyPolicy,
    category: "main",
    categoryLabel: LEGAL_CATEGORY_LABELS.main,
    keywords: ["персональные данные", "пдн", "privacy", "оператор", "152-фз", "удаление"],
    searchText: "cookies oauth vk яндекс ip сообщения рекомендации рекомендательные технологии",
    related: [LEGAL_LINKS.personalDataConsent, LEGAL_LINKS.cookiePolicy, LEGAL_LINKS.contacts],
  },
  {
    title: "Согласие на обработку персональных данных",
    description: "Форма согласия при регистрации и использовании сервиса",
    href: LEGAL_LINKS.personalDataConsent,
    category: "main",
    categoryLabel: LEGAL_CATEGORY_LABELS.main,
    keywords: ["согласие", "отзыв", "обработка", "пдн"],
    related: [LEGAL_LINKS.privacyPolicy, LEGAL_LINKS.userAgreement],
  },
  {
    title: "Политика cookies",
    description: "Какие cookie используются и как ими управлять",
    href: LEGAL_LINKS.cookiePolicy,
    category: "main",
    categoryLabel: LEGAL_CATEGORY_LABELS.main,
    keywords: ["cookies", "куки", "аналитика", "авторизация"],
    related: [LEGAL_LINKS.privacyPolicy, LEGAL_LINKS.personalDataConsent],
  },
  {
    title: "Правила применения рекомендательных технологий",
    description:
      "Как Нашло подбирает объявления, категории и предложения, которые могут быть интересны пользователю",
    href: LEGAL_LINKS.recommendationTechnologies,
    category: "privacyTech",
    categoryLabel: LEGAL_CATEGORY_LABELS.privacyTech,
    keywords: [
      "рекомендации",
      "рекомендательные технологии",
      "подбор",
      "персонализация",
      "лента",
      "поиск",
      "фильтры",
    ],
    searchText: "похожие объявления лента выдача история просмотров избранное",
    related: [
      LEGAL_LINKS.userAgreement,
      LEGAL_LINKS.privacyPolicy,
      LEGAL_LINKS.cookiePolicy,
      LEGAL_LINKS.listingRules,
      LEGAL_LINKS.promotionRules,
    ],
  },
  {
    title: "Отказ от ответственности",
    description: "Ограничения ответственности сервиса перед пользователями",
    href: LEGAL_LINKS.disclaimer,
    category: "main",
    categoryLabel: LEGAL_CATEGORY_LABELS.main,
    keywords: ["ответственность", "сделка", "гарантия"],
    related: [LEGAL_LINKS.userAgreement, LEGAL_LINKS.safety],
  },
  {
    title: "Правила размещения объявлений",
    description: "Что можно и нельзя публиковать на площадке",
    href: LEGAL_LINKS.listingRules,
    category: "listings",
    categoryLabel: LEGAL_CATEGORY_LABELS.listings,
    keywords: ["объявление", "фото", "цена", "запрет", "модерация"],
    related: [LEGAL_LINKS.moderation, LEGAL_LINKS.userAgreement],
  },
  {
    title: "Правила модерации",
    description: "Как сервис проверяет объявления, отзывы и рекламу",
    href: LEGAL_LINKS.moderation,
    category: "listings",
    categoryLabel: LEGAL_CATEGORY_LABELS.listings,
    keywords: ["модерация", "блокировка", "отклонение", "жалоба"],
    related: [LEGAL_LINKS.listingRules, LEGAL_LINKS.reviews],
  },
  {
    title: "Правила отзывов",
    description: "Когда можно оставить отзыв и что запрещено",
    href: LEGAL_LINKS.reviews,
    category: "reviews",
    categoryLabel: LEGAL_CATEGORY_LABELS.reviews,
    keywords: ["отзывы", "рейтинг", "накрутка", "сделка", "жалоба", "профиль"],
    related: [LEGAL_LINKS.moderation, LEGAL_LINKS.userAgreement],
  },
  {
    title: "Правила безопасности сделок",
    description: "Рекомендации при общении и встрече с другими пользователями",
    href: LEGAL_LINKS.safety,
    category: "listings",
    categoryLabel: LEGAL_CATEGORY_LABELS.listings,
    keywords: ["безопасность", "мошенничество", "сделка", "оплата"],
    related: [LEGAL_LINKS.disclaimer, LEGAL_LINKS.userAgreement],
  },
  {
    title: "Справка: договор купли-продажи",
    description: "Информационная памятка, не является юридической консультацией",
    href: LEGAL_LINKS.dkp,
    category: "listings",
    categoryLabel: LEGAL_CATEGORY_LABELS.listings,
    keywords: ["дкп", "договор", "купля", "продажа"],
    related: [LEGAL_LINKS.safety, LEGAL_LINKS.listingRules],
  },
  {
    title: "Правила продвижения объявлений",
    description: "Поднятие, выделение и продвижение за деньги или баллы",
    href: LEGAL_LINKS.promotionRules,
    category: "paid",
    categoryLabel: LEGAL_CATEGORY_LABELS.paid,
    keywords: ["продвижение", "поднятие", "выделение", "тариф"],
    related: [LEGAL_LINKS.promotionOffer, LEGAL_LINKS.bonusRules],
  },
  {
    title: "Оферта на платное продвижение",
    description: "Условия оплаты услуг продвижения объявлений",
    href: LEGAL_LINKS.promotionOffer,
    category: "paid",
    categoryLabel: LEGAL_CATEGORY_LABELS.paid,
    keywords: ["оферта", "оплата", "продвижение", "возврат"],
    related: [LEGAL_LINKS.promotionRules, LEGAL_LINKS.offer],
  },
  {
    title: "Правила бонусной программы «Баллы Нашло»",
    description: "Начисление и трата бонусных баллов",
    href: LEGAL_LINKS.bonusRules,
    category: "bonuses",
    categoryLabel: LEGAL_CATEGORY_LABELS.bonuses,
    keywords: ["бонусы", "баллы", "накрутка", "продвижение", "антифрод"],
    related: [LEGAL_LINKS.promotionRules, LEGAL_LINKS.userAgreement],
  },
  {
    title: "Условия платных услуг (общая оферта)",
    description: "Общие условия платных функций сервиса",
    href: LEGAL_LINKS.offer,
    category: "paid",
    categoryLabel: LEGAL_CATEGORY_LABELS.paid,
    keywords: ["оферта", "платные", "услуги", "тариф"],
    related: [LEGAL_LINKS.promotionOffer, LEGAL_LINKS.advertisingOffer],
  },
  {
    title: "Правила размещения рекламы",
    description: "Требования к рекламным материалам и модерации",
    href: LEGAL_LINKS.advertisingRules,
    category: "ads",
    categoryLabel: LEGAL_CATEGORY_LABELS.ads,
    keywords: ["реклама", "баннер", "gif", "видео", "модерация"],
    related: [LEGAL_LINKS.advertisingOffer, LEGAL_LINKS.userAgreement],
  },
  {
    title: "Оферта на рекламные услуги",
    description: "Условия размещения рекламных кампаний на Нашло",
    href: LEGAL_LINKS.advertisingOffer,
    category: "ads",
    categoryLabel: LEGAL_CATEGORY_LABELS.ads,
    keywords: ["реклама", "оферта", "кампания", "оплата", "cpm"],
    related: [LEGAL_LINKS.advertisingRules, LEGAL_LINKS.offer],
  },
  {
    title: "Реквизиты",
    description: "Реквизиты владельца сервиса Нашло",
    href: LEGAL_LINKS.requisites,
    category: "company",
    categoryLabel: LEGAL_CATEGORY_LABELS.company,
    keywords: ["инн", "огрнип", "ип", "банк", "реквизиты"],
    related: [LEGAL_LINKS.contacts, LEGAL_LINKS.offer],
  },
  {
    title: "Контакты для обращений",
    description: "Поддержка, персональные данные, реклама и юридические вопросы",
    href: LEGAL_LINKS.contacts,
    category: "company",
    categoryLabel: LEGAL_CATEGORY_LABELS.company,
    keywords: ["контакты", "поддержка", "email", "жалоба"],
    related: [LEGAL_LINKS.requisites, LEGAL_LINKS.privacyPolicy],
  },
]

export const LEGAL_POPULAR_SEARCHES = [
  { label: "оферта", query: "оферта" },
  { label: "оплата", query: "оплата" },
  { label: "возврат", query: "возврат" },
  { label: "продвижение", query: "продвижение" },
  { label: "реклама", query: "реклама" },
  { label: "бонусы", query: "бонусы" },
  { label: "отзывы", query: "отзывы" },
  { label: "персональные данные", query: "персональные" },
  { label: "cookies", query: "cookies" },
  { label: "модерация", query: "модерация" },
  { label: "рекомендации", query: "рекомендации" },
  { label: "удаление аккаунта", query: "удаление" },
] as const

export type LegalSearchHit = {
  doc: LegalDocumentEntry
  section?: { id: string; label: string }
}

export function getLegalDocumentByHref(href: string): LegalDocumentEntry | undefined {
  const normalized = href.split("#")[0]
  return LEGAL_DOCUMENTS.find((d) => d.href === normalized)
}

export function searchLegalDocuments(query: string): LegalSearchHit[] {
  const q = query.trim().toLowerCase()
  if (!q) return LEGAL_DOCUMENTS.map((doc) => ({ doc }))

  const hits: LegalSearchHit[] = []

  for (const doc of LEGAL_DOCUMENTS) {
    const haystack = [
      doc.title,
      doc.description,
      doc.categoryLabel,
      doc.keywords.join(" "),
      doc.searchText ?? "",
      ...getLegalDocumentSections(doc.href).map((s) => s.label),
    ]
      .join(" ")
      .toLowerCase()

    const keywordMatch = doc.keywords.some((k) => k.includes(q) || q.includes(k))
    if (haystack.includes(q) || keywordMatch) {
      hits.push({ doc })
      continue
    }

    const section = getLegalDocumentSections(doc.href).find((s) => s.label.toLowerCase().includes(q))
    if (section) hits.push({ doc, section })
  }

  return hits
}

export function getAdjacentLegalDocuments(href: string): {
  prev?: LegalDocumentEntry
  next?: LegalDocumentEntry
} {
  const idx = LEGAL_DOCUMENTS.findIndex((d) => d.href === href.split("#")[0])
  if (idx < 0) return {}
  return {
    prev: idx > 0 ? LEGAL_DOCUMENTS[idx - 1] : undefined,
    next: idx < LEGAL_DOCUMENTS.length - 1 ? LEGAL_DOCUMENTS[idx + 1] : undefined,
  }
}

export function getRelatedLegalDocuments(href: string, limit = 4): LegalDocumentEntry[] {
  const doc = getLegalDocumentByHref(href)
  if (!doc) return []

  const relatedHrefs = doc.related ?? []
  const fromMeta = relatedHrefs
    .map((h) => getLegalDocumentByHref(h))
    .filter((d): d is LegalDocumentEntry => Boolean(d))

  if (fromMeta.length >= limit) return fromMeta.slice(0, limit)

  const sameCategory = LEGAL_DOCUMENTS.filter(
    (d) => d.href !== href && d.category === doc.category && !fromMeta.some((r) => r.href === d.href)
  )

  return [...fromMeta, ...sameCategory].slice(0, limit)
}

export function groupLegalDocumentsByCategory(
  docs: LegalDocumentEntry[] = LEGAL_DOCUMENTS
): { category: LegalDocCategory; label: string; items: LegalDocumentEntry[] }[] {
  const order: LegalDocCategory[] = [
    "main",
    "privacyTech",
    "listings",
    "reviews",
    "paid",
    "bonuses",
    "ads",
    "company",
  ]
  return order
    .map((category) => ({
      category,
      label: LEGAL_CATEGORY_LABELS[category],
      items: docs.filter((d) => d.category === category),
    }))
    .filter((g) => g.items.length > 0)
}
