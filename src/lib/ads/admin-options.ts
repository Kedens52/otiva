import { AdDevice, AdStatus, AdType } from "@prisma/client"
import { LISTING_CATEGORY_SLUGS } from "@/lib/filters"
import { NASHLO_CITIES_FOR_LISTING } from "@/lib/city-selection"

export {
  AD_PLACEMENT_OPTIONS,
  CAMPAIGN_PLACEMENT_GUIDE,
  CAMPAIGN_PLACEMENT_GROUPS,
  getCampaignPlacementGuide,
} from "@/lib/ads/placement-guide"

export const AD_TYPE_OPTIONS: { value: AdType; label: string }[] = [
  { value: "NATIVE_CARD", label: "Нативная карточка" },
  { value: "BANNER", label: "Баннер" },
  { value: "PROMOTED_LISTING", label: "Продвигаемое объявление" },
  { value: "SERVICE_CARD", label: "Карточка услуги" },
  { value: "SHOP_CARD", label: "Карточка магазина" },
  { value: "EXTERNAL_AD", label: "Внешняя реклама" },
]

export const AD_STATUS_OPTIONS: { value: AdStatus; label: string }[] = [
  { value: "DRAFT", label: "Черновик" },
  { value: "WAITING_PAYMENT", label: "Ожидает оплаты" },
  { value: "PENDING_REVIEW", label: "На модерации" },
  { value: "ACTIVE", label: "Активна" },
  { value: "PAUSED", label: "Пауза" },
  { value: "NEEDS_CHANGES", label: "Нужны правки" },
  { value: "REJECTED", label: "Отклонена" },
  { value: "FINISHED", label: "Завершена" },
  { value: "ARCHIVED", label: "В архиве" },
]

export const AD_DEVICE_OPTIONS: { value: AdDevice; label: string }[] = [
  { value: "ALL", label: "Все устройства" },
  { value: "MOBILE", label: "Мобильные" },
  { value: "DESKTOP", label: "Десктоп" },
  { value: "TABLET", label: "Планшеты" },
]

export const AD_CATEGORY_OPTIONS = Array.from(LISTING_CATEGORY_SLUGS).map((slug) => ({
  value: slug,
  label: slug,
}))

export const AD_CITY_OPTIONS = NASHLO_CITIES_FOR_LISTING.map((city) => ({
  value: city,
  label: city,
}))
