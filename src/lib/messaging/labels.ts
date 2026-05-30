const INQUIRY_LABELS: Record<string, string> = {
  PRICE_REQUEST: "Запрос прайса",
  COMMERCIAL_OFFER: "Коммерческое предложение",
  WHOLESALE_REQUEST: "Оптовый запрос",
  PARTNERSHIP: "Партнёрство",
  CALLBACK: "Обратный звонок",
}

const CONTEXT_LABELS: Record<string, string> = {
  BUSINESS_LISTING: "B2B-объявление",
  BUSINESS_REQUEST: "Заявка на закупку",
  BUSINESS_INQUIRY: "Запрос",
  DIRECT: "Прямое обращение",
  LISTING: "Объявление",
}

export function businessContextLabel(
  contextType: string,
  inquiryType?: string | null,
): string {
  if (contextType === "BUSINESS_INQUIRY" && inquiryType) {
    return INQUIRY_LABELS[inquiryType] ?? inquiryType
  }
  return CONTEXT_LABELS[contextType] ?? contextType
}
