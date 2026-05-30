/** Базовые SEO-ключевые фразы для витринных категорий (/category/...). */
export function getCategorySeoKeywords(
  categorySlug: string,
  label: string,
  segmentLabel?: string,
): string[] {
  const lower = label.toLowerCase()
  const base = [
    "объявления",
    "купить",
    "продать",
    lower,
    `объявления ${lower}`,
    `купить ${lower}`,
    "nashlo",
    "нашло",
  ]

  if (segmentLabel) {
    const seg = segmentLabel.toLowerCase()
    base.push(seg, `объявления ${seg}`, `${seg} ${lower}`)
  }

  const bySlug: Record<string, string[]> = {
    animals: ["животные", "питомцы", "кошки", "собаки", "корм для животных"],
    "home-and-garden": ["для дома", "мебель", "бытовая техника", "сад"],
    "personal-items": ["одежда", "обувь", "личные вещи"],
    hobby: ["хобби", "спорт", "туризм", "коллекционирование"],
    jobs: ["работа", "вакансии", "подработка"],
    parts: ["запчасти", "автозапчасти", "шины", "диски"],
    goods: ["товары", "барахолка", "куплю продам"],
    free: ["отдам даром", "бесплатно", "даром"],
    transport: ["авто", "машины", "транспорт"],
    "real-estate": ["недвижимость", "квартира", "аренда"],
    services: ["услуги", "мастер", "ремонт"],
    electronics: ["электроника", "телефоны", "ноутбуки"],
    business: ["бизнес", "франшиза", "продажа бизнеса"],
  }

  return [...new Set([...base, ...(bySlug[categorySlug] ?? [])])]
}
