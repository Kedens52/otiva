export type SupportTopicNode = {
  id: string
  label: string
  children?: SupportTopicNode[]
  needsListing?: boolean
  needsAd?: boolean
  issueOptions?: { id: string; label: string }[]
}

/** Корневые темы и подтемы поддержки */
export const SUPPORT_TOPIC_TREE: SupportTopicNode[] = [
  {
    id: "listings",
    label: "Объявления",
    children: [
      {
        id: "my_listing",
        label: "Моё объявление",
        needsListing: true,
        children: [
          { id: "listing_blocked", label: "Заблокировано", needsListing: true },
          { id: "listing_settings", label: "Настройки и услуги", needsListing: true },
          { id: "listing_paid", label: "Платные услуги", needsListing: true },
          {
            id: "listing_search",
            label: "Объявление в поиске",
            needsListing: true,
            issueOptions: [
              { id: "not_in_search", label: "Не видно в поиске" },
              { id: "not_in_category", label: "Не видно в категории" },
              { id: "no_views", label: "Нет просмотров" },
              { id: "wrong_city", label: "Показывается не в том городе" },
              { id: "other", label: "Другое" },
            ],
          },
          { id: "listing_publish", label: "Разместить и скрыть", needsListing: true },
        ],
      },
      { id: "seller_listing", label: "Объявление продавца" },
      { id: "listing_moderation", label: "На модерации / отклонено" },
      { id: "listing_report", label: "Пожаловаться на объявление" },
    ],
  },
  {
    id: "promotion",
    label: "Продвижение",
    issueOptions: [
      { id: "promo_not_applied", label: "Услуга не применилась" },
      { id: "promo_payment", label: "Оплата / списание" },
      { id: "promo_no_effect", label: "Нет эффекта от продвижения" },
      { id: "promo_other", label: "Другое" },
    ],
  },
  {
    id: "ads",
    label: "Реклама",
    needsAd: true,
    children: [
      { id: "ads_not_showing", label: "Не показывается реклама", needsAd: true },
      { id: "ads_moderation", label: "Не проходит модерацию", needsAd: true },
      { id: "ads_upload", label: "Не могу загрузить картинку/GIF/видео" },
      { id: "ads_stats", label: "Нужна статистика", needsAd: true },
      { id: "ads_payment", label: "Не списались / списались деньги", needsAd: true },
      { id: "ads_targeting", label: "Настройка аудитории", needsAd: true },
    ],
  },
  {
    id: "bonuses",
    label: "Баллы Нашло",
    issueOptions: [
      { id: "bonus_not_earned", label: "Не начислились баллы" },
      { id: "bonus_cant_spend", label: "Не могу потратить баллы" },
      { id: "bonus_spent", label: "Списались баллы" },
      { id: "bonus_how", label: "Как получить баллы" },
      { id: "bonus_social", label: "Бонусы за ВК / МАХ" },
    ],
  },
  {
    id: "profile_reviews",
    label: "Профиль и отзывы",
    children: [
      { id: "review_leave", label: "Не могу оставить отзыв" },
      { id: "review_hidden", label: "Отзыв не отображается" },
      { id: "review_report", label: "Пожаловаться на отзыв" },
      { id: "review_reply", label: "Ответить на отзыв" },
      { id: "review_rating", label: "Рейтинг не обновился" },
    ],
  },
  {
    id: "auth",
    label: "Вход и регистрация",
    children: [
      { id: "auth_phone", label: "Вход по телефону" },
      { id: "auth_vk", label: "VK ID" },
      { id: "auth_yandex", label: "Яндекс ID" },
      { id: "auth_code", label: "Не приходит код" },
      { id: "auth_cant_login", label: "Не могу войти" },
      { id: "auth_blocked", label: "Аккаунт заблокирован" },
    ],
  },
  { id: "messages", label: "Сообщения и чат" },
  { id: "safety", label: "Безопасность и нарушения" },
  {
    id: "payments",
    label: "Деньги и оплата",
    issueOptions: [
      { id: "pay_promotion", label: "Оплата продвижения" },
      { id: "pay_ads", label: "Оплата рекламы" },
      { id: "pay_refund", label: "Возврат" },
      { id: "pay_other", label: "Другое" },
    ],
  },
  { id: "other", label: "Другое" },
]

export const CLARIFY_OPTIONS = [
  { id: "clarify:listing_search", label: "Объявление в поиске", topicId: "listings", subtopicId: "listing_search" },
  { id: "clarify:ads", label: "Рекламу", topicId: "ads" },
  { id: "clarify:bonuses", label: "Баллы", topicId: "bonuses" },
  { id: "clarify:messages", label: "Сообщения", topicId: "messages" },
  { id: "clarify:reviews", label: "Отзывы", topicId: "profile_reviews" },
  { id: "clarify:auth", label: "Вход в аккаунт", topicId: "auth" },
  { id: "clarify:other", label: "Другое", topicId: "other" },
] as const

function walk(nodes: SupportTopicNode[], fn: (n: SupportTopicNode, path: SupportTopicNode[]) => void, path: SupportTopicNode[] = []) {
  for (const n of nodes) {
    const next = [...path, n]
    fn(n, next)
    if (n.children) walk(n.children, fn, next)
  }
}

export function findTopicNode(id: string): { node: SupportTopicNode; path: SupportTopicNode[] } | null {
  let found: { node: SupportTopicNode; path: SupportTopicNode[] } | null = null
  walk(SUPPORT_TOPIC_TREE, (node, path) => {
    if (node.id === id && !found) found = { node, path }
  })
  return found
}

export function topicBreadcrumbLabels(topicId?: string, subtopicId?: string): string[] {
  const labels: string[] = []
  if (topicId) {
    const t = findTopicNode(topicId)
    if (t) labels.push(t.node.label)
  }
  if (subtopicId && subtopicId !== topicId) {
    const s = findTopicNode(subtopicId)
    if (s) labels.push(s.node.label)
  }
  return labels
}
