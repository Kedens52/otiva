import type { WantToBuyCardItem } from "@/lib/want-to-buy/client-types"
import { wantToBuyConditionLabel } from "@/lib/want-to-buy/labels"

export type WantToBuyDetailChip = {
  label: string
  value: string
}

const YEAR_RE = /\b(19|20)\d{2}\b/
const MILEAGE_RE = /(\d[\d\s]*)\s*(км|km)/i
const AREA_RE = /(\d+([.,]\d+)?)\s*(м²|м2|кв\.?\s*м)/i
const ROOMS_RE = /(\d+)[\s-]*(комн|к\.?)/i
const RAM_RE = /(\d+)\s*(гб|gb)\s*(озу|ram|памят)/i
const STORAGE_RE = /(\d+)\s*(гб|gb|тб|tb)\s*(памят|storage|ssd|накоп)/i

function pickFirst(text: string, re: RegExp, label: string): WantToBuyDetailChip | null {
  const m = text.match(re)
  if (!m) return null
  return { label, value: m[0].replace(/\s+/g, " ").trim() }
}

function excerpt(text: string, max = 72): string {
  const clean = text.replace(/\s+/g, " ").trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max - 1)}…`
}

/** Короткие подписи для плашек категорий на главной «Куплю». */
export const WANT_TO_BUY_CATEGORY_HINTS: Record<string, string> = {
  electronics: "Телефоны, ноутбуки, техника",
  cars: "Авто, мото, спецтехника",
  parts: "Запчасти и расходники",
  "real-estate": "Квартиры, дома, участки",
  home: "Мебель, техника для дома",
  fashion: "Одежда и обувь",
  kids: "Для детей и школы",
  sport: "Спорт и отдых",
  animals: "Питомцы и товары",
  hobby: "Хобби и коллекции",
  services: "Услуги и мастера",
  jobs: "Работа и вакансии",
  goods: "Товары и вещи",
  business: "Опт и оборудование",
  free: "Бесплатно",
  other: "Другое",
}

export function getWantToBuyCategoryHint(slug: string): string | null {
  return WANT_TO_BUY_CATEGORY_HINTS[slug] ?? null
}

/** Детали на карточке заявки — зависят от категории. */
export function getWantToBuyCategoryDetails(item: WantToBuyCardItem): WantToBuyDetailChip[] {
  const text = `${item.title} ${item.description}`
  const chips: WantToBuyDetailChip[] = []
  const slug = item.category.slug

  if (item.condition !== "ANY") {
    chips.push({ label: "Состояние", value: wantToBuyConditionLabel(item.condition) })
  }

  switch (slug) {
    case "cars": {
      const year = pickFirst(text, YEAR_RE, "Год")
      const mileage = pickFirst(text, MILEAGE_RE, "Пробег")
      if (year) chips.push(year)
      if (mileage) chips.push(mileage)
      break
    }
    case "parts": {
      if (item.title.length > 3) {
        chips.push({ label: "Запчасть", value: excerpt(item.title, 48) })
      }
      break
    }
    case "real-estate": {
      const rooms = pickFirst(text, ROOMS_RE, "Комнаты")
      const area = pickFirst(text, AREA_RE, "Площадь")
      if (rooms) chips.push(rooms)
      if (area) chips.push(area)
      break
    }
    case "electronics": {
      const ram = pickFirst(text, RAM_RE, "Память")
      const storage = pickFirst(text, STORAGE_RE, "Накопитель")
      if (ram) chips.push(ram)
      else if (storage) chips.push(storage)
      else if (item.title.length > 3) {
        chips.push({ label: "Модель", value: excerpt(item.title, 48) })
      }
      break
    }
    case "fashion":
    case "kids":
      if (item.title.length > 3) {
        chips.push({ label: "Ищу", value: excerpt(item.title, 48) })
      }
      break
    case "services":
    case "jobs":
      chips.push({ label: "Запрос", value: excerpt(item.title, 56) })
      break
    default:
      if (item.description.trim()) {
        chips.push({ label: "Подробнее", value: excerpt(item.description, 56) })
      } else if (item.title.length > 3) {
        chips.push({ label: "Товар", value: excerpt(item.title, 48) })
      }
  }

  if (item.city) {
    chips.push({ label: "Город", value: item.city })
  }

  return chips.slice(0, 4)
}

export function formatWantToBuyOfferCount(count: number): string {
  if (count === 0) return "Ждёт предложений"
  if (count === 1) return "1 предложение"
  if (count >= 2 && count <= 4) return `${count} предложения`
  return `${count} предложений`
}
