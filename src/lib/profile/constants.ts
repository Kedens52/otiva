export const SELLER_ROLE_OPTIONS = [
  { value: "personal_items", label: "Продаю личные вещи" },
  { value: "services", label: "Оказываю услуги" },
  { value: "real_estate", label: "Собственник недвижимости" },
  { value: "specialist", label: "Частный специалист" },
  { value: "other", label: "Другое" },
] as const

export const EXPERIENCE_OPTIONS = [
  { value: "none", label: "Без опыта" },
  { value: "under_1y", label: "До 1 года" },
  { value: "1_3y", label: "1–3 года" },
  { value: "3_5y", label: "3–5 лет" },
  { value: "over_5y", label: "Более 5 лет" },
] as const

export const DELIVERY_OPTIONS = [
  { value: "pickup", label: "Самовывоз" },
  { value: "delivery", label: "Доставка" },
  { value: "meetup", label: "Встреча в городе" },
  { value: "online", label: "Онлайн" },
  { value: "by_agreement", label: "По договорённости" },
] as const

export const PROFILE_HEADLINE_EXAMPLES = [
  "Продаю личные вещи",
  "Частный мастер",
  "Автоподбор и диагностика",
  "Магазин техники",
  "Собственник недвижимости",
  "Дизайнер / специалист",
] as const
