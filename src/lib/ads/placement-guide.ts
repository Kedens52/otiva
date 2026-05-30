import type { AdPlacement } from "@prisma/client"
import type { AdSlotId } from "@/lib/ad-store"

export type AdsAdminTab = "banners" | "campaigns"

export type PlacementZone =
  | "site_strip"
  | "homepage_banner"
  | "homepage_sidebar"
  | "feed_inline"
  | "listing_page"
  | "profile_search"
  | "system"

export type PlacementGuideEntry = {
  id: string
  zone: PlacementZone
  zoneLabel: string
  title: string
  pages: string
  where: string
  format: string
  size?: string
  adminTab: AdsAdminTab | "none"
  adminHint: string
}

export const PLACEMENT_ZONE_LABELS: Record<PlacementZone, string> = {
  site_strip: "Полоса над шапкой",
  homepage_banner: "Главная — баннеры",
  homepage_sidebar: "Главная — сайдбар",
  feed_inline: "В ленте объявлений",
  listing_page: "Карточка объявления",
  profile_search: "Поиск и профиль",
  system: "Системное (без админки)",
}

/** Слоты баннеров — вкладка «Баннеры и слоты». */
export const BANNER_SLOT_GUIDE: Record<
  AdSlotId | "siteBanner",
  PlacementGuideEntry & { slotId?: AdSlotId }
> = {
  siteBanner: {
    id: "siteBanner",
    zone: "site_strip",
    zoneLabel: PLACEMENT_ZONE_LABELS.site_strip,
    title: "Полоса над шапкой",
    pages: "Все страницы сайта (кроме /admin, /business)",
    where: "Тонкая полоска над логотипом: текст с градиентом или баннер-картинка на всю ширину",
    format: "Текст + ссылка, либо картинка 1200×48 (режим «баннер-картинка»). Без пометки «Реклама» в углу",
    size: "1200 × 48 px (полоса)",
    adminTab: "banners",
    adminHint: "Раздел 1 → «Полоса над шапкой»",
  },
  mobileLeaderboard: {
    id: "mobileLeaderboard",
    slotId: "mobileLeaderboard",
    zone: "homepage_banner",
    zoneLabel: PLACEMENT_ZONE_LABELS.homepage_banner,
    title: "Баннер на главной (мобильный)",
    pages: "Главная /",
    where: "Между блоком «Для бизнеса» и секцией «Рекомендации для вас» — только телефон",
    format: "Широкая полоса или картинка",
    size: "375 × 78 px",
    adminTab: "banners",
    adminHint: "Слот «Баннер — мобильная главная»",
  },
  leaderboard: {
    id: "leaderboard",
    slotId: "leaderboard",
    zone: "homepage_banner",
    zoneLabel: PLACEMENT_ZONE_LABELS.homepage_banner,
    title: "Лидерборд на главной (десктоп)",
    pages: "Главная /",
    where: "То же место, что мобильный баннер, но только на экранах lg+",
    format: "Горизонтальный баннер",
    size: "728 × 90 px",
    adminTab: "banners",
    adminHint: "Слот «Лидерборд — десктоп»",
  },
  sidebarTop: {
    id: "sidebarTop",
    slotId: "sidebarTop",
    zone: "homepage_sidebar",
    zoneLabel: PLACEMENT_ZONE_LABELS.homepage_sidebar,
    title: "Сайдбар — верх",
    pages: "Главная /",
    where: "Правая колонка, первый рекламный блок (только десктоп)",
    format: "Прямоугольный баннер",
    size: "300 × 250 px (колонка 260px)",
    adminTab: "banners",
    adminHint: "Слот «Сайдбар — верх»",
  },
  sidebarTall: {
    id: "sidebarTall",
    slotId: "sidebarTall",
    zone: "homepage_sidebar",
    zoneLabel: PLACEMENT_ZONE_LABELS.homepage_sidebar,
    title: "Сайдбар — высокий",
    pages: "Главная /",
    where: "Правая колонка под верхним баннером (только десктоп)",
    format: "Вертикальный баннер",
    size: "300 × 600 px (колонка 260px)",
    adminTab: "banners",
    adminHint: "Слот «Сайдбар — высокий»",
  },
  listingSidebar: {
    id: "listingSidebar",
    slotId: "listingSidebar",
    zone: "listing_page",
    zoneLabel: PLACEMENT_ZONE_LABELS.listing_page,
    title: "Карточка объявления — баннер под сайдбаром",
    pages: "Страница объявления /listings/[id]",
    where: "Правая колонка под ценой и кнопками; блок фиксируется при прокрутке (lg+)",
    format: "Компактный баннер или картинка; пометка «Реклама» или «Партнёр сервиса»",
    size: "280 × 100 px",
    adminTab: "banners",
    adminHint: "Слот «Карточка объявления — под сайдбаром»",
  },
}

export type CampaignPlacementOption = {
  value: AdPlacement
  label: string
  group: "homepage" | "feed" | "listing" | "profile"
  groupLabel: string
  pages: string
  where: string
  format: string
}

export const CAMPAIGN_PLACEMENT_GUIDE: CampaignPlacementOption[] = [
  {
    value: "HOME_RECOMMENDATIONS",
    label: "Главная — рекомендации",
    group: "homepage",
    groupLabel: "Главная",
    pages: "/",
    where: "Внутри сетки «Рекомендации для вас» — карточка между объявлениями",
    format: "Нативная карточка как объявление, пометка «Реклама» в углу",
  },
  {
    value: "MOBILE_FEED_INLINE",
    label: "Главная — свежие (моб.)",
    group: "homepage",
    groupLabel: "Главная",
    pages: "/",
    where: "Сетка «Свежие объявления» — каждые N карточек",
    format: "Нативная карточка, пометка «Реклама» или «Партнёр сервиса» в углу",
  },
  {
    value: "DESKTOP_FEED_INLINE",
    label: "Лента (десктоп)",
    group: "feed",
    groupLabel: "Ленты и каталог",
    pages: "Категории, поиск",
    where: "Сетка объявлений на широком экране — между карточками",
    format: "Нативная карточка, пометка «Реклама» или «Партнёр сервиса» в углу",
  },
  {
    value: "CATEGORY_FEED_INLINE",
    label: "Категория",
    group: "feed",
    groupLabel: "Ленты и каталог",
    pages: "/cars, /electronics, …",
    where: "Страница категории — в списке объявлений",
    format: "Нативная карточка, пометка «Реклама» или «Партнёр сервиса» в углу",
  },
  {
    value: "SEARCH_FEED_INLINE",
    label: "Поиск",
    group: "feed",
    groupLabel: "Ленты и каталог",
    pages: "/search",
    where: "Результаты поиска — между объявлениями",
    format: "Нативная карточка, пометка «Реклама» или «Партнёр сервиса» в углу",
  },
  {
    value: "SIDEBAR_DESKTOP",
    label: "Сайдбар ленты",
    group: "feed",
    groupLabel: "Ленты и каталог",
    pages: "Категории (если подключено)",
    where: "Боковая колонка на страницах с фильтрами (десктоп)",
    format: "Карточка или баннер",
  },
  {
    value: "LISTING_PAGE_TOP",
    label: "Объявление — верх",
    group: "listing",
    groupLabel: "Карточка объявления",
    pages: "/listings/[id]",
    where: "Страница одного объявления — над описанием",
    format: "Баннер или карточка",
  },
  {
    value: "LISTING_PAGE_MIDDLE",
    label: "Объявление — середина",
    group: "listing",
    groupLabel: "Карточка объявления",
    pages: "/listings/[id]",
    where: "Между блоками описания и характеристик",
    format: "Баннер или карточка",
  },
  {
    value: "LISTING_PAGE_BOTTOM",
    label: "Объявление — низ",
    group: "listing",
    groupLabel: "Карточка объявления",
    pages: "/listings/[id]",
    where: "Под основным контентом, перед похожими",
    format: "Баннер или карточка",
  },
  {
    value: "SELLER_PROFILE",
    label: "Профиль продавца",
    group: "profile",
    groupLabel: "Профиль",
    pages: "/profile/[id]",
    where: "На странице продавца — в ленте его объявлений или блоке рекламы",
    format: "Нативная карточка",
  },
]

export function getCampaignPlacementGuide(value: AdPlacement) {
  return CAMPAIGN_PLACEMENT_GUIDE.find((p) => p.value === value)
}

/** Для обратной совместимости с AD_PLACEMENT_OPTIONS. */
export const AD_PLACEMENT_OPTIONS = CAMPAIGN_PLACEMENT_GUIDE.map((p) => ({
  value: p.value,
  label: p.label,
  description: p.where,
  group: p.group,
  groupLabel: p.groupLabel,
  pages: p.pages,
}))

export const CAMPAIGN_PLACEMENT_GROUPS = [
  {
    id: "homepage" as const,
    label: "Главная страница",
    items: CAMPAIGN_PLACEMENT_GUIDE.filter((p) => p.group === "homepage"),
  },
  {
    id: "feed" as const,
    label: "Ленты объявлений (категории, поиск)",
    items: CAMPAIGN_PLACEMENT_GUIDE.filter((p) => p.group === "feed"),
  },
  {
    id: "listing" as const,
    label: "Страница объявления",
    items: CAMPAIGN_PLACEMENT_GUIDE.filter((p) => p.group === "listing"),
  },
  {
    id: "profile" as const,
    label: "Профиль продавца",
    items: CAMPAIGN_PLACEMENT_GUIDE.filter((p) => p.group === "profile"),
  },
]

export const SYSTEM_PLACEMENT_NOTES: PlacementGuideEntry[] = [
  {
    id: "mobile-bottom-strip",
    zone: "system",
    zoneLabel: PLACEMENT_ZONE_LABELS.system,
    title: "Полоска над нижним меню",
    pages: "Все страницы кроме главной, чата, карточки объявления",
    where: "Фиксированная узкая полоска над таб-баром на телефоне",
    format: "Текст (сейчас захардкожено в коде)",
    adminTab: "none",
    adminHint: "Пока не настраивается в админке — только через код MobileAdBanner",
  },
]
