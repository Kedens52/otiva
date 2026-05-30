/** Короткие подписи для плашек категорий на главной объявлений. */
export const LISTING_CATEGORY_HINTS: Record<string, string> = {
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

export function getListingCategoryHint(slug: string): string | null {
  return LISTING_CATEGORY_HINTS[slug] ?? null
}
