/**
 * Единые правила индексации объявлений (meta robots, sitemap).
 */

const NON_INDEXABLE_STATUSES = new Set([
  "DRAFT",
  "PENDING",
  "MODERATION",
  "REJECTED",
  "ARCHIVED",
  "DELETED",
  "SOLD",
  "VIN_CHECK_FAILED",
])

export type ListingIndexabilityInput = {
  status: string
  title?: string | null
  categoryId?: string | null
  categorySlug?: string | null
  city?: string | null
  description?: string | null
  attributes?: Record<string, unknown> | null
  noindex?: boolean | null
}

function hasMeaningfulContent(input: ListingIndexabilityInput): boolean {
  const desc = (input.description || "").replace(/\s+/g, " ").trim()
  if (desc.length >= 10) return true
  const attrs = input.attributes ?? {}
  return Object.keys(attrs).some((key) => {
    const v = attrs[key]
    if (v == null || v === "") return false
    if (Array.isArray(v) && v.length === 0) return false
    return true
  })
}

/** Объявление можно индексировать и добавлять в sitemap. */
export function isListingIndexable(input: ListingIndexabilityInput): boolean {
  if (input.noindex) return false
  if (input.status !== "ACTIVE") return false
  if (NON_INDEXABLE_STATUSES.has(input.status)) return false

  const title = (input.title || "").trim()
  if (title.length < 3) return false

  if (!input.categoryId && !input.categorySlug) return false

  const city = (input.city || "").trim()
  if (!city) return false

  return hasMeaningfulContent(input)
}

export function listingIndexBlockReason(input: ListingIndexabilityInput): string | null {
  if (isListingIndexable(input)) return null
  if (input.noindex) return "noindex flag"
  if (input.status !== "ACTIVE") return `status:${input.status}`
  const title = (input.title || "").trim()
  if (!title) return "missing title"
  if (title.length < 3) return "title:too_short"
  if (!input.categoryId && !input.categorySlug) return "missing category"
  if (!(input.city || "").trim()) return "missing city"
  if (!hasMeaningfulContent(input)) return "missing description or attributes"
  return "not indexable"
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Черновик",
  PENDING: "Ожидает",
  MODERATION: "На модерации",
  REJECTED: "Отклонено",
  ARCHIVED: "В архиве",
  DELETED: "Удалено",
  SOLD: "Продано",
  VIN_CHECK_FAILED: "Проверка VIN не пройдена",
  ACTIVE: "Активно",
}

const REASON_LABELS: Record<string, string> = {
  "noindex flag": "Запрет индексации (noindex)",
  "missing title": "Нет названия",
  "title:too_short": "Короткое название (меньше 3 символов)",
  "missing category": "Не указана категория",
  "missing city": "Не указан город",
  "missing description or attributes":
    "Мало контента: описание короче 10 символов и пустые характеристики",
  "not indexable": "Не проходит правила индексации",
}

/** Человекочитаемая причина для админки и отчётов. */
export function listingIndexBlockReasonLabel(reason: string | null): string {
  if (!reason) return "В sitemap"
  if (reason.startsWith("status:")) {
    const status = reason.slice("status:".length)
    const label = STATUS_LABELS[status] ?? status
    return `Статус: ${label}`
  }
  return REASON_LABELS[reason] ?? reason
}
