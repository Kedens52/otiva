"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ChevronDown, Grid2X2, Heart, LayoutList,
  MapPin, MessageCircle, Search, UserRound,
} from "lucide-react"
import { Logo } from "@/components/layout/Logo"
import { LoginModal } from "@/components/auth/LoginModal"
import { PostListingChooser } from "@/components/want-to-buy/PostListingChooser"
import { ModeSwitcher, type SiteMode } from "@/components/shared/ModeSwitcher"
import { isWantToBuyPublicPath } from "@/config/want-to-buy-brand"
import {
  getWantToBuyCategoriesPath,
  getWantToBuyCategoryPath,
  getWantToBuyCreatePath,
  getWantToBuyHubPath,
  getWantToBuySearchPath,
} from "@/lib/want-to-buy/routes"
import { WANT_TO_BUY_SECTION_LABEL } from "@/config/want-to-buy-brand"
import { TOP_UTILITY_LINKS } from "@/config/site-nav-links"
import { isCabinetRoute } from "@/lib/cabinet-routes"
import {
  filterCitiesByQuery,
  getStoredCity,
  isCityFilterActive,
  NASHLO_DEFAULT_CITY,
  NASHLO_POPULAR_CITIES,
  setStoredCity,
} from "@/lib/city-selection"
import { PAGE_CONTAINER_WIDE_CLASS } from "@/components/layout/PageContainer"

type DemoUser = {
  name?: string
  phone?: string
  email?: string
}

type MenuItem = { label: string; href: string }
type MenuGroup = { title: string; href: string; items: MenuItem[] }
type MenuCategory = { title: string; icon: string; href: string; accent: string; groups: MenuGroup[] }

const categoryMenu: MenuCategory[] = [
  {
    title: "Транспорт", icon: "🚗", href: "/search?cat=cars",
    accent: "bg-[hsl(var(--nashlo-mint)/0.14)] text-[hsl(var(--nashlo-mint))]",
    groups: [
      { title: "Автомобили", href: "/search?cat=cars&vehicle_type=car", items: [
        { label: "С пробегом",     href: "/search?cat=cars&vehicle_type=car&condition=used" },
        { label: "Новые",          href: "/search?cat=cars&vehicle_type=car&condition=new" },
        { label: "Электромобили",  href: "/search?cat=cars&vehicle_type=car&fuel=electric" },
        { label: "Коммерческие",   href: "/search?cat=cars&vehicle_type=commercial" },
        { label: "Спецтехника",    href: "/search?cat=cars&vehicle_type=special" },
      ]},
      { title: "Мотоциклы и мототехника", href: "/search?cat=cars&vehicle_type=moto", items: [
        { label: "Мотоциклы",   href: "/search?cat=cars&vehicle_type=moto" },
        { label: "Скутеры",     href: "/search?cat=cars&vehicle_type=moto&q=скутер" },
        { label: "Квадроциклы", href: "/search?cat=cars&vehicle_type=moto&q=квадроцикл" },
        { label: "Снегоходы",   href: "/search?cat=cars&vehicle_type=moto&q=снегоход" },
      ]},
      { title: "Запчасти и аксессуары", href: "/search?cat=parts", items: [
        { label: "Двигатель",    href: "/search?cat=parts&part_type=engine" },
        { label: "Кузов",        href: "/search?cat=parts&part_type=body" },
        { label: "Шины и диски", href: "/search?cat=parts&q=шины" },
        { label: "Электрика",    href: "/search?cat=parts&part_type=electronics" },
        { label: "Всё для авто", href: "/search?cat=parts" },
      ]},
    ],
  },
  {
    title: "Недвижимость", icon: "🏠", href: "/search?cat=real-estate",
    accent: "bg-[hsl(var(--nashlo-blue)/0.13)] text-[hsl(var(--nashlo-blue))]",
    groups: [
      { title: "Купить", href: "/search?cat=real-estate&deal_type=sell", items: [
        { label: "Квартиры", href: "/search?cat=real-estate&deal_type=sell&property_type=apartment" },
        { label: "Комнаты",  href: "/search?cat=real-estate&deal_type=sell&property_type=room" },
        { label: "Дома",     href: "/search?cat=real-estate&deal_type=sell&property_type=house" },
        { label: "Участки",  href: "/search?cat=real-estate&deal_type=sell&property_type=land" },
        { label: "Гаражи",   href: "/search?cat=real-estate&deal_type=sell&property_type=garage" },
        { label: "Коммерческая", href: "/search?cat=real-estate&deal_type=sell&property_type=commercial" },
      ]},
      { title: "Снять", href: "/search?cat=real-estate&deal_type=rent", items: [
        { label: "Посуточно",     href: "/search?cat=real-estate&deal_type=rent_daily" },
        { label: "Долгосрочно",   href: "/search?cat=real-estate&deal_type=rent&property_type=apartment" },
        { label: "Апартаменты",   href: "/search?cat=real-estate&deal_type=rent&property_type=apartment" },
        { label: "Офисы",         href: "/search?cat=real-estate&deal_type=rent&property_type=commercial" },
        { label: "Дома и дачи",   href: "/search?cat=real-estate&deal_type=rent&property_type=house" },
      ]},
      { title: "Новостройки", href: "/search?cat=real-estate&property_type=new_build", items: [
        { label: "Квартиры в ЖК",  href: "/search?cat=real-estate&property_type=new_build" },
        { label: "Студии",         href: "/search?cat=real-estate&property_type=new_build&rooms=studio" },
        { label: "Паркинги",       href: "/search?cat=real-estate&property_type=garage" },
        { label: "Коммерция",      href: "/search?cat=real-estate&property_type=commercial" },
      ]},
    ],
  },
  {
    title: "Услуги", icon: "🔧", href: "/search?cat=services",
    accent: "bg-[hsl(var(--nashlo-orange)/0.14)] text-[hsl(var(--nashlo-orange))]",
    groups: [
      { title: "Для дома", href: "/search?cat=services&subcategory=repair_home", items: [
        { label: "Ремонт квартир", href: "/search?cat=services&subcategory=repair_home" },
        { label: "Уборка",         href: "/search?cat=services&subcategory=cleaning" },
        { label: "Сантехника",     href: "/search?cat=services&subcategory=plumbing" },
        { label: "Электрика",      href: "/search?cat=services&subcategory=electrical" },
        { label: "Грузчики",       href: "/search?cat=services&subcategory=moving" },
      ]},
      { title: "Деловые услуги", href: "/search?cat=services&subcategory=it", items: [
        { label: "IT и разработка", href: "/search?cat=services&subcategory=it" },
        { label: "Дизайн",          href: "/search?cat=services&subcategory=design" },
        { label: "Юридические",     href: "/search?cat=services&subcategory=legal" },
        { label: "Бухгалтерия",     href: "/search?cat=services&subcategory=accounting" },
        { label: "SMM / Реклама",   href: "/search?cat=services&subcategory=smm" },
      ]},
      { title: "Красота и обучение", href: "/search?cat=services&subcategory=beauty", items: [
        { label: "Красота и здоровье", href: "/search?cat=services&subcategory=beauty" },
        { label: "Репетиторы",         href: "/search?cat=services&subcategory=tutor" },
        { label: "Фото и видео",       href: "/search?cat=services&subcategory=photo_video" },
        { label: "Автосервис",         href: "/search?cat=services&subcategory=auto_service" },
        { label: "Ветеринария",        href: "/search?cat=services&subcategory=vet" },
      ]},
    ],
  },
  {
    title: "Электроника", icon: "📱", href: "/search?cat=electronics",
    accent: "bg-[hsl(var(--nashlo-blue)/0.13)] text-[hsl(var(--nashlo-blue))]",
    groups: [
      { title: "Гаджеты", href: "/search?cat=electronics&subcategory=phones", items: [
        { label: "Смартфоны",  href: "/search?cat=electronics&subcategory=phones" },
        { label: "Планшеты",   href: "/search?cat=electronics&subcategory=tablets" },
        { label: "Умные часы", href: "/search?cat=electronics&subcategory=wearables" },
        { label: "Наушники",   href: "/search?cat=electronics&subcategory=headphones" },
        { label: "Фото/Видео", href: "/search?cat=electronics&subcategory=photo" },
      ]},
      { title: "Компьютеры", href: "/search?cat=electronics&subcategory=laptops", items: [
        { label: "Ноутбуки",      href: "/search?cat=electronics&subcategory=laptops" },
        { label: "ПК",            href: "/search?cat=electronics&subcategory=pc" },
        { label: "Мониторы",      href: "/search?cat=electronics&subcategory=monitors" },
        { label: "Комплектующие", href: "/search?cat=electronics&subcategory=components" },
        { label: "Сети",          href: "/search?cat=electronics&subcategory=network" },
      ]},
      { title: "Развлечения", href: "/search?cat=electronics&subcategory=consoles", items: [
        { label: "Игровые консоли", href: "/search?cat=electronics&subcategory=consoles" },
        { label: "Телевизоры",      href: "/search?cat=electronics&subcategory=tv" },
        { label: "Аудио",           href: "/search?cat=electronics&subcategory=audio" },
        { label: "Apple",           href: "/search?cat=electronics&brand=apple" },
        { label: "Samsung",         href: "/search?cat=electronics&brand=samsung" },
      ]},
    ],
  },
  {
    title: "Дом и интерьер", icon: "🛋️", href: "/search?cat=home",
    accent: "bg-[hsl(var(--nashlo-orange)/0.14)] text-[hsl(var(--nashlo-orange))]",
    groups: [
      { title: "Мебель", href: "/search?cat=home&subcategory=furniture", items: [
        { label: "Диваны и кресла", href: "/search?cat=home&subcategory=furniture&q=диван" },
        { label: "Столы",           href: "/search?cat=home&subcategory=furniture&q=стол" },
        { label: "Кровати",         href: "/search?cat=home&subcategory=furniture&q=кровать" },
        { label: "Шкафы",           href: "/search?cat=home&subcategory=furniture&q=шкаф" },
        { label: "Детская мебель",  href: "/search?cat=home&subcategory=furniture&q=детская" },
      ]},
      { title: "Техника и быт", href: "/search?cat=home&subcategory=appliances", items: [
        { label: "Бытовая техника",  href: "/search?cat=home&subcategory=appliances" },
        { label: "Кухонная техника", href: "/search?cat=home&subcategory=kitchen" },
        { label: "Освещение",        href: "/search?cat=home&subcategory=lighting" },
        { label: "Текстиль / Ковры", href: "/search?cat=home&subcategory=textiles" },
        { label: "Декор",            href: "/search?cat=home&subcategory=decor" },
      ]},
      { title: "Дача и ремонт", href: "/search?cat=home&subcategory=garden", items: [
        { label: "Инструменты",     href: "/search?cat=home&subcategory=tools" },
        { label: "Сад и огород",    href: "/search?cat=home&subcategory=garden" },
        { label: "Стройматериалы",  href: "/search?cat=home&subcategory=repair" },
        { label: "Сантехника",      href: "/search?cat=home&subcategory=plumbing" },
      ]},
    ],
  },
  {
    title: "Одежда", icon: "👗", href: "/search?cat=fashion",
    accent: "bg-[hsl(var(--nashlo-orange)/0.14)] text-[hsl(var(--nashlo-orange))]",
    groups: [
      { title: "Женское", href: "/search?cat=fashion&gender=women", items: [
        { label: "Верхняя одежда", href: "/search?cat=fashion&gender=women&subcategory=outerwear" },
        { label: "Платья",         href: "/search?cat=fashion&gender=women&subcategory=dresses" },
        { label: "Обувь",          href: "/search?cat=fashion&gender=women&subcategory=shoes" },
        { label: "Сумки",          href: "/search?cat=fashion&gender=women&subcategory=bags" },
        { label: "Аксессуары",     href: "/search?cat=fashion&gender=women&subcategory=accessories" },
      ]},
      { title: "Мужское", href: "/search?cat=fashion&gender=men", items: [
        { label: "Верхняя одежда", href: "/search?cat=fashion&gender=men&subcategory=outerwear" },
        { label: "Кроссовки",      href: "/search?cat=fashion&gender=men&subcategory=shoes" },
        { label: "Рубашки",        href: "/search?cat=fashion&gender=men&subcategory=tops" },
        { label: "Брюки",          href: "/search?cat=fashion&gender=men&subcategory=bottoms" },
        { label: "Аксессуары",     href: "/search?cat=fashion&gender=men&subcategory=accessories" },
      ]},
      { title: "Бренды и стиль", href: "/search?cat=fashion", items: [
        { label: "Nike / Adidas",  href: "/search?cat=fashion&q=nike" },
        { label: "Винтаж",         href: "/search?cat=fashion&q=винтаж" },
        { label: "Спортивное",     href: "/search?cat=fashion&subcategory=sport" },
        { label: "Детская одежда", href: "/search?cat=fashion&gender=kids" },
      ]},
    ],
  },
]

type CatalogRibbonItem = { title: string; icon: string; href: string }

function listingCategorySlugFromMenuHref(href: string): string | null {
  const query = href.includes("?") ? href.slice(href.indexOf("?") + 1) : ""
  const cat = new URLSearchParams(query).get("cat")
  return cat?.trim() || null
}

function buildWantCatalogRibbon(categoryMenuItems: MenuCategory[]): CatalogRibbonItem[] {
  return categoryMenuItems.flatMap((category) => {
    const slug = listingCategorySlugFromMenuHref(category.href)
    if (!slug) return []
    return [{ title: category.title, icon: category.icon, href: getWantToBuyCategoryPath(slug) }]
  })
}

export function Header({ mode: modeProp }: { mode?: SiteMode } = {}) {
  const router   = useRouter()
  const pathname = usePathname()
  const siteMode: SiteMode =
    modeProp ?? (isWantToBuyPublicPath(pathname) ? "want" : "sell")
  const hidePostCta = isCabinetRoute(pathname)
  const hideMobileHeader = isCabinetRoute(pathname)
  const hideMobileCategoryRibbon = isWantToBuyPublicPath(pathname)
  const hideMobileBottomNav = pathname.startsWith("/messages/") || pathname === "/create"

  const [user,          setUser]          = useState<DemoUser | null>(null)
  const [searchQuery,   setSearchQuery]   = useState("")
  const [selectedCity,  setSelectedCity]  = useState(NASHLO_DEFAULT_CITY)
  const [cityQuery,     setCityQuery]     = useState("")
  const [isCityOpen,    setIsCityOpen]    = useState(false)
  const [isCatalogOpen, setIsCatalogOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [activeIndex,   setActiveIndex]   = useState(0)
  const [unreadChats,   setUnreadChats]   = useState(0)
  const [loginOpen,     setLoginOpen]     = useState(false)

  const activeCategory = categoryMenu[activeIndex]
  const catalogRibbonItems = useMemo(
    () => (siteMode === "want" ? buildWantCatalogRibbon(categoryMenu) : categoryMenu),
    [siteMode],
  )
  const catalogAllHref = siteMode === "want" ? getWantToBuyCategoriesPath() : "/categories"

  const filteredCities = useMemo(() => filterCitiesByQuery(cityQuery), [cityQuery])

  useEffect(() => {
    async function syncUser() {
      try {
        const res = await fetch("/api/auth/me")
        if (res.ok) {
          const data = await res.json()
          if (data.user) {
            setUser({ name: data.user.name || "Пользователь", phone: data.user.phone || "", email: "" })
            return
          }
        }
      } catch {}
      setUser(null)
    }
    syncUser()
    window.addEventListener("nashlo-auth-change", syncUser)
    return () => window.removeEventListener("nashlo-auth-change", syncUser)
  }, [])

  useEffect(() => {
    async function syncUnread() {
      try {
        const res = await fetch("/api/messages/conversations")
        if (res.ok) {
          const data = await res.json()
          const total = (data.conversations ?? []).reduce(
            (sum: number, c: { unreadCount: number }) => sum + (c.unreadCount || 0), 0
          )
          setUnreadChats(total)
        }
      } catch {}
    }
    syncUnread()
    const interval = setInterval(syncUnread, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setSelectedCity(getStoredCity())
  }, [])

  useEffect(() => {
    setIsCityOpen(false)
    setIsCatalogOpen(false)
    setIsProfileOpen(false)
  }, [pathname])

  /** Блокируем скролл страницы под мобильным bottom sheet выбора города. */
  useEffect(() => {
    if (!isCityOpen) return
    const mq = window.matchMedia("(max-width: 1023px)")
    if (!mq.matches) return

    const prevOverflow = document.body.style.overflow
    const prevTouchAction = document.body.style.touchAction
    document.body.style.overflow = "hidden"
    document.body.style.touchAction = "none"

    return () => {
      document.body.style.overflow = prevOverflow
      document.body.style.touchAction = prevTouchAction
    }
  }, [isCityOpen])

  function chooseCity(city: string) {
    setSelectedCity(city)
    setCityQuery("")
    setIsCityOpen(false)
    setStoredCity(city)
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {}
    window.dispatchEvent(new Event("nashlo-auth-change"))
    setUser(null)
    setIsProfileOpen(false)
  }

  const initials  = user?.name?.trim().slice(0, 1).toUpperCase() || "П"
  const cityLabel = selectedCity.length > 12 ? selectedCity.slice(0, 11) + "…" : selectedCity

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = searchQuery.trim()
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    if (isCityFilterActive(selectedCity)) params.set("city", selectedCity)
    if (siteMode === "want") {
      router.push(getWantToBuySearchPath(Object.fromEntries(params)))
      return
    }
    router.push(`/search?${params.toString()}`)
  }

  const searchPlaceholder =
    siteMode === "want"
      ? "Что люди хотят купить?"
      : "Что хотите найти?"
  const searchPlaceholderHint =
    siteMode === "want"
      ? "Например: ищу iPhone до 60 000 ₽, нужна мебель на заказ"
      : "Например: iPhone, диван, ремонт, авто"

  if (pathname === "/login" || pathname === "/register" || pathname === "/admin/login") return null

  const isHomeMobile = pathname === "/"

  return (
    <>
      <header className="relative z-50 bg-white pt-1.5 shadow-[0_1px_0_0_#E5E7EB]">
        <input id="catalog-menu-toggle" type="checkbox" className="peer sr-only" />

        {/* ══════════════════════════════════════════════════════════════
            MOBILE LAYOUT (< md) — город, каталог, поиск, категории
        ══════════════════════════════════════════════════════════════ */}
        <div className={`px-4 pb-3 lg:hidden ${isHomeMobile ? "pt-[calc(env(safe-area-inset-top)+0.5rem)]" : "pt-[calc(env(safe-area-inset-top)+0.625rem)]"} ${hideMobileHeader ? "hidden" : ""}`}>
          <div className="mb-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsCatalogOpen(false)
                setIsCityOpen((v) => !v)
              }}
              className="flex h-9 min-w-0 flex-1 items-center gap-1.5 rounded-full bg-[#F5F6F8] px-3 text-[13px] font-medium text-[#374151] transition active:bg-zinc-200/70"
            >
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#FF4F12]" />
              <span className="truncate">{cityLabel}</span>
              <ChevronDown className={`ml-auto h-3.5 w-3.5 shrink-0 text-[#9CA3AF] transition-transform duration-150 ${isCityOpen ? "rotate-180" : ""}`} />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCityOpen(false)
                setIsCatalogOpen((v) => !v)
              }}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-3.5 text-[13px] font-semibold text-[#374151] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition active:bg-zinc-50"
            >
              <Grid2X2 className="h-4 w-4 text-[#FF4F12]" />
              Каталог
            </button>
          </div>

          {/* Поиск — крупный, полная ширина */}
          <form
            onSubmit={handleSearch}
            className="flex h-[48px] items-center overflow-hidden rounded-[16px] border border-[#E5E7EB] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.07)] transition focus-within:border-[#FF4F12]/50 focus-within:ring-2 focus-within:ring-[#FF4F12]/10"
          >
            <Search className="ml-3.5 h-[18px] w-[18px] shrink-0 text-[#B0B7C3]" />
            <input
              className="min-w-0 flex-1 bg-transparent px-2.5 text-[15px] outline-none placeholder:text-[#B0B7C3]"
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              title={searchPlaceholderHint}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              className="h-full shrink-0 rounded-r-[15px] bg-[#FF4F12] px-5 text-[14px] font-semibold text-white transition active:bg-[#E8470F]"
            >
              Найти
            </button>
          </form>

          {!hidePostCta && !hideMobileCategoryRibbon && (
            <div className="-mx-4 mt-2.5 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {catalogRibbonItems.map((category) => (
                <Link
                  key={category.title}
                  href={category.href}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#ECEFF3] bg-white px-3 py-2 text-[12px] font-semibold text-[#374151] shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition active:bg-zinc-50"
                >
                  <span className="text-[14px] leading-none">{category.icon}</span>
                  <span>{category.title}</span>
                </Link>
              ))}
              <Link
                href={catalogAllHref}
                className="inline-flex shrink-0 items-center rounded-full bg-[#FFF3EC] px-3 py-2 text-[12px] font-semibold text-[#FF4F12] transition active:bg-[#FFE8DC]"
              >
                Все →
              </Link>
            </div>
          )}

          <div className="mt-2 flex justify-center">
            <ModeSwitcher mode={siteMode} />
          </div>

          {/* Mobile city modal — bottom sheet (dvh + safe-area) */}
          {isCityOpen && (
            <div
              className="fixed inset-0 z-[160] lg:hidden"
              role="presentation"
              onClick={() => setIsCityOpen(false)}
            >
              <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm" aria-hidden />
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="mobile-city-picker-title"
                className="absolute inset-x-0 bottom-0 flex max-h-[min(85dvh,calc(100svh-env(safe-area-inset-bottom)-0.5rem))] flex-col overflow-hidden rounded-t-[28px] bg-white pb-[calc(16px+env(safe-area-inset-bottom))] shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex shrink-0 justify-center pt-2 pb-1">
                  <div className="h-1 w-10 rounded-full bg-zinc-200" aria-hidden />
                </div>

                <div className="shrink-0 border-b border-zinc-100 px-3 pb-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p id="mobile-city-picker-title" className="text-sm font-semibold text-[#111827]">
                      Выберите город
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsCityOpen(false)}
                      aria-label="Закрыть"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-lg leading-none text-zinc-500"
                    >
                      ×
                    </button>
                  </div>
                  <input
                    value={cityQuery}
                    onChange={(e) => setCityQuery(e.target.value)}
                    placeholder="Город или регион"
                    className="mt-2 h-10 w-full rounded-xl border border-[#E5E7EB] bg-zinc-50 px-3 text-sm outline-none focus:border-[#FF4F12]/40"
                  />
                </div>

                <div className="shrink-0 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9CA3AF]">
                    Популярные
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {NASHLO_POPULAR_CITIES.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => chooseCity(city)}
                        className={`rounded-full px-2.5 py-1.5 text-xs font-semibold transition active:scale-95 ${
                          selectedCity === city
                            ? "bg-[#FF4F12] text-white"
                            : "bg-zinc-100 text-[#374151]"
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 [-webkit-overflow-scrolling:touch]">
                  {filteredCities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => chooseCity(city)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition active:bg-zinc-100 ${
                        selectedCity === city
                          ? "bg-[#FF4F12] font-semibold text-white"
                          : "text-[#374151]"
                      }`}
                    >
                      <span>{city}</span>
                      {selectedCity === city && <span className="text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Mobile catalog modal */}
          {isCatalogOpen && (
            <div className="fixed inset-0 z-[160]" onClick={() => setIsCatalogOpen(false)}>
              <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm" />
              <div
                className="absolute inset-x-0 bottom-0 flex max-h-[82vh] flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-center pt-3">
                  <div className="h-1 w-10 rounded-full bg-zinc-200" />
                </div>
                <div className="border-b border-zinc-100 px-4 pb-4 pt-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-semibold text-[#111827]">Каталог</p>
                    <button
                      type="button"
                      onClick={() => setIsCatalogOpen(false)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-lg leading-none text-zinc-500"
                    >
                      ×
                    </button>
                  </div>
                  <p className="mt-1 text-sm text-[#6B7280]">Выберите раздел или откройте все категории</p>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-2">
                  {categoryMenu.map((category) => (
                    <Link
                      key={category.title}
                      href={category.href}
                      onClick={() => setIsCatalogOpen(false)}
                      className="mb-1.5 flex items-center gap-3 rounded-2xl px-3 py-3 transition active:bg-zinc-50"
                    >
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl ${category.accent}`}>
                        {category.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-[#111827]">{category.title}</span>
                        <span className="mt-0.5 block truncate text-xs text-[#9CA3AF]">
                          {category.groups.map((g) => g.title).slice(0, 3).join(" · ")}
                        </span>
                      </span>
                      <span className="text-[#C4C9D2]">›</span>
                    </Link>
                  ))}
                  <Link
                    href="/categories"
                    onClick={() => setIsCatalogOpen(false)}
                    className="mt-2 flex h-11 items-center justify-center rounded-2xl bg-[#FF4F12] text-sm font-semibold text-white transition active:bg-[#E8470F]"
                  >
                    Все категории
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════
            DESKTOP — ROW 1: UTILITY BAR (hidden on mobile)
            Left:  utility links (Помощь, Безопасность, Реклама)
            Right: Favorites · Messages · Мои объявления · Auth · CTA
        ══════════════════════════════════════════════════════════════ */}
        <div className="hidden border-b border-[#F3F4F6] lg:block">
          <div className={`${PAGE_CONTAINER_WIDE_CLASS} flex h-9 items-center justify-between`}>

            {/* Left: utility navigation */}
            <nav className="flex min-w-0 flex-1 flex-wrap items-center gap-x-5 gap-y-1 pr-4">
              {TOP_UTILITY_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="whitespace-nowrap text-[13px] font-medium text-[#6B7280] transition hover:text-[#111827]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right: actions */}
            <div className="flex items-center gap-0.5">
              {/* Favorites */}
              <Link
                href="/profile/favorites"
                className="flex h-8 w-8 items-center justify-center rounded-[9px] text-[#6B7280] transition hover:bg-[#F5F6F8] hover:text-[#111827]"
                title="Избранное"
              >
                <Heart className="h-[17px] w-[17px]" />
              </Link>

              {/* Messages */}
              <Link
                href="/chat"
                className="relative flex h-8 w-8 items-center justify-center rounded-[9px] text-[#6B7280] transition hover:bg-[#F5F6F8] hover:text-[#111827]"
                title="Сообщения"
              >
                <MessageCircle className="h-[17px] w-[17px]" />
                {unreadChats > 0 && (
                  <span className="absolute right-1 top-1 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-[#FF4F12] px-0.5 text-[9px] font-bold text-white">
                    {unreadChats > 9 ? "9+" : unreadChats}
                  </span>
                )}
              </Link>

              {/* My listings — only when logged in */}
              {user && (
                <Link
                  href="/my-listings"
                  className="hidden h-8 items-center gap-1.5 rounded-[9px] px-2 text-[13px] font-medium text-[#6B7280] transition hover:bg-[#F5F6F8] hover:text-[#111827] lg:flex"
                >
                  <LayoutList className="h-3.5 w-3.5 shrink-0" />
                  <span>Мои объявления</span>
                </Link>
              )}

              {/* Separator */}
              <div className="mx-1.5 h-4 w-px bg-[#E5E7EB]" />

              {/* Auth: guest */}
              {!user ? (
                <>
                  <button
                    type="button"
                    onClick={() => setLoginOpen(true)}
                    className="flex h-8 items-center gap-1.5 rounded-[9px] px-2.5 text-[13px] font-medium text-[#374151] transition hover:bg-[#F5F6F8] hover:text-[#111827]"
                  >
                    <UserRound className="h-[15px] w-[15px] lg:hidden" />
                    <span className="hidden lg:inline">Войти</span>
                  </button>
                  <Link
                    href="/register"
                    className="hidden h-8 items-center rounded-[9px] px-2.5 text-[13px] font-medium text-[#374151] transition hover:bg-[#F5F6F8] hover:text-[#111827] lg:flex"
                  >
                    Регистрация
                  </Link>
                </>
              ) : (
                /* Auth: logged in — profile dropdown */
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen((v) => !v)}
                    className="flex h-8 items-center gap-1.5 rounded-[9px] border border-[#E5E7EB] bg-white px-2.5 text-[13px] font-medium text-[#374151] transition hover:border-[#D1D5DB] hover:bg-[#F5F6F8]"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FF4F12] text-[10px] font-semibold text-white">
                      {initials}
                    </span>
                    <span className="hidden max-w-[80px] truncate lg:block">{user.name || "Профиль"}</span>
                    <ChevronDown
                      className={`h-3 w-3 text-[#9CA3AF] transition-transform duration-150 ${
                        isProfileOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 top-[calc(100%+6px)] z-[140] w-52">
                      <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-xl shadow-zinc-950/8">
                        <div className="p-1.5">
                          <Link
                            href="/profile"
                            onClick={() => setIsProfileOpen(false)}
                            className="block rounded-xl px-4 py-2.5 text-sm font-medium text-[#374151] transition hover:bg-[#F5F6F8] hover:text-[#111827]"
                          >
                            Мой профиль
                          </Link>
                          <Link
                            href="/my-listings"
                            onClick={() => setIsProfileOpen(false)}
                            className="block rounded-xl px-4 py-2.5 text-sm font-medium text-[#374151] transition hover:bg-[#F5F6F8] hover:text-[#111827]"
                          >
                            Мои объявления
                          </Link>
                          <Link
                            href="/profile/want-to-buy"
                            onClick={() => setIsProfileOpen(false)}
                            className="block rounded-xl px-4 py-2.5 text-sm font-medium text-[#374151] transition hover:bg-[#F5F6F8] hover:text-[#111827]"
                          >
                            Мои заявки
                          </Link>
                          <Link
                            href="/profile/favorites"
                            onClick={() => setIsProfileOpen(false)}
                            className="block rounded-xl px-4 py-2.5 text-sm font-medium text-[#374151] transition hover:bg-[#F5F6F8] hover:text-[#111827]"
                          >
                            Избранное
                          </Link>
                          <Link
                            href="/profile/settings"
                            onClick={() => setIsProfileOpen(false)}
                            className="block rounded-xl px-4 py-2.5 text-sm font-medium text-[#374151] transition hover:bg-[#F5F6F8] hover:text-[#111827]"
                          >
                            Настройки
                          </Link>
                          <div className="my-1 h-px bg-[#F3F4F6]" />
                          <button
                            type="button"
                            onClick={logout}
                            className="block w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium text-[#9CA3AF] transition hover:bg-red-50 hover:text-red-600"
                          >
                            Выйти
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Post CTA */}
              {!hidePostCta && <PostListingChooser mode={siteMode} className="ml-2" />}
            </div>
          </div>
        </div>

        {/* DESKTOP — логотип, каталог, поиск, город */}
        <div className={`${PAGE_CONTAINER_WIDE_CLASS} hidden lg:flex lg:h-16 lg:items-center lg:gap-4`}>
          <Logo size="header" />
          <label
            htmlFor="catalog-menu-toggle"
            className="inline-flex h-[48px] shrink-0 cursor-pointer items-center gap-2 rounded-[14px] border border-[#E5E7EB] bg-white px-4 text-sm font-semibold text-[#111827] shadow-[0_1px_3px_rgba(0,0,0,0.07)] transition hover:border-[#FF4F12]/40 hover:bg-[#FFF6F3] hover:text-[#FF4F12] active:scale-[0.98]"
          >
            <Grid2X2 className="h-4 w-4 shrink-0" />
            <span>Каталог</span>
          </label>

          {/* Поиск */}
          <form
            onSubmit={handleSearch}
            className="flex h-[48px] flex-1 items-center overflow-hidden rounded-[14px] border border-[#D1D5DB] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition focus-within:border-[#FF4F12]/50 focus-within:ring-2 focus-within:ring-[#FF4F12]/10"
          >
            <Search className="ml-4 h-[18px] w-[18px] shrink-0 text-[#9CA3AF]" />
            <input
              className="min-w-0 flex-1 bg-transparent px-3 text-[14px] outline-none placeholder:text-[#B0B7C3]"
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              title={searchPlaceholderHint}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              className="h-full shrink-0 rounded-r-[13px] bg-[#FF4F12] px-7 text-sm font-semibold text-white transition hover:bg-[#E8470F]"
            >
              Найти
            </button>
          </form>

          <ModeSwitcher mode={siteMode} className="hidden shrink-0 lg:inline-flex" />

          {/* Right: City selector */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsCityOpen((v) => !v)}
              aria-expanded={isCityOpen}
              className="flex h-[44px] items-center gap-1.5 rounded-[12px] px-3 text-sm font-medium text-[#374151] transition hover:bg-[#F5F6F8]"
            >
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#FF4F12]" />
              <span className="max-w-[130px] truncate">{cityLabel}</span>
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 text-[#9CA3AF] transition-transform duration-150 ${
                  isCityOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Desktop city dropdown */}
            {isCityOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-[120] w-[min(92vw,400px)] overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl shadow-zinc-950/10">
                <div className="border-b border-[#F3F4F6] p-4">
                  <p className="text-sm font-semibold text-[#111827]">Выберите город</p>
                  <input
                    value={cityQuery}
                    onChange={(e) => setCityQuery(e.target.value)}
                    placeholder="Найти город"
                    autoFocus
                    className="mt-3 h-10 w-full rounded-xl border border-[#E5E7EB] bg-zinc-50 px-3 text-sm outline-none transition focus:border-[#FF4F12]/40 focus:bg-white"
                  />
                </div>
                <div className="p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#9CA3AF]">Популярные</p>
                  <div className="flex flex-wrap gap-1.5">
                    {NASHLO_POPULAR_CITIES.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => chooseCity(city)}
                        className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                          selectedCity === city
                            ? "bg-[#FF4F12] text-white"
                            : "bg-zinc-100 text-[#374151] hover:bg-[#FFF3EC] hover:text-[#FF4F12]"
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto px-2 pb-2">
                  {filteredCities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => chooseCity(city)}
                      className={`flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-sm transition ${
                        selectedCity === city
                          ? "bg-[#FF4F12] font-medium text-white"
                          : "text-[#374151] hover:bg-zinc-100"
                      }`}
                    >
                      <span>{city}</span>
                      {selectedCity === city && <span className="text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            CATEGORY MEGA MENU — triggered by catalog checkbox toggle
        ══════════════════════════════════════════════════════════════ */}
        <div className="absolute inset-x-0 top-full z-[100] hidden border-t border-[#E5E7EB] bg-white shadow-2xl shadow-zinc-950/8 peer-checked:block">
          {siteMode === "want" ? (
            <div className={`${PAGE_CONTAINER_WIDE_CLASS} py-8`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-[#111827]">
                    Категории заявок «{WANT_TO_BUY_SECTION_LABEL}»
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm text-[#6B7280]">
                    Смотрите, что ищут покупатели по разделам, или создайте свою заявку.
                  </p>
                </div>
                <label
                  htmlFor="catalog-menu-toggle"
                  className="cursor-pointer rounded-full bg-zinc-100 px-3 py-1.5 text-sm font-medium text-[#6B7280] hover:bg-[#FFF3EC] hover:text-[#FF4F12]"
                >
                  Закрыть
                </label>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {buildWantCatalogRibbon(categoryMenu).map((category) => (
                  <Link
                    key={category.href}
                    href={category.href}
                    className="flex items-center gap-3 rounded-2xl border border-[#ECEFF3] bg-zinc-50 px-4 py-3 text-sm font-semibold text-[#111827] transition hover:border-[#FF5A00]/25 hover:bg-[#FFF8F4]"
                  >
                    <span className="text-xl" aria-hidden>
                      {category.icon}
                    </span>
                    {category.title}
                  </Link>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link
                  href={getWantToBuyCategoriesPath()}
                  className="rounded-xl bg-[#FF5A00] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#E8470F]"
                >
                  Все категории заявок
                </Link>
                <Link
                  href={getWantToBuyCreatePath()}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#111827] hover:border-zinc-300"
                >
                  Создать заявку
                </Link>
                <Link
                  href="/categories"
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#6B7280] hover:border-zinc-300 hover:text-[#111827]"
                >
                  Каталог объявлений
                </Link>
              </div>
            </div>
          ) : (
          <div className={`${PAGE_CONTAINER_WIDE_CLASS} grid gap-8 py-8 lg:grid-cols-[280px_1fr_260px]`}>
            <nav className="rounded-2xl bg-zinc-50 p-2">
              {categoryMenu.map((category, index) => (
                <button
                  key={category.title}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                    activeIndex === index
                      ? "bg-white text-[#111827] shadow-sm"
                      : "text-[#6B7280] hover:bg-white/70"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-xl">
                      {category.icon}
                    </span>
                    {category.title}
                  </span>
                  <span className="text-[#9CA3AF]">›</span>
                </button>
              ))}
            </nav>

            <section>
              <div className="flex items-start justify-between gap-4">
                <Link
                  href={activeCategory.href}
                  className="inline-flex items-center gap-2 text-2xl font-semibold tracking-tight text-[#111827] hover:text-[#374151]"
                >
                  {activeCategory.title} <span>›</span>
                </Link>
                <div className="flex gap-2">
                  <Link
                    href="/categories"
                    className="rounded-full bg-zinc-100 px-3 py-1.5 text-sm font-medium text-[#6B7280] hover:bg-[#FFF3EC] hover:text-[#FF4F12]"
                  >
                    Все категории
                  </Link>
                  <label
                    htmlFor="catalog-menu-toggle"
                    className="cursor-pointer rounded-full bg-zinc-100 px-3 py-1.5 text-sm font-medium text-[#6B7280] hover:bg-[#FFF3EC] hover:text-[#FF4F12]"
                  >
                    Закрыть
                  </label>
                </div>
              </div>
              <div className="mt-6 grid gap-8 md:grid-cols-3">
                {activeCategory.groups.map((group) => (
                  <div key={group.title}>
                    <Link
                      href={group.href}
                      className="text-sm font-semibold text-[#111827] hover:text-[#374151]"
                    >
                      {group.title} ›
                    </Link>
                    <ul className="mt-3 space-y-2">
                      {group.items.map((item) => (
                        <li key={item.label}>
                          <Link
                            href={item.href}
                            className="text-sm text-[#6B7280] transition hover:text-[#111827] hover:underline underline-offset-2"
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            <aside className="rounded-2xl border border-orange-100 bg-[#FFF7F2] p-5">
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${activeCategory.accent}`}>
                {activeCategory.icon}
              </div>
              <h3 className="text-sm font-semibold text-[#111827]">Полезно знать</h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link href="/safety" className="block text-sm text-[#6B7280] hover:text-[#111827] hover:underline underline-offset-2">
                    Советы по безопасности →
                  </Link>
                </li>
                <li>
                  <Link href="/chat" className="block text-sm text-[#6B7280] hover:text-[#111827] hover:underline underline-offset-2">
                    Чат с продавцом →
                  </Link>
                </li>
                <li>
                  <Link href="/create" className="block text-sm text-[#6B7280] hover:text-[#111827] hover:underline underline-offset-2">
                    Разместить объявление →
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="block text-sm text-[#6B7280] hover:text-[#111827] hover:underline underline-offset-2">
                    Продвижение объявлений →
                  </Link>
                </li>
                <li>
                  <Link
                    href={getWantToBuyHubPath()}
                    className="block text-sm font-medium text-[#FF5A00] hover:underline underline-offset-2"
                  >
                    Заявки «{WANT_TO_BUY_SECTION_LABEL}» →
                  </Link>
                </li>
              </ul>
              <Link
                href="/categories"
                className="mt-6 block rounded-xl bg-white px-4 py-2.5 text-center text-sm font-medium text-[#111827] transition hover:bg-[#FFF3EC] hover:text-[#FF4F12]"
              >
                Все категории
              </Link>
            </aside>
          </div>
          )}
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════
          MOBILE BOTTOM NAV — Lucide icons, active state, safe-area
      ══════════════════════════════════════════════════════════════ */}
      <nav className={`fixed inset-x-0 bottom-0 z-50 border-t border-[#E5E7EB] bg-white shadow-[0_-6px_20px_rgba(15,23,42,0.06)] lg:hidden ${hideMobileBottomNav ? "hidden" : ""}`}>
        <div className="flex h-[var(--nashlo-mobile-nav-h)] items-center px-1">

          {/* Поиск */}
          <Link
            href="/"
            className={`flex flex-1 flex-col items-center gap-[3px] py-2 transition-colors ${
              pathname === "/" || pathname === "/search" || pathname.startsWith("/categories") ? "text-[#FF4F12]" : "text-[#9CA3AF]"
            }`}
          >
            <Search
              className="h-[22px] w-[22px]"
              strokeWidth={pathname === "/" || pathname === "/search" || pathname.startsWith("/categories") ? 2.2 : 1.7}
            />
            <span className="text-[11px] font-medium">Поиск</span>
          </Link>

          {/* Избранное */}
          <Link
            href="/profile/favorites"
            className={`flex flex-1 flex-col items-center gap-[3px] py-2 transition-colors ${
              pathname === "/profile/favorites"
                ? "text-[#FF4F12]"
                : "text-[#9CA3AF]"
            }`}
          >
            <Heart
              className="h-[22px] w-[22px]"
              strokeWidth={pathname === "/profile/favorites" ? 2.2 : 1.7}
              fill={pathname === "/profile/favorites" ? "currentColor" : "none"}
            />
            <span className="text-[11px] font-medium">Избранное</span>
          </Link>

          {/* Центр: Мои объявления */}
          <Link
            href="/my-listings"
            className={`flex flex-1 flex-col items-center gap-[3px] py-1 transition-colors ${
              pathname === "/my-listings" || pathname.startsWith("/my-listings/") ? "text-[#FF4F12]" : "text-[#9CA3AF]"
            }`}
            aria-label="Мои объявления"
          >
            <span className={`flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition active:scale-95 ${
              pathname === "/my-listings" || pathname.startsWith("/my-listings/")
                ? "bg-[#FF4F12] text-white shadow-[#FF4F12]/30"
                : "bg-[#FF4F12] text-white shadow-[#FF4F12]/25"
            }`}>
              <LayoutList className="h-[22px] w-[22px]" strokeWidth={2} />
            </span>
            <span className="text-[11px] font-medium">Объявления</span>
          </Link>

          {/* Сообщения */}
          <Link
            href="/chat"
            className={`relative flex flex-1 flex-col items-center gap-[3px] py-2 transition-colors ${
              pathname === "/chat" || pathname?.startsWith("/chat/") || pathname?.startsWith("/messages/") || pathname === "/support"
                ? "text-[#FF4F12]"
                : "text-[#9CA3AF]"
            }`}
          >
            <span className="relative">
              <MessageCircle
                className="h-[22px] w-[22px]"
                strokeWidth={
                  pathname === "/chat" ||
                  pathname?.startsWith("/chat/") ||
                  pathname?.startsWith("/messages/") ||
                  pathname === "/support"
                    ? 2.2
                    : 1.7
                }
              />
              {unreadChats > 0 && (
                <span className="absolute -right-1.5 -top-1 flex h-[14px] w-[14px] items-center justify-center rounded-full bg-[#FF4F12] text-[8px] font-bold text-white">
                  {unreadChats > 9 ? "9+" : unreadChats}
                </span>
              )}
            </span>
            <span className="text-[11px] font-medium">Сообщения</span>
          </Link>

          {/* Профиль */}
          {!user ? (
            <button
              type="button"
              onClick={() => setLoginOpen(true)}
              className={`flex flex-1 flex-col items-center gap-[3px] py-2 transition-colors ${
                pathname === "/login" ? "text-[#FF4F12]" : "text-[#9CA3AF]"
              }`}
            >
              <UserRound className="h-[22px] w-[22px]" strokeWidth={1.7} />
              <span className="text-[11px] font-medium">Войти</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsProfileOpen(true)}
              className={`flex flex-1 flex-col items-center gap-[3px] py-2 transition-colors ${
                isProfileOpen || pathname === "/profile" || pathname.startsWith("/profile/")
                  ? "text-[#FF4F12]"
                  : "text-[#9CA3AF]"
              }`}
            >
              <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[#FF4F12] text-[10px] font-bold text-white ring-2 ring-[#FF4F12]/20">
                {initials}
              </span>
              <span className="text-[11px] font-medium">Профиль</span>
            </button>
          )}
        </div>
        <div className="h-[env(safe-area-inset-bottom)] bg-white" aria-hidden="true" />
      </nav>

      {/* ══════════════════════════════════════════════════════════════
          MOBILE PROFILE SHEET (bottom sheet when tapping profile icon)
      ══════════════════════════════════════════════════════════════ */}
      {isProfileOpen && user && (
        <div
          className="fixed inset-0 z-[160] lg:hidden"
          onClick={() => setIsProfileOpen(false)}
        >
          <div className="absolute inset-0 bg-zinc-950/40" />
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pb-1 pt-3">
              <div className="h-1 w-10 rounded-full bg-zinc-200" />
            </div>
            <div className="flex items-center gap-3 border-b border-[#F3F4F6] px-6 py-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FF4F12] text-lg font-bold text-white">
                {initials}
              </div>
              <div>
                <p className="font-semibold text-[#111827]">{user.name}</p>
                <p className="text-sm text-[#6B7280]">{user.email || user.phone}</p>
              </div>
            </div>
            <div className="p-3">
              {[
                { href: "/profile",          label: "Мой профиль" },
                { href: "/my-listings",      label: "Мои объявления" },
                { href: "/profile/want-to-buy", label: "Мои заявки" },
                { href: "/create",           label: "Разместить объявление" },
                { href: getWantToBuyCreatePath(), label: "Создать заявку" },
                { href: getWantToBuyHubPath(), label: WANT_TO_BUY_SECTION_LABEL },
                { href: "/chat",             label: "Сообщения" },
                { href: "/profile/favorites", label: "Избранное" },
                { href: "/profile/settings", label: "Настройки" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center rounded-2xl px-4 py-3 text-sm font-medium text-[#111827] transition hover:bg-[#F5F6F8]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="border-t border-[#F3F4F6] p-3">
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center rounded-2xl px-4 py-3 text-sm font-medium text-[#9CA3AF] transition hover:bg-red-50 hover:text-red-600"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      )}

      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        redirectTo="/profile"
      />
    </>
  )
}
