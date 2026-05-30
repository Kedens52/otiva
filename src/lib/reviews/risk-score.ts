/**
 * Review Risk Score — базовая антифрод-защита.
 * Возвращает число от 0 до ~200.
 *
 * riskScore >= 60  → статус PENDING (на модерацию)
 * riskScore >= 100 → блокировать с ошибкой
 */

const FORBIDDEN_WORDS = [
  "реквизиты", "перевод", "карта", "сбербанк", "тинькофф",
  "whatsapp", "telegram", "viber", "вайбер", "телеграм",
  "http://", "https://", ".ru", ".com", ".net", ".org",
  "урод", "дура", "дебил", "сука", "убью", "шантаж",
  "кидал", "кидала", "лохотрон", "разводняк", "мошенник",
]

const EXTERNAL_LINK_RE = /https?:\/\/|www\.|\.ru[\s\/]|\.com[\s\/]/i
const PHONE_RE = /[\+7][- (]*\d{3}[- )]*\d{3}[- ]*\d{2}[- ]*\d{2}/

const TEMPLATE_TEXTS = [
  "всё отлично", "все отлично", "хорошо", "норм", "ок", "ok", "5 звезд",
  "отличный продавец", "рекомендую", "советую",
]

export type RiskContext = {
  text: string
  rating: number
  authorCreatedAt: Date
  authorHasAvatar: boolean
  authorHasPhone: boolean
  authorHasVerifiedPhone: boolean
  authorReviewsToday: number
  authorReviewsInHour: number
  /** Похожих текстов в предыдущих отзывах автора */
  similarTextCount: number
  /** Количество взаимных отзывов между автором и получателем */
  mutualReviewCount: number
  authorIp?: string | null
  targetUserIp?: string | null
}

export type RiskResult = {
  score: number
  reasons: string[]
  /** PUBLISHED | PENDING | REJECTED */
  recommendation: "PUBLISHED" | "PENDING" | "REJECTED"
}

export function calculateReviewRiskScore(ctx: RiskContext): RiskResult {
  let score = 0
  const reasons: string[] = []

  const now = new Date()
  const accountAgeMs = now.getTime() - ctx.authorCreatedAt.getTime()
  const accountAgeHours = accountAgeMs / (1000 * 60 * 60)

  // Новый аккаунт (< 1 часа)
  if (accountAgeHours < 1) {
    score += 40
    reasons.push("Аккаунт создан менее 1 часа назад")
  } else if (accountAgeHours < 24) {
    score += 15
    reasons.push("Аккаунт создан менее суток назад")
  }

  // Незаполненный профиль
  if (!ctx.authorHasAvatar && !ctx.authorHasPhone) {
    score += 30
    reasons.push("Профиль не заполнен: нет фото и телефона")
  } else if (!ctx.authorHasAvatar) {
    score += 10
    reasons.push("Нет фото профиля")
  }

  // Не верифицирован
  if (!ctx.authorHasVerifiedPhone) {
    score += 10
    reasons.push("Телефон не подтверждён")
  }

  // Слишком много отзывов за час
  if (ctx.authorReviewsInHour >= 3) {
    score += 30
    reasons.push(`Слишком много отзывов за час: ${ctx.authorReviewsInHour}`)
  }

  // Слишком много отзывов за день
  if (ctx.authorReviewsToday >= 10) {
    score += 30
    reasons.push(`Слишком много отзывов за день: ${ctx.authorReviewsToday}`)
  } else if (ctx.authorReviewsToday >= 5) {
    score += 15
    reasons.push(`Много отзывов за день: ${ctx.authorReviewsToday}`)
  }

  // Похожий текст — дубль отзывов
  if (ctx.similarTextCount >= 2) {
    score += 30
    reasons.push("Текст дублирует предыдущие отзывы автора")
  } else if (ctx.similarTextCount === 1) {
    score += 15
    reasons.push("Текст похож на предыдущий отзыв автора")
  }

  // Взаимные отзывы между одними и теми же пользователями
  if (ctx.mutualReviewCount >= 3) {
    score += 20
    reasons.push("Много взаимных отзывов между этими пользователями")
  }

  // Анализ текста
  const lowerText = ctx.text.toLowerCase()

  // Внешние ссылки
  if (EXTERNAL_LINK_RE.test(lowerText)) {
    score += 25
    reasons.push("Текст содержит внешние ссылки")
  }

  // Телефон в тексте
  if (PHONE_RE.test(ctx.text)) {
    score += 25
    reasons.push("Текст содержит номер телефона")
  }

  // Запрещённые слова
  const foundForbidden = FORBIDDEN_WORDS.filter((w) => lowerText.includes(w))
  if (foundForbidden.length > 0) {
    score += 50
    reasons.push(`Запрещённые слова: ${foundForbidden.slice(0, 3).join(", ")}`)
  }

  // Очень короткий шаблонный текст при плохих признаках
  const isTemplate = TEMPLATE_TEXTS.some((t) => lowerText.trim() === t) ||
    ctx.text.trim().length < 20
  if (isTemplate && score > 20) {
    score += 20
    reasons.push("Шаблонный или слишком короткий текст")
  }

  // Агрессивный текст при оценке 1
  if (ctx.rating === 1 && score > 30) {
    score += 10
    reasons.push("Низкая оценка + другие признаки")
  }

  // Совпадение IP автора и получателя (накрутка)
  if (
    ctx.authorIp &&
    ctx.targetUserIp &&
    ctx.authorIp === ctx.targetUserIp
  ) {
    score += 25
    reasons.push("Совпадение IP автора и получателя")
  }

  let recommendation: RiskResult["recommendation"]
  if (score >= 100) {
    recommendation = "REJECTED"
  } else if (score >= 60) {
    recommendation = "PENDING"
  } else {
    recommendation = "PUBLISHED"
  }

  return { score, reasons, recommendation }
}

/**
 * Проверить, является ли текст подозрительным быстрой проверкой
 * (без контекста пользователя — только текст).
 */
export function reviewTextRiskLevel(text: string): "ok" | "pending" | "reject" {
  const lower = text.toLowerCase()

  // Явно запрещённые слова
  const hasForbidden = FORBIDDEN_WORDS.some((w) => lower.includes(w))
  if (hasForbidden) return "reject"

  // Ссылки
  if (EXTERNAL_LINK_RE.test(lower)) return "pending"

  // Телефон
  if (PHONE_RE.test(text)) return "pending"

  return "ok"
}
