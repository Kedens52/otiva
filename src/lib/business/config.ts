/** Название подбренда */
export const BUSINESS_BRAND = "Нашло Бизнес"

export const BUSINESS_BASE_PATH = "/business"

/** Зарезервированные сегменты B2B (не отдаём SEO-категории marketplace) */
export const BUSINESS_RESERVED_SEGMENTS = new Set([
  "catalog",
  "listings",
  "create",
  "companies",
  "requests",
  "dashboard",
  "login",
  "register",
  "wholesale",
  "sell-business",
  "franchise",
  "equipment",
  "commercial-real-estate",
  "real-estate",
  "services",
  "api",
  "settings",
  "messages",
  "documents",
  "billing",
])

export type BusinessCategoryDef = {
  slug: string
  label: string
  href: string
  listingType: string
  description: string
}

export const BUSINESS_CATEGORIES: BusinessCategoryDef[] = [
  {
    slug: "wholesale",
    label: "Оптовые предложения",
    href: "/business/wholesale",
    listingType: "WHOLESALE_OFFER",
    description: "Партии, опт, поставки для розницы и маркетплейсов",
  },
  {
    slug: "supply",
    label: "Поставщики и производители",
    href: "/business/listings?type=SUPPLY",
    listingType: "SUPPLY",
    description: "Производители, дистрибьюторы, контрактное производство",
  },
  {
    slug: "equipment",
    label: "Оборудование",
    href: "/business/equipment",
    listingType: "EQUIPMENT",
    description: "Станки, торговое и складское оборудование",
  },
  {
    slug: "sell-business",
    label: "Продажа бизнеса",
    href: "/business/sell-business",
    listingType: "BUSINESS_FOR_SALE",
    description: "Готовый бизнес, доли, активы",
  },
  {
    slug: "franchise",
    label: "Франшизы",
    href: "/business/franchise",
    listingType: "FRANCHISE",
    description: "Паушальный взнос, поддержка, регионы",
  },
  {
    slug: "commercial-real-estate",
    label: "Коммерческая недвижимость",
    href: "/business/commercial-real-estate",
    listingType: "COMMERCIAL_REAL_ESTATE",
    description: "Офисы, склады, торговые помещения",
  },
  {
    slug: "services",
    label: "Услуги для бизнеса",
    href: "/business/services",
    listingType: "SERVICE_FOR_BUSINESS",
    description: "Логистика, IT, маркетинг, юриспруденция",
  },
  {
    slug: "requests",
    label: "Заявки на закупку",
    href: "/business/requests",
    listingType: "PROCUREMENT_REQUEST",
    description: "Ищу поставщика, тендер, запрос цены",
  },
]

export const COMPANY_TYPE_OPTIONS = [
  { value: "IP", label: "ИП" },
  { value: "LLC", label: "ООО / компания" },
  { value: "SELF_EMPLOYED", label: "Самозанятый" },
  { value: "COMPANY", label: "Другое юрлицо" },
  { value: "OTHER", label: "Другое" },
] as const

export const BUSINESS_ROLE_OPTIONS = [
  { value: "SUPPLIER", label: "Поставщик" },
  { value: "BUYER", label: "Закупщик" },
  { value: "MANUFACTURER", label: "Производитель" },
  { value: "DISTRIBUTOR", label: "Дистрибьютор" },
  { value: "WHOLESALER", label: "Оптовый продавец" },
  { value: "SERVICE_PROVIDER", label: "Услуги для бизнеса" },
  { value: "BUSINESS_SELLER", label: "Продаю бизнес" },
  { value: "BUSINESS_BUYER", label: "Покупаю бизнес" },
  { value: "FRANCHISOR", label: "Франшиза" },
  { value: "INVESTOR", label: "Инвестор" },
] as const

/** Лимиты до верификации компании */
export const B2B_LIMITS = {
  maxCompaniesPerUser: 2,
  maxListingsBeforeVerified: 3,
  maxListingsPerDay: 10,
  registerPerDay: 3,
} as const
