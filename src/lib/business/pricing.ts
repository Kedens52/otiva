export type WholesaleTier = { quantityFrom: number; price: number }

export const PRICE_UNIT_LABELS: Record<string, string> = {
  PIECE: "шт.",
  KG: "кг",
  LITER: "л",
  METER: "м",
  SQM: "м²",
  PACK: "уп.",
  BOX: "кор.",
  BATCH: "партия",
  HOUR: "час",
  SERVICE: "услуга",
  PROJECT: "проект",
}

export const PRICE_TYPE_LABELS: Record<string, string> = {
  FIXED: "фиксированная",
  FROM: "цена от",
  ON_REQUEST: "по запросу",
  NEGOTIABLE: "договорная",
  WHOLESALE: "оптовая",
  RETAIL_WHOLESALE: "розница + опт",
}

export function parseWholesaleTiers(raw: unknown): WholesaleTier[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((t): t is WholesaleTier => {
      if (!t || typeof t !== "object") return false
      const row = t as Record<string, unknown>
      return typeof row.quantityFrom === "number" && typeof row.price === "number"
    })
    .sort((a, b) => a.quantityFrom - b.quantityFrom)
}

export function formatBusinessPrice(input: {
  price: number
  priceFrom?: number | null
  priceTo?: number | null
  priceType?: string | null
  priceUnit?: string | null
  currency?: string
}): string {
  const currency = input.currency ?? "RUB"
  const unit = input.priceUnit ? ` / ${PRICE_UNIT_LABELS[input.priceUnit] ?? input.priceUnit}` : ""
  const fmt = (n: number) =>
    new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n)

  const type = input.priceType ?? "FIXED"
  if (type === "ON_REQUEST" || type === "NEGOTIABLE") {
    return type === "ON_REQUEST" ? "Цена по запросу" : "Договорная цена"
  }

  const from = input.priceFrom ?? (type === "FROM" ? input.price : null)
  const to = input.priceTo

  if (from != null && to != null && to > from) {
    return `${fmt(from)} – ${fmt(to)}${unit}`
  }
  if (from != null) {
    return `от ${fmt(from)}${unit}`
  }
  if (input.price > 0) {
    return `${fmt(input.price)}${unit}`
  }
  return "Цена по запросу"
}
