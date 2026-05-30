import { resolveMarketPriceGroup } from "@/lib/market-price/marketPriceConfig"
import type { MarketPriceGroupKey, MarketPriceStatus } from "@/lib/market-price/types"

export function getPriceWarning(
  status: MarketPriceStatus,
  categorySlug: string,
): { message: string; buyerHint: string | null; reasonsRequired: boolean } {
  const group = resolveMarketPriceGroup(categorySlug)

  if (status === "UNKNOWN") {
    return {
      message: "Недостаточно похожих объявлений для точной оценки цены.",
      buyerHint: null,
      reasonsRequired: false,
    }
  }

  if (status === "NORMAL") {
    return {
      message: "Цена выглядит близкой к рынку.",
      buyerHint: null,
      reasonsRequired: false,
    }
  }

  if (status === "LOW") {
    return {
      message:
        "Цена ниже средней по похожим объявлениям. Это может помочь быстрее найти покупателя, но проверьте, что описание достаточно полное.",
      buyerHint: buyerHintFor(group, "LOW"),
      reasonsRequired: false,
    }
  }

  if (status === "VERY_LOW") {
    return {
      message: sellerVeryLowMessage(group),
      buyerHint: buyerHintFor(group, "VERY_LOW"),
      reasonsRequired: true,
    }
  }

  if (status === "HIGH") {
    return {
      message:
        "Цена выше рынка по похожим объявлениям. Чтобы повысить доверие, добавьте больше фото, подробное описание и объясните преимущества.",
      buyerHint: null,
      reasonsRequired: false,
    }
  }

  return {
    message:
      "Цена значительно выше рынка. Объявление может получать меньше откликов. Проверьте цену или объясните, за счёт чего предложение дороже.",
    buyerHint: null,
    reasonsRequired: false,
  }
}

function sellerVeryLowMessage(group: MarketPriceGroupKey): string {
  switch (group) {
    case "transport":
      return "Цена сильно ниже рынка по похожим авто. Проверьте, указаны ли пробег, год, состояние, документы, ограничения, ДТП или другие важные детали."
    case "realEstate":
      return "Цена заметно ниже рынка по похожим объектам. Уточните район, состояние, документы, обременения, срочность продажи или аренды."
    case "electronics":
      return "Цена сильно ниже рынка. Покупатели могут подумать, что товар неисправен, заблокирован или продаётся без комплекта. Добавьте подробности."
    case "services":
      return "Цена ниже рынка. Уточните, что входит в стоимость, опыт, сроки и формат работы."
    default:
      return "Цена сильно ниже рынка. Покупатели могут насторожиться. Укажите причину: срочная продажа, состояние, дефекты, документы или особенности товара."
  }
}

function buyerHintFor(group: MarketPriceGroupKey, level: "LOW" | "VERY_LOW"): string | null {
  if (level === "LOW") {
    return "Цена ниже похожих предложений. Перед сделкой уточните условия и состояние."
  }
  switch (group) {
    case "transport":
      return "Цена заметно ниже похожих предложений. Перед сделкой проверьте товар, документы и условия. Для авто: документы, VIN, ограничения и состояние."
    case "realEstate":
      return "Цена заметно ниже похожих предложений. Перед сделкой проверьте документы, собственника и условия сделки."
    case "electronics":
      return "Цена заметно ниже похожих предложений. Проверьте работоспособность, комплект, блокировки и серийный номер."
    default:
      return "Цена заметно ниже похожих предложений. Перед сделкой проверьте товар, документы и условия."
  }
}

export const LOW_PRICE_REASONS: Record<string, { value: string; label: string }[]> = {
  default: [
    { value: "urgent", label: "Срочно продаю" },
    { value: "defects", label: "Есть дефекты" },
    { value: "repair", label: "Требуется ремонт" },
    { value: "incomplete", label: "Нет полного комплекта" },
    { value: "restrictions", label: "Есть ограничения" },
    { value: "other", label: "Другое" },
  ],
  transport: [
    { value: "urgent", label: "Срочно продаю" },
    { value: "defects", label: "Есть дефекты" },
    { value: "repair", label: "Требуется ремонт" },
    { value: "accident", label: "После ДТП" },
    { value: "restrictions", label: "Есть ограничения" },
    { value: "diagnostics", label: "Нужна диагностика" },
    { value: "other", label: "Другое" },
  ],
  "real-estate": [
    { value: "urgent", label: "Срочная продажа" },
    { value: "repair", label: "Требуется ремонт" },
    { value: "encumbrance", label: "Обременение" },
    { value: "floor", label: "Первый/последний этаж" },
    { value: "district", label: "Удалённый район" },
    { value: "documents", label: "Документы в процессе" },
    { value: "other", label: "Другое" },
  ],
  goods: [
    { value: "used", label: "Б/у состояние" },
    { value: "incomplete", label: "Нет комплекта" },
    { value: "defects", label: "Есть дефекты" },
    { value: "urgent", label: "Срочно" },
    { value: "no_warranty", label: "Без гарантии" },
    { value: "other", label: "Другое" },
  ],
}

export function lowPriceReasonsForCategory(categorySlug: string) {
  if (categorySlug === "cars") return LOW_PRICE_REASONS.transport
  if (categorySlug === "real-estate") return LOW_PRICE_REASONS["real-estate"]
  return LOW_PRICE_REASONS[categorySlug] ?? LOW_PRICE_REASONS.default
}
