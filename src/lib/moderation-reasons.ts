/** Предустановленные причины модерации (код + подписи для админки и подсказка продавцу). */
export const LISTING_MODERATION_REASONS = [
  { code: "WRONG_CATEGORY", label: "Неверная категория", hint: "Выберите подходящую категорию и подкатегорию." },
  { code: "SHORT_DESCRIPTION", label: "Слишком короткое описание", hint: "Добавьте подробное описание товара или услуги, условия и дефекты." },
  { code: "DUPLICATE_LISTING", label: "Дублирующее объявление", hint: "Удалите дубликаты или измените объявление так, чтобы оно не повторяло уже размещённое." },
  {
    code: "DUPLICATE_TEXT",
    label: "Повтор текста",
    hint: "Измените название и описание — такой же текст уже публиковался с вашего аккаунта.",
  },
  { code: "SUSPICIOUS_LINKS", label: "Подозрительные ссылки", hint: "Уберите внешние ссылки и контакты из текста — они допустимы только в предусмотренных полях." },
  { code: "PROHIBITED_ITEM", label: "Запрещённый товар или услуга", hint: "Проверьте правила размещения и удалите запрещённое." },
  { code: "STOLEN_PHOTOS", label: "Чужие фото", hint: "Загрузите только свои или разрешённые к использованию изображения." },
  { code: "SPAM", label: "Спам", hint: "Уберите повторы, лишние ключевые слова и навязчивую рекламу." },
  { code: "FRAUD_SUSPECT", label: "Подозрение на мошенничество", hint: "Укажите честные условия и реальные контакты через сервис." },
  { code: "INSUFFICIENT_INFO", label: "Недостаточно информации", hint: "Добавьте характеристики, состояние, комплектацию и способ передачи." },
  { code: "INCORRECT_PRICE", label: "Некорректная цена", hint: "Проверьте цену и валюту; при «цена договорная» опишите это в тексте." },
  {
    code: "LOW_PRICE_MARKET",
    label: "Подозрительно низкая цена",
    hint: "Цена заметно ниже рынка по похожим объявлениям. Укажите причину в описании или скорректируйте цену.",
  },
] as const

export type ModerationReasonCode = (typeof LISTING_MODERATION_REASONS)[number]["code"]

/** Старые коды в БД → актуальные записи каталога. */
const LEGACY_MODERATION_REASON_MAP: Record<string, ModerationReasonCode> = {
  DUPLICATE: "DUPLICATE_LISTING",
  FRAUD_SUSPICION: "FRAUD_SUSPECT",
  BAD_PRICE: "INCORRECT_PRICE",
}

export function moderationReasonByCode(code: string | null | undefined) {
  if (!code) return null
  const normalized = LEGACY_MODERATION_REASON_MAP[code] ?? code
  return LISTING_MODERATION_REASONS.find((r) => r.code === normalized) ?? null
}

export function formatModerationReasonForStorage(code: string, detail?: string): string {
  const row = moderationReasonByCode(code)
  const base = row?.label ?? code
  if (detail?.trim()) return `${base}: ${detail.trim()}`
  return base
}
