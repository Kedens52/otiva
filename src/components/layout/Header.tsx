"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Logo } from "@/components/layout/Logo"
import { LoginModal } from "@/components/auth/LoginModal"

type DemoUser = {
  name?: string
  phone?: string
  email?: string
}

const navItems = [
  { href: "/my-listings", label: "Мои объявления" },
  { href: "/favorites", label: "Избранное" },
  { href: "/chat", label: "Чат", badge: true },
]

const popularCities = ["Москва", "Санкт-Петербург", "Казань", "Екатеринбург", "Новосибирск", "Сочи"]

const cities = [
  "Москва","Санкт-Петербург","Новосибирск","Екатеринбург","Казань","Нижний Новгород",
  "Челябинск","Красноярск","Самара","Уфа","Ростов-на-Дону","Омск","Краснодар","Воронеж",
  "Пермь","Волгоград","Саратов","Тюмень","Тольятти","Ижевск","Барнаул","Ульяновск",
  "Иркутск","Хабаровск","Ярославль","Владивосток","Махачкала","Томск","Оренбург",
  "Кемерово","Новокузнецк","Рязань","Астрахань","Пенза","Липецк","Киров","Чебоксары",
  "Калининград","Балашиха","Тула","Курск","Ставрополь","Сочи","Улан-Удэ","Тверь",
  "Магнитогорск","Иваново","Брянск","Белгород","Сургут","Владимир","Нижний Тагил",
  "Архангельск","Чита","Симферополь","Калуга","Смоленск","Волжский","Курган","Орел",
  "Череповец","Владикавказ","Мурманск","Саранск","Якутск","Вологда","Орск","Грозный",
  "Тамбов","Стерлитамак","Петрозаводск","Кострома","Новороссийск",
]

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
      ]},
      { title: "Мотоциклы и мототехника", href: "/search?cat=cars&vehicle_type=moto", items: [
        { label: "Мотоциклы",  href: "/search?cat=cars&vehicle_type=moto&subcategory=moto" },
        { label: "Скутеры",    href: "/search?cat=cars&vehicle_type=moto&subcategory=scooter" },
        { label: "Квадроциклы",href: "/search?cat=cars&vehicle_type=moto&subcategory=quad" },
        { label: "Снегоходы",  href: "/search?cat=cars&vehicle_type=moto&subcategory=snowmobile" },
      ]},
      { title: "Запчасти и аксессуары", href: "/search?cat=cars&vehicle_type=special", items: [
        { label: "Шины и диски", href: "/search?cat=cars&q=шины" },
        { label: "Аудио",        href: "/search?cat=cars&q=аудио" },
        { label: "Багажники",    href: "/search?cat=cars&q=багажник" },
        { label: "Расходники",   href: "/search?cat=cars&q=расходники" },
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
        { label: "Реклама",         href: "/search?cat=services&subcategory=design" },
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
  {
    title: "Детям", icon: "🧸", href: "/search?cat=kids",
    accent: "bg-[hsl(var(--nashlo-mint)/0.14)] text-[hsl(var(--nashlo-mint))]",
    groups: [
      { title: "Товары", href: "/search?cat=kids&subcategory=toys", items: [
        { label: "Коляски",      href: "/search?cat=kids&subcategory=strollers" },
        { label: "Автокресла",   href: "/search?cat=kids&subcategory=car_seats" },
        { label: "Игрушки",      href: "/search?cat=kids&subcategory=toys" },
        { label: "Одежда",       href: "/search?cat=kids&subcategory=clothing" },
        { label: "Мебель",       href: "/search?cat=kids&subcategory=furniture" },
      ]},
      { title: "Развитие", href: "/search?cat=kids&subcategory=school", items: [
        { label: "Книги",        href: "/search?cat=kids&subcategory=books" },
        { label: "Спорт",        href: "/search?cat=kids&subcategory=sport" },
        { label: "Школьное",     href: "/search?cat=kids&subcategory=school" },
        { label: "Репетиторы",   href: "/search?cat=services&subcategory=tutor" },
      ]},
      { title: "Возраст", href: "/search?cat=kids", items: [
        { label: "До 1 года",    href: "/search?cat=kids&age_group=0-1" },
        { label: "1–3 года",     href: "/search?cat=kids&age_group=1-3" },
        { label: "3–7 лет",      href: "/search?cat=kids&age_group=3-7" },
        { label: "7–12 лет",     href: "/search?cat=kids&age_group=7-12" },
        { label: "Подростки",    href: "/search?cat=kids&age_group=12+" },
      ]},
    ],
  },
  {
    title: "Спорт", icon: "⚽", href: "/search?cat=sport",
    accent: "bg-[hsl(var(--nashlo-mint)/0.14)] text-[hsl(var(--nashlo-mint))]",
    groups: [
      { title: "Инвентарь", href: "/search?cat=sport&subcategory=bikes", items: [
        { label: "Велосипеды",    href: "/search?cat=sport&subcategory=bikes" },
        { label: "Тренажёры",     href: "/search?cat=sport&subcategory=fitness" },
        { label: "Лыжи / Борд",   href: "/search?cat=sport&subcategory=skiing" },
        { label: "Самокаты",      href: "/search?cat=sport&subcategory=scooters" },
        { label: "Водный спорт",  href: "/search?cat=sport&subcategory=water" },
      ]},
      { title: "Активный отдых", href: "/search?cat=sport&subcategory=tourism", items: [
        { label: "Туризм / Кемпинг", href: "/search?cat=sport&subcategory=tourism" },
        { label: "Рыбалка",          href: "/search?cat=sport&subcategory=fishing" },
        { label: "Охота",            href: "/search?cat=sport&subcategory=hunting" },
        { label: "Единоборства",     href: "/search?cat=sport&subcategory=martial" },
      ]},
      { title: "Одежда и обувь", href: "/search?cat=fashion&subcategory=sport", items: [
        { label: "Кроссовки",    href: "/search?cat=fashion&subcategory=shoes&gender=men" },
        { label: "Спортивная одежда", href: "/search?cat=fashion&subcategory=sport" },
        { label: "Защита",       href: "/search?cat=sport&q=защита" },
        { label: "Аксессуары",   href: "/search?cat=sport&q=аксессуары" },
      ]},
    ],
  },
  {
    title: "Животные", icon: "🐾", href: "/search?cat=animals",
    accent: "bg-[hsl(var(--nashlo-mint)/0.14)] text-[hsl(var(--nashlo-mint))]",
    groups: [
      { title: "Животные", href: "/search?cat=animals&subcategory=pets", items: [
        { label: "Кошки",       href: "/search?cat=animals&subcategory=cats" },
        { label: "Собаки",      href: "/search?cat=animals&subcategory=dogs" },
        { label: "Птицы",       href: "/search?cat=animals&subcategory=birds" },
        { label: "Грызуны",     href: "/search?cat=animals&subcategory=rodents" },
        { label: "Рыбки",       href: "/search?cat=animals&subcategory=fish" },
      ]},
      { title: "Товары для животных", href: "/search?cat=animals&subcategory=supplies", items: [
        { label: "Корм",         href: "/search?cat=animals&q=корм" },
        { label: "Клетки/вольеры", href: "/search?cat=animals&q=клетка" },
        { label: "Аксессуары",   href: "/search?cat=animals&q=аксессуары" },
        { label: "Ветеринария",  href: "/search?cat=services&subcategory=vet" },
      ]},
      { title: "Сельхоз животные", href: "/search?cat=animals&subcategory=farm", items: [
        { label: "КРС / Скот",  href: "/search?cat=animals&subcategory=farm&q=скот" },
        { label: "Птицеводство",href: "/search?cat=animals&subcategory=farm&q=птица" },
        { label: "Пчеловодство",href: "/search?cat=animals&subcategory=farm&q=пчелы" },
      ]},
    ],
  },
  {
    title: "Другое", icon: "📦", href: "/search?cat=other",
    accent: "bg-zinc-100 text-zinc-600",
    groups: [
      { title: "Разное", href: "/search?cat=other", items: [
        { label: "Антиквариат",  href: "/search?cat=other&q=антиквариат" },
        { label: "Книги",        href: "/search?cat=other&q=книги" },
        { label: "Музыкальные инструменты", href: "/search?cat=other&q=инструменты" },
        { label: "Коллекционирование",      href: "/search?cat=other&q=коллекция" },
        { label: "Игры / Хобби",href: "/search?cat=other&q=хобби" },
      ]},
      { title: "Промышленность", href: "/search?cat=other&subcategory=industry", items: [
        { label: "Оборудование",   href: "/search?cat=other&q=оборудование" },
        { label: "Стройматериалы", href: "/search?cat=other&q=стройматериалы" },
        { label: "Сельхоз техника",href: "/search?cat=other&q=сельхоз" },
        { label: "Медоборудование",href: "/search?cat=other&q=медицинское" },
      ]},
      { title: "Готовый бизнес", href: "/search?cat=other&subcategory=business", items: [
        { label: "Готовый бизнес", href: "/search?cat=other&q=готовый+бизнес" },
        { label: "Франшизы",       href: "/search?cat=other&q=франшиза" },
        { label: "Инвестиции",     href: "/search?cat=other&q=инвестиции" },
      ]},
    ],
  },
]

export function Header() {
  const pathname = usePathname()
  const [activeIndex, setActiveIndex] = useState(0)
  const [user, setUser] = useState<DemoUser | null>(null)
  const [loginOpen, setLoginOpen] = useState(false)
  const [selectedCity, setSelectedCity] = useState("Санкт-Петербург")
  const [cityQuery, setCityQuery] = useState("")
  const [isCityOpen, setIsCityOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [unreadChats, setUnreadChats] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()
  const activeCategory = categoryMenu[activeIndex]

  const filteredCities = useMemo(() => {
    const query = cityQuery.trim().toLowerCase()
    if (!query) return cities
    return cities.filter((city) => city.toLowerCase().includes(query))
  }, [cityQuery])

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
    const storedCity = window.localStorage.getItem("nashlo-city")
    if (storedCity) setSelectedCity(storedCity)
  }, [])

  // Close dropdowns on route change
  useEffect(() => {
    setIsCityOpen(false)
    setIsProfileOpen(false)
  }, [pathname])

  function chooseCity(city: string) {
    setSelectedCity(city)
    setCityQuery("")
    setIsCityOpen(false)
    window.localStorage.setItem("nashlo-city", city)
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {}
    window.dispatchEvent(new Event("nashlo-auth-change"))
    setUser(null)
    setIsProfileOpen(false)
  }

  const initials = user?.name?.trim().slice(0, 1).toUpperCase() || "O"

  const cityLabel = selectedCity.length > 10 ? selectedCity.slice(0, 9) + "…" : selectedCity

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = searchQuery.trim()
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    if (selectedCity && selectedCity !== "Везде") params.set("city", selectedCity)
    router.push(`/search?${params.toString()}`)
  }

  if (pathname === "/login" || pathname === "/register" || pathname === "/admin/login") return null

  return (
    <>
      <header className="relative z-50 border-b border-zinc-200 bg-white">
        <input id="catalog-menu-toggle" type="checkbox" className="peer sr-only" />

        {/* ── MOBILE LAYOUT (< lg) ────────────────────────── */}
        <div className="px-4 pb-2 pt-[calc(env(safe-area-inset-top)+0.75rem)] lg:hidden">
          {/* Row 1: Logo + city + create */}
          <div className="flex items-center gap-2 mb-2.5">
            <Logo compact />
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => setIsCityOpen((v) => !v)}
              className="flex h-9 max-w-[100px] shrink-0 items-center gap-1 rounded-xl border border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-700"
            >
              <span className="text-[hsl(var(--nashlo-orange))] text-sm leading-none">⌖</span>
              <span className="truncate">{cityLabel}</span>
            </button>
            <Link
              href="/create"
              className="flex h-9 shrink-0 items-center gap-1 rounded-xl bg-[hsl(var(--nashlo-orange))] px-3 text-xs font-semibold text-white shadow-sm"
            >
              <span className="text-base leading-none">+</span>
              <span>Разместить</span>
            </Link>
          </div>

          {/* Row 2: Search */}
          <form onSubmit={handleSearch} className="flex h-11 min-w-0 items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 shadow-inner shadow-zinc-950/[0.03]">
            <span className="text-zinc-400">⌕</span>
            <input
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
              placeholder={`Поиск в ${cityLabel}`}
              aria-label="Поиск по объявлениям"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button type="submit" className="shrink-0 rounded-lg bg-zinc-950 px-2 py-0.5 text-xs font-medium text-white">
                Найти
              </button>
            )}
          </form>

          {/* Row 3: Category chips */}
          <div className="mt-2 -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <label
              htmlFor="catalog-menu-toggle"
              className="flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-zinc-950 px-3 text-xs font-semibold text-white"
            >
              <span className="text-sm leading-none">▦</span>
              <span>Каталог</span>
            </label>
            {categoryMenu.map((cat) => (
              <Link
                key={cat.title}
                href={cat.href}
                className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 active:bg-zinc-100"
              >
                <span className="text-base leading-none">{cat.icon}</span>
                <span>{cat.title}</span>
              </Link>
            ))}
          </div>

          {isCityOpen && (
            <div className="fixed inset-0 z-[160]" onClick={() => setIsCityOpen(false)}>
              {/* Backdrop */}
              <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm" />
              {/* Sheet */}
              <div
                className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-hidden rounded-t-3xl bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-center pt-3">
                  <div className="h-1 w-10 rounded-full bg-zinc-200" />
                </div>
                <div className="border-b border-zinc-100 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-semibold text-zinc-950">Выберите город</p>
                    <button type="button" onClick={() => setIsCityOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 text-lg">×</button>
                  </div>
                  <input
                    value={cityQuery}
                    onChange={(e) => setCityQuery(e.target.value)}
                    placeholder="Найти город"
                    className="mt-3 h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-blue))]"
                    autoFocus
                  />
                </div>
                <div className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">Популярные</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {popularCities.map((city) => (
                      <button key={city} type="button" onClick={() => chooseCity(city)}
                        className={`rounded-full px-3 py-2.5 text-sm font-semibold transition active:scale-95 ${selectedCity === city ? "bg-[hsl(var(--nashlo-blue))] text-white" : "bg-zinc-100 text-zinc-700"}`}>
                        {city}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="max-h-[42vh] overflow-y-auto px-2 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
                  {filteredCities.map((city) => (
                    <button key={city} type="button" onClick={() => chooseCity(city)}
                      className={`flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left text-sm transition active:bg-zinc-100 ${selectedCity === city ? "bg-zinc-950 font-semibold text-white" : "text-zinc-700"}`}>
                      <span>{city}</span>
                      {selectedCity === city && <span className="text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          </div>

        {/* ── DESKTOP LAYOUT (lg+) — 2 rows ───────────────── */}
        <div className="mx-auto hidden max-w-7xl px-4 lg:block">

          {/* Row 1: Logo · nav links · auth · CTA */}
          <div className="flex items-center gap-2 border-b border-zinc-100 py-2.5">
            <Logo />
            <div className="flex-1" />

            <Link href="/advertising" className="text-xs font-medium text-zinc-400 transition hover:text-zinc-950 hover:underline underline-offset-2">
              Заказать рекламу
            </Link>

            <div className="mx-1 h-4 w-px bg-zinc-200" />

            <Link href="/favorites" className="flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950">
              <span className="text-lg leading-none">♡</span>
              <span>Избранное</span>
            </Link>
            <Link href="/my-listings" className="flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950">
              <span className="text-base leading-none">☰</span>
              <span>Мои объявления</span>
            </Link>
            <Link href="/chat" className="relative flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950">
              {unreadChats > 0 && (
                <span className="absolute right-1 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[hsl(var(--nashlo-orange))] px-0.5 text-[9px] font-bold text-white">
                  {unreadChats}
                </span>
              )}
              <span className="text-base leading-none">◌</span>
              <span>Сообщения</span>
            </Link>

            <div className="mx-1 h-5 w-px bg-zinc-200" />

            {/* Desktop auth */}
            {!user ? (
              <>
                <button
                  onClick={() => setLoginOpen(true)}
                  className="flex h-9 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50">
                  Войти
                </button>
                <button
                  onClick={() => router.push("/register")}
                  className="flex h-9 items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-700">
                  Регистрация
                </button>
              </>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen((v) => !v)}
                  className="flex h-9 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-800 shadow-sm transition hover:border-zinc-300"
                  aria-label="Профиль"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--nashlo-orange))] text-xs font-bold text-white">
                    {initials}
                  </span>
                  <span className="max-w-28 truncate">{user.name || "Профиль"}</span>
                  <span className="text-zinc-400 text-xs">{isProfileOpen ? "⌃" : "⌄"}</span>
                </button>
                {isProfileOpen && (
                  <div className="absolute right-0 top-11 z-[140] w-52 pt-1">
                    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-950/15">
                      <div className="p-1.5">
                        <Link href="/profile" onClick={() => setIsProfileOpen(false)} className="block rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950">Мой профиль</Link>
                        <Link href="/my-listings" onClick={() => setIsProfileOpen(false)} className="block rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950">Мои объявления</Link>
                        <Link href="/profile/settings" onClick={() => setIsProfileOpen(false)} className="block rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950">Настройки</Link>
                        <div className="my-1 h-px bg-zinc-100" />
                        <button type="button" onClick={logout}
                          className="block w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium text-zinc-400 hover:bg-zinc-100 hover:text-zinc-950">
                          Выйти
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Link href="/create"
              className="inline-flex h-9 items-center justify-center rounded-xl bg-[hsl(var(--nashlo-orange))] px-4 text-sm font-semibold text-white shadow-sm shadow-[hsl(var(--nashlo-orange)/0.22)] transition hover:bg-[hsl(var(--nashlo-orange)/0.9)]">
              + Разместить
            </Link>
          </div>

          {/* Row 2: Categories · Search · City */}
          <div className="flex items-center gap-3 py-3">
            <label htmlFor="catalog-menu-toggle"
              className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[hsl(var(--nashlo-orange))] px-4 text-sm font-semibold text-white shadow-sm shadow-[hsl(var(--nashlo-orange)/0.22)] transition hover:bg-[hsl(var(--nashlo-orange)/0.9)] shrink-0">
              <span className="text-base leading-none">▦</span>
              <span>Каталог</span>
            </label>

            <form onSubmit={handleSearch} className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 shadow-inner shadow-zinc-950/[0.03]">
              <span className="text-zinc-400 text-base">⌕</span>
              <input
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
                placeholder="Поиск по объявлениям"
                aria-label="Поиск по объявлениям"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="shrink-0 rounded-lg bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-700">
                Найти
              </button>
            </form>

            {/* City selector desktop */}
            <div className="relative shrink-0">
              <button type="button" onClick={() => setIsCityOpen((v) => !v)}
                className="inline-flex h-11 max-w-48 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
                aria-expanded={isCityOpen}>
                <span className="text-[hsl(var(--nashlo-orange))] text-base">⌖</span>
                <span className="max-w-32 truncate">{selectedCity}</span>
                <span className="text-zinc-400 text-xs">⌄</span>
              </button>
              {isCityOpen && (
                <div className="absolute right-0 top-14 z-[120] w-[min(92vw,420px)] overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-950/15">
                  <div className="border-b border-zinc-100 p-4">
                    <p className="text-base font-semibold text-zinc-950">Выберите город</p>
                    <input value={cityQuery} onChange={(e) => setCityQuery(e.target.value)}
                      placeholder="Найти город" autoFocus
                      className="mt-3 h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none transition focus:border-[hsl(var(--nashlo-blue))] focus:bg-white" />
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">Популярные</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {popularCities.map((city) => (
                        <button key={city} type="button" onClick={() => chooseCity(city)}
                          className={`rounded-full px-3 py-2 text-sm font-semibold transition ${selectedCity === city ? "bg-[hsl(var(--nashlo-blue))] text-white" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-950 hover:text-white"}`}>
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="max-h-72 overflow-y-auto px-2 pb-3">
                    {filteredCities.map((city) => (
                      <button key={city} type="button" onClick={() => chooseCity(city)}
                        className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm transition ${selectedCity === city ? "bg-zinc-950 font-semibold text-white" : "text-zinc-700 hover:bg-zinc-100"}`}>
                        <span>{city}</span>
                        {selectedCity === city && <span>✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── CATEGORY MEGA MENU ───────────────────────────── */}
        <div className="absolute inset-x-0 top-full z-[100] hidden border-t border-zinc-200 bg-white shadow-2xl shadow-zinc-950/10 peer-checked:block">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[320px_1fr_260px]">
            <nav className="rounded-3xl bg-zinc-100 p-2">
              {categoryMenu.map((category, index) => (
                <button key={category.title} type="button" onClick={() => setActiveIndex(index)}
                  className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${activeIndex === index ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-700 hover:bg-white/70"}`}>
                  <span className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-xl">{category.icon}</span>
                    {category.title}
                  </span>
                  <span>›</span>
                </button>
              ))}
            </nav>
            <section>
              <div className="flex items-start justify-between gap-4">
                <Link href={activeCategory.href} className="inline-flex items-center gap-2 text-3xl font-semibold tracking-tight text-zinc-950 hover:text-zinc-600">
                  {activeCategory.title} <span>›</span>
                </Link>
                <div className="flex gap-2">
                  <Link href="/categories" className="rounded-full bg-zinc-100 px-3 py-1.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-950 hover:text-white">Все категории</Link>
                  <label htmlFor="catalog-menu-toggle" className="cursor-pointer rounded-full bg-zinc-100 px-3 py-1.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-950 hover:text-white">Закрыть</label>
                </div>
              </div>
              <div className="mt-6 grid gap-8 md:grid-cols-3">
                {activeCategory.groups.map((group) => (
                  <div key={group.title}>
                    <Link href={group.href} className="text-base font-semibold text-zinc-950 hover:text-zinc-600">
                      {group.title} ›
                    </Link>
                    <ul className="mt-3 space-y-2">
                      {group.items.map((item) => (
                        <li key={item.label}>
                          <Link href={item.href} className="text-sm text-zinc-600 transition hover:text-zinc-950 hover:underline underline-offset-2">
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
            <aside className="rounded-3xl bg-zinc-100 p-5">
              <div className={`mb-4 h-14 w-14 rounded-2xl ${activeCategory.accent}`} />
              <h3 className="text-lg font-semibold text-zinc-950">Сервисы Нашло</h3>
              <ul className="mt-4 space-y-3 text-sm text-zinc-700">
                <li>Проверка продавца</li>
                <li>Безопасная сделка</li>
                <li>История объявления</li>
                <li>Договор купли-продажи</li>
                <li>Продвижение объявлений</li>
              </ul>
              <Link href="/services" className="mt-6 block rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-zinc-950 hover:bg-zinc-950 hover:text-white">
                Смотреть сервисы
              </Link>
            </aside>
          </div>
        </div>
      </header>

      {/* ── MOBILE BOTTOM NAV ───────────────────────────────── */}
      <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        <div className="flex items-center">
          <Link href="/" className="flex flex-1 flex-col items-center gap-0.5 py-3 text-zinc-500 hover:text-zinc-950">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7m-9 2v8m0 0h4m-4 0H7" /></svg>
            <span className="text-[10px] font-medium">Главная</span>
          </Link>
          <Link href="/favorites" className="flex flex-1 flex-col items-center gap-0.5 py-3 text-zinc-500 hover:text-zinc-950">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" /></svg>
            <span className="text-[10px] font-medium">Избранное</span>
          </Link>
          <Link href="/my-listings" className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[hsl(var(--nashlo-orange))]">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[hsl(var(--nashlo-orange))] text-white shadow-md shadow-[hsl(var(--nashlo-orange)/0.3)]">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 6h11M8 12h11M8 18h11M4 6h.01M4 12h.01M4 18h.01" /></svg>
            </span>
            <span className="text-[10px] font-semibold">Объявления</span>
          </Link>
          <Link href="/chat" className="relative flex flex-1 flex-col items-center gap-0.5 py-3 text-zinc-500 hover:text-zinc-950">
            <span className="relative">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12c0 4.142-4.03 7.5-9 7.5a10.4 10.4 0 01-3.57-.62L3 20.25l1.5-4.5A6.88 6.88 0 013 12c0-4.142 4.03-7.5 9-7.5s9 3.358 9 7.5z" /></svg>
              {unreadChats > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[hsl(var(--nashlo-orange))] text-[9px] font-bold text-white">
                  {unreadChats > 9 ? "9+" : unreadChats}
                </span>
              )}
            </span>
            <span className="text-[10px] font-medium">Сообщения</span>
          </Link>
          {!user ? (
            <Link href="/login" className="flex flex-1 flex-col items-center gap-0.5 py-3 text-zinc-500 hover:text-zinc-950">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
              <span className="text-[10px] font-medium">Войти</span>
            </Link>
          ) : (
            <button type="button" onClick={() => setIsProfileOpen(true)} className="flex flex-1 flex-col items-center gap-0.5 py-3 text-zinc-500 hover:text-zinc-950">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(var(--nashlo-orange))] text-xs font-bold text-white">{initials}</span>
              <span className="text-[10px] font-medium">Профиль</span>
            </button>
          )}
        </div>
      </nav>

      {/* ── MOBILE PROFILE SHEET ────────────────────────────── */}
      {isProfileOpen && user && (
        <div className="fixed inset-0 z-[160] lg:hidden" onClick={() => setIsProfileOpen(false)}>
          <div className="absolute inset-0 bg-zinc-950/40" />
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-zinc-200" />
            </div>
            {/* User info */}
            <div className="flex items-center gap-3 border-b border-zinc-100 px-6 py-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--nashlo-orange))] text-lg font-bold text-white">{initials}</div>
              <div>
                <p className="font-semibold text-zinc-950">{user.name}</p>
                <p className="text-sm text-zinc-500">{user.email || user.phone}</p>
              </div>
            </div>
            {/* Menu */}
            <div className="p-3">
              {[
                { href: "/profile", label: "Мой профиль" },
                { href: "/my-listings", label: "Мои объявления" },
                { href: "/create", label: "Разместить объявление" },
                { href: "/chat", label: "Сообщения" },
                { href: "/favorites", label: "Избранное" },
              ].map((item) => (
                <a key={item.href} href={item.href} className="flex items-center rounded-2xl px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-50">
                  {item.label}
                </a>
              ))}
            </div>
            <div className="border-t border-zinc-100 p-3">
              <button
                onClick={() => { setIsProfileOpen(false); logout() }}
                className="flex w-full items-center rounded-2xl px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      )}

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  )
}
