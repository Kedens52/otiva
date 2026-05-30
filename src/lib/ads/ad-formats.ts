import type { AdPlacement, AdType } from "@prisma/client"

export type AdFormatOption = {
  id: string
  label: string
  description: string
  type: AdType
  placements: AdPlacement[]
}

export const AD_FORMAT_OPTIONS: AdFormatOption[] = [
  {
    id: "native_feed",
    label: "Нативная карточка в ленте",
    description: "Карточка в общей ленте на главной и в разделах",
    type: "NATIVE_CARD",
    placements: ["MOBILE_FEED_INLINE", "DESKTOP_FEED_INLINE", "HOME_RECOMMENDATIONS"],
  },
  {
    id: "banner",
    label: "Баннер",
    description: "Горизонтальный баннер в ленте или сайдбаре",
    type: "BANNER",
    placements: ["SIDEBAR_DESKTOP", "DESKTOP_FEED_INLINE"],
  },
  {
    id: "service_card",
    label: "Карточка услуги",
    description: "Нативная карточка услуги в категории",
    type: "SERVICE_CARD",
    placements: ["CATEGORY_FEED_INLINE", "MOBILE_FEED_INLINE"],
  },
  {
    id: "shop_card",
    label: "Карточка компании",
    description: "Продвижение бренда или магазина",
    type: "SHOP_CARD",
    placements: ["SELLER_PROFILE", "HOME_RECOMMENDATIONS"],
  },
  {
    id: "external",
    label: "Внешняя ссылка",
    description: "Переход на внешний сайт (с пометкой «Реклама»)",
    type: "EXTERNAL_AD",
    placements: ["MOBILE_FEED_INLINE", "DESKTOP_FEED_INLINE"],
  },
  {
    id: "promoted_listing",
    label: "Внутреннее объявление",
    description: "Ссылка на объявление на Нашло",
    type: "PROMOTED_LISTING",
    placements: ["CATEGORY_FEED_INLINE", "SEARCH_FEED_INLINE", "HOME_RECOMMENDATIONS"],
  },
  {
    id: "category",
    label: "Реклама в категории",
    description: "Показ внутри выбранной категории",
    type: "NATIVE_CARD",
    placements: ["CATEGORY_FEED_INLINE"],
  },
  {
    id: "search",
    label: "Реклама в поиске",
    description: "Показ в результатах поиска",
    type: "NATIVE_CARD",
    placements: ["SEARCH_FEED_INLINE"],
  },
  {
    id: "listing_page",
    label: "Реклама на странице объявления",
    description: "Блоки на карточке объявления",
    type: "BANNER",
    placements: ["LISTING_PAGE_TOP", "LISTING_PAGE_MIDDLE", "LISTING_PAGE_BOTTOM"],
  },
  {
    id: "recommendations",
    label: "Реклама в рекомендациях",
    description: "Блок «Рекомендации для вас»",
    type: "NATIVE_CARD",
    placements: ["HOME_RECOMMENDATIONS"],
  },
  {
    id: "sidebar",
    label: "Сайдбар (десктоп)",
    description: "Боковой блок на широких экранах",
    type: "BANNER",
    placements: ["SIDEBAR_DESKTOP"],
  },
]

export function getFormatById(id: string): AdFormatOption | undefined {
  return AD_FORMAT_OPTIONS.find((f) => f.id === id)
}
