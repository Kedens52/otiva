export type SupportAutoReply = {
  id: string
  category: string
  title: string
  keywords: string[]
  answer: string
  links?: { label: string; href: string }[]
  escalationRecommended?: boolean
}

export const SUPPORT_AUTO_REPLIES: SupportAutoReply[] = [
  {
    id:       "nashlo-not-party-to-deal",
    category: "marketplace",
    title:    "Nashlo участвует в сделке?",
    keywords: [
      "сделка", "гарантия", "продавец", "покупатель", "оплата", "перевод", "обман",
      "кто отвечает", "участвует", "посредник", "гарант",
    ],
    answer:
      "Nashlo — это площадка объявлений. Мы помогаем пользователям размещать объявления, находить предложения и связываться друг с другом. Nashlo не является продавцом, покупателем, исполнителем, заказчиком или стороной сделки. Пользователи самостоятельно договариваются об условиях, оплате и передаче товара или оказании услуги.",
    links: [{ label: "Пользовательское соглашение", href: "/legal/user-agreement" }],
    escalationRecommended: true,
  },
  {
    id:       "listing-rejected",
    category: "moderation",
    title:    "Почему отклонили объявление?",
    keywords: [
      "отклонили", "модерация", "удалили объявление", "не прошло проверку",
      "заблокировали объявление", "отклонено", "отклонение", "модератор",
    ],
    answer:
      "Объявление может быть отклонено, если оно нарушает правила размещения: неверная категория, недостоверное описание, чужие фото, дубли, запрещенные товары или услуги, спам или признаки мошенничества. Проверьте объявление и отправьте его повторно. Если вы считаете, что это ошибка, позовите оператора.",
    links: [
      { label: "Правила размещения", href: "/legal/listing-rules" },
      { label: "Правила модерации", href: "/legal/moderation" },
    ],
    escalationRecommended: true,
  },
  {
    id:       "free-listing-limit",
    category: "pricing",
    title:    "Сколько объявлений бесплатно?",
    keywords: [
      "бесплатно", "лимит", "сколько объявлений", "бесплатные объявления",
      "почему платно", "тариф", "размещение бесплатно",
    ],
    answer:
      "На старте Nashlo можно разместить первые объявления бесплатно в рамках лимита. Бесплатный лимит нужен, чтобы пользователи могли попробовать сервис. Если лимит закончился, можно выбрать тариф или подключить продвижение.",
    links: [
      { label: "Тарифы", href: "/pricing" },
      { label: "Правила размещения", href: "/legal/listing-rules" },
    ],
  },
  {
    id:       "what-you-pay-for",
    category: "payment",
    title:    "За что я плачу?",
    keywords: [
      "оплата", "тариф", "продвижение", "деньги", "платная услуга", "возврат",
      "списали", "платёж", "платеж", "купил услугу",
    ],
    answer:
      "Платные услуги Nashlo относятся только к техническим возможностям платформы: размещению, продвижению, выделению или дополнительному показу объявления. Оплата на Nashlo не является оплатой товара, услуги, автомобиля или недвижимости из объявления. Продвижение не гарантирует продажу или сделку.",
    links: [{ label: "Условия платных услуг", href: "/legal/offer" }],
    escalationRecommended: true,
  },
  {
    id:       "delete-account-data",
    category: "privacy",
    title:    "Как удалить аккаунт или данные?",
    keywords: [
      "удалить аккаунт", "удалить данные", "персональные данные", "отозвать согласие",
      "политика данных", "удаление профиля", "персональн",
    ],
    answer:
      "Вы можете запросить удаление или уточнение персональных данных через поддержку. После запроса оператор проверит аккаунт и подскажет дальнейшие действия.",
    links: [
      { label: "Политика обработки персональных данных", href: "/legal/privacy-policy" },
      { label: "Согласие на обработку персональных данных", href: "/legal/personal-data-consent" },
    ],
    escalationRecommended: true,
  },
  {
    id:       "oauth-vk-yandex",
    category: "oauth",
    title:    "Не работает вход через VK или Яндекс",
    keywords: [
      "вк", "vk", "яндекс", "yandex", "не вошел", "не вошёл", "не передались данные",
      "аватар", "почта", "профиль", "oauth", "авторизац",
    ],
    answer:
      "Если вход через VK или Яндекс прошёл, но имя, почта или аватар не появились в профиле, попробуйте выйти и войти повторно. Если данные не обновились, позовите оператора — мы проверим связь аккаунта.",
    escalationRecommended: true,
  },
  {
    id:       "fraud-scam",
    category: "safety",
    title:    "Что делать, если меня обманули?",
    keywords: [
      "обман", "мошенник", "перевел деньги", "перевёл деньги", "кинули",
      "не отправил товар", "жалоба", "предоплата", "скам", "развод",
    ],
    answer:
      "Сохраните переписку, ссылку на объявление, данные пользователя и детали оплаты. Отправьте жалобу в поддержку. Nashlo не является стороной сделки, но может проверить аккаунт, ограничить нарушителя и принять меры внутри сервиса. При признаках мошенничества также обратитесь в правоохранительные органы.",
    links: [{ label: "Пользовательское соглашение", href: "/legal/user-agreement" }],
    escalationRecommended: true,
  },
  {
    id:       "report-listing",
    category: "reports",
    title:    "Как пожаловаться на объявление?",
    keywords: [
      "пожаловаться", "жалоба", "нарушение", "плохое объявление", "фейк", "спам",
      "сообщить о нарушении",
    ],
    answer:
      "Если объявление нарушает правила, содержит недостоверную информацию, спам, чужие фото или признаки мошенничества, отправьте жалобу. Мы проверим обращение и при необходимости ограничим объявление или пользователя внутри сервиса.",
    links: [
      { label: "Правила размещения", href: "/legal/listing-rules" },
      { label: "Правила модерации", href: "/legal/moderation" },
    ],
    escalationRecommended: true,
  },
  {
    id: "moderation-reason-codes",
    category: "moderation",
    title: "Коды причин модерации объявления",
    keywords: [
      "WRONG_CATEGORY",
      "SHORT_DESCRIPTION",
      "DUPLICATE_LISTING",
      "SUSPICIOUS_LINKS",
      "PROHIBITED_ITEM",
      "STOLEN_PHOTOS",
      "SPAM",
      "FRAUD_SUSPECT",
      "INSUFFICIENT_INFO",
      "INCORRECT_PRICE",
      "код причины",
      "почему отклонили",
      "неверная категория",
      "короткое описание",
      "дубликат",
      "подозрительные ссылки",
    ],
    answer:
      "В личном кабинете рядом с объявлением показываются формулировка и подсказка, что исправить. Типичные коды: неверная категория, короткое описание, дубль, подозрительные ссылки, запрещённый товар, чужие фото, спам, подозрение на мошенничество, мало данных, некорректная цена. После правок отправьте объявление снова; при ошибке модерации можно оспорить решение из «Моих объявлений».",
    links: [
      { label: "Правила модерации", href: "/legal/moderation" },
      { label: "Мои объявления", href: "/my-listings" },
    ],
    escalationRecommended: true,
  },
]

const TEASER_BY_CATEGORY: Record<string, string> = {
  marketplace: "Похоже, вопрос о роли Nashlo в сделках и сервисе.",
  moderation:  "Похоже, это связано с модерацией объявления.",
  pricing:     "Похоже, вопрос о бесплатном размещении и лимитах.",
  payment:     "Похоже, вопрос об оплате услуг платформы.",
  privacy:     "Похоже, вопрос об аккаунте и персональных данных.",
  oauth:       "Похоже, вопрос о входе через VK или Яндекс.",
  safety:      "Похоже, вопрос о безопасности сделки или мошенничестве.",
  reports:     "Похоже, вопрос о жалобе на объявление.",
}

export function supportTeaserForCategory(category: string): string {
  return TEASER_BY_CATEGORY[category] ?? "Похоже, это относится к вашему вопросу."
}

function scoreReply(textNorm: string, reply: SupportAutoReply): number {
  let score = 0
  for (const kw of reply.keywords) {
    const k = kw.toLowerCase().trim()
    if (!k) continue
    if (textNorm.includes(k)) score += 1
  }
  return score
}

/**
 * Простой подбор автоответа по ключевым словам (без внешних API).
 * При равном счёте выбирается первый в каталоге с максимальным счётом.
 */
export function findAutoReply(message: string): SupportAutoReply | null {
  const textNorm = message.toLowerCase().trim()
  if (!textNorm) return null

  let best: SupportAutoReply | null = null
  let bestScore = 0

  for (const reply of SUPPORT_AUTO_REPLIES) {
    const s = scoreReply(textNorm, reply)
    if (s > bestScore) {
      bestScore = s
      best = reply
    }
  }

  return bestScore > 0 ? best : null
}
