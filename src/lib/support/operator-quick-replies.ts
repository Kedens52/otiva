/** Категории быстрых ответов оператора (/admin/support) */

export type SupportQuickReplyCategoryId =
  | "listings"
  | "moderation"
  | "auth"
  | "payments"
  | "ads"
  | "bonuses"
  | "reviews"
  | "safety"
  | "fraud"
  | "tech"
  | "business"
  | "general"

export const SUPPORT_QUICK_REPLY_CATEGORIES: {
  id: SupportQuickReplyCategoryId
  label: string
}[] = [
  { id: "listings", label: "Объявления" },
  { id: "moderation", label: "Модерация" },
  { id: "auth", label: "Вход и регистрация" },
  { id: "payments", label: "Оплата и продвижение" },
  { id: "ads", label: "Реклама" },
  { id: "bonuses", label: "Баллы Нашло" },
  { id: "reviews", label: "Отзывы" },
  { id: "safety", label: "Безопасность" },
  { id: "fraud", label: "Мошенничество" },
  { id: "tech", label: "Технические проблемы" },
  { id: "business", label: "Бизнес-раздел" },
  { id: "general", label: "Общие ответы" },
]

export function quickReplyCategoryLabel(id: string): string {
  return SUPPORT_QUICK_REPLY_CATEGORIES.find((c) => c.id === id)?.label ?? id
}

export type QuickReplyVariableContext = {
  userName?: string | null
  listingTitle?: string | null
  listingUrl?: string | null
  ticketNumber?: string | null
  category?: string | null
  moderationReason?: string | null
  supportName?: string | null
  companyName?: string | null
  adCampaignName?: string | null
  businessListingTitle?: string | null
}

const VARIABLE_KEYS = [
  "userName",
  "listingTitle",
  "listingUrl",
  "ticketNumber",
  "category",
  "moderationReason",
  "supportName",
  "companyName",
  "adCampaignName",
  "businessListingTitle",
] as const

export function applyQuickReplyVariables(
  template: string,
  ctx: QuickReplyVariableContext,
): { text: string; missing: string[] } {
  const missing: string[] = []
  let text = template

  for (const key of VARIABLE_KEYS) {
    const raw = ctx[key]
    const value = raw == null || raw === "" ? "" : String(raw)
    if (template.includes(`{${key}}`) && !value) {
      missing.push(key)
    }
    text = text.replaceAll(`{${key}}`, value)
  }

  return { text, missing }
}

export type DefaultQuickReplySeed = {
  title: string
  category: SupportQuickReplyCategoryId
  body: string
  tags?: string[]
  isFavorite?: boolean
  sortOrder?: number
}

export const DEFAULT_OPERATOR_QUICK_REPLIES: DefaultQuickReplySeed[] = [
  {
    title: "Объявление не видно",
    category: "listings",
    body: "Проверили обращение. Объявление может не отображаться в поиске, если оно находится на модерации, скрыто, отклонено, архивировано или не прошло проверку. Сейчас уточним статус объявления «{listingTitle}» и вернёмся с ответом.",
    tags: ["поиск", "видимость"],
    isFavorite: true,
    sortOrder: 10,
  },
  {
    title: "На модерации",
    category: "moderation",
    body: "Здравствуйте, {userName}. Ваше объявление «{listingTitle}» находится на модерации. Обычно проверка занимает некоторое время. Если потребуется исправление, причина появится в кабинете.",
    sortOrder: 20,
  },
  {
    title: "Объявление отклонено",
    category: "moderation",
    body: "Объявление «{listingTitle}» было отклонено по правилам размещения. Причина: {moderationReason}. Проверьте данные в кабинете и отправьте на повторную проверку после исправления.",
    sortOrder: 30,
  },
  {
    title: "Не видно в поиске",
    category: "listings",
    body: "Объявление может появиться в поиске не сразу. На отображение влияют статус модерации, город, категория, фильтры и активность. Мы проверим статус «{listingTitle}» и подскажем, что нужно исправить.",
    tags: ["поиск"],
    sortOrder: 40,
  },
  {
    title: "Мошенничество",
    category: "fraud",
    body: "Спасибо за обращение. Мы передадим информацию на проверку. Сохраните переписку, данные пользователя и ссылку на объявление. Нашло не является стороной сделки, но может проверить аккаунт и ограничить нарушителя.",
    tags: ["безопасность"],
    isFavorite: true,
    sortOrder: 50,
  },
  {
    title: "Ошибка входа",
    category: "auth",
    body: "Похоже, проблема связана с авторизацией. Уточните, пожалуйста, каким способом вы входите: телефон, VK ID или Яндекс ID, и приложите скриншот ошибки.",
    sortOrder: 60,
  },
  {
    title: "Реклама",
    category: "ads",
    body: "Проверим рекламную кампанию «{adCampaignName}». Уточните, какой блок не работает, дату запуска и что отображается некорректно.",
    sortOrder: 70,
  },
  {
    title: "Баллы",
    category: "bonuses",
    body: "Проверим начисление баллов. Уточните, за какое действие вы ожидали начисление и когда оно было выполнено.",
    sortOrder: 80,
  },
  {
    title: "Отзывы",
    category: "reviews",
    body: "Проверим отзыв. Уточните ссылку на профиль или объявление, по которому был оставлен отзыв.",
    sortOrder: 90,
  },
  {
    title: "Общий ответ",
    category: "general",
    body: "Здравствуйте, {userName}. Спасибо за обращение №{ticketNumber}. Мы проверим информацию и вернёмся с ответом в этом чате.",
    isFavorite: true,
    sortOrder: 100,
  },
]

/** Подсказка категорий по теме тикета и последнему сообщению */
export function suggestQuickReplyCategories(input: {
  supportTopic?: string | null
  supportSubtopic?: string | null
  lastMessageText?: string | null
  hasListing?: boolean
  hasAd?: boolean
  hasBusiness?: boolean
}): SupportQuickReplyCategoryId[] {
  const suggested = new Set<SupportQuickReplyCategoryId>()
  const topic = `${input.supportTopic ?? ""} ${input.supportSubtopic ?? ""}`.toLowerCase()
  const text = (input.lastMessageText ?? "").toLowerCase()

  if (topic.includes("listing") || topic.includes("объяв") || input.hasListing) {
    suggested.add("listings")
    suggested.add("moderation")
  }
  if (topic.includes("moderation") || topic.includes("модерац") || topic.includes("отклон")) {
    suggested.add("moderation")
  }
  if (topic.includes("ads") || topic.includes("реклам") || input.hasAd) {
    suggested.add("ads")
  }
  if (topic.includes("bonus") || topic.includes("балл")) {
    suggested.add("bonuses")
  }
  if (topic.includes("review") || topic.includes("отзыв")) {
    suggested.add("reviews")
  }
  if (topic.includes("fraud") || topic.includes("мошен") || topic.includes("scam")) {
    suggested.add("fraud")
    suggested.add("safety")
  }
  if (topic.includes("auth") || topic.includes("вход") || topic.includes("регистр")) {
    suggested.add("auth")
  }
  if (topic.includes("promo") || topic.includes("продвиж") || topic.includes("оплат")) {
    suggested.add("payments")
  }
  if (input.hasBusiness || topic.includes("business") || topic.includes("бизнес")) {
    suggested.add("business")
  }

  if (/не\s*(выдает|выдаёт|видно|показыва)|нет\s+в\s+поиск|не\s+показыва/i.test(text)) {
    suggested.add("listings")
    suggested.add("moderation")
  }

  if (!suggested.size) suggested.add("general")
  return Array.from(suggested)
}
