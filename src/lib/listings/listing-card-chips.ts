import {
  formatAttributeValue,
  getVisibleListingAttributes,
} from "@/lib/listings/format-listing-attributes"

function attr(
  attributes: Record<string, unknown>,
  ...keys: string[]
): unknown {
  for (const key of keys) {
    const value = attributes[key]
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return value
    }
  }
  return undefined
}

function pushChip(chips: string[], value: unknown, key: string) {
  if (value === null || value === undefined) return
  let text = formatAttributeValue(key, value).trim()
  if (key === "area" && text && !text.includes("м²")) {
    const n = Number(String(value).replace(",", "."))
    text = Number.isFinite(n) ? `${n.toLocaleString("ru-RU")} м²` : `${text} м²`
  }
  if (text) chips.push(text)
}

function isVinVerified(attributes: Record<string, unknown>) {
  const status = attributes.vinStatus ?? attributes.vin_status
  if (status === "VERIFIED" || status === "verified") return true
  return attributes.vin === "clean"
}

function hasTruthyFlag(value: unknown) {
  return value === true || value === "true" || value === "yes" || value === 1 || value === "1"
}

/** Короткие chips для карточки в сетке (только значения). */
export function getListingCardChips(
  attributes: Record<string, unknown> | null | undefined,
  category?: string | null,
  max = 4,
): string[] {
  if (!attributes || max <= 0) return []

  const chips: string[] = []

  if (category === "cars") {
    pushChip(chips, attr(attributes, "year"), "year")
    pushChip(chips, attr(attributes, "engineVolume", "engine_volume"), "engineVolume")
    pushChip(chips, attr(attributes, "power", "engine_power"), "power")
    pushChip(chips, attr(attributes, "transmission"), "transmission")
    if (isVinVerified(attributes)) chips.push("VIN проверен")
    return chips.slice(0, max)
  }

  if (category === "real-estate") {
    pushChip(chips, attr(attributes, "area"), "area")
    pushChip(chips, attr(attributes, "rooms"), "rooms")
    pushChip(chips, attr(attributes, "floor"), "floor")
    pushChip(chips, attr(attributes, "property_type"), "property_type")
    pushChip(chips, attr(attributes, "deal_type"), "deal_type")
    return chips.slice(0, max)
  }

  if (category === "electronics") {
    pushChip(chips, attr(attributes, "storage"), "storage")
    pushChip(chips, attr(attributes, "ram"), "ram")
    pushChip(chips, attr(attributes, "condition"), "condition")
    const warranty = attr(attributes, "warranty", "has_warranty")
    if (hasTruthyFlag(warranty)) {
      chips.push("Гарантия")
    } else if (warranty) {
      pushChip(chips, warranty, "warranty")
    }
    return chips.slice(0, max)
  }

  const fallback = getVisibleListingAttributes(attributes, category)
    .map((item) => item.value)
    .filter(Boolean)

  return fallback.slice(0, max)
}
