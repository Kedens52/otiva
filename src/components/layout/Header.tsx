"use client"

import { totalUnread, seedConversations } from "@/lib/chat-store"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Logo } from "@/components/layout/Logo"

type DemoUser = {
  name?: string
  phone?: string
  email?: string
}

const navItems = [
  { href: "/profile/demo", label: "Мои объявления" },
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

const categoryMenu = [
  { title: "Транспорт", icon: "▰", href: "/cars", accent: "bg-[hsl(var(--otiva-mint)/0.14)] text-[hsl(var(--otiva-mint))]", groups: [{ title: "Автомобили", items: ["С пробегом","Новые","Электромобили","Коммерческие"] },{ title: "Мотоциклы и мототехника", items: ["Мотоциклы","Скутеры","Квадроциклы","Снегоходы"] },{ title: "Запчасти и аксессуары", items: ["Шины и диски","Аудио","Багажники","Расходники"] }] },
  { title: "Недвижимость", icon: "▥", href: "/real-estate", accent: "bg-[hsl(var(--otiva-blue)/0.13)] text-[hsl(var(--otiva-blue))]", groups: [{ title: "Купить", items: ["Квартиры","Комнаты","Дома","Участки"] },{ title: "Снять", items: ["Посуточно","Долгосрочно","Апартаменты","Офисы"] },{ title: "Новостройки", items: ["ЖК","Паркинги","Кладовые","Коммерция"] }] },
  { title: "Услуги", icon: "◆", href: "/services", accent: "bg-[hsl(var(--otiva-orange)/0.14)] text-[hsl(var(--otiva-orange))]", groups: [{ title: "Для дома", items: ["Ремонт","Уборка","Сантехника","Электрика"] },{ title: "Деловые услуги", items: ["Дизайн","Маркетинг","Юристы","Бухгалтерия"] },{ title: "Доставка", items: ["Курьеры","Грузчики","Переезды","Такси"] }] },
  { title: "Электроника", icon: "◧", href: "/electronics", accent: "bg-[hsl(var(--otiva-blue)/0.13)] text-[hsl(var(--otiva-blue))]", groups: [{ title: "Гаджеты", items: ["Смартфоны","Планшеты","Часы","Наушники"] },{ title: "Компьютеры", items: ["Ноутбуки","ПК","Мониторы","Комплектующие"] },{ title: "Развлечения", items: ["Консоли","Игры","Фото","ТВ"] }] },
  { title: "Дом и интерьер", icon: "▤", href: "/home", accent: "bg-[hsl(var(--otiva-orange)/0.14)] text-[hsl(var(--otiva-orange))]", groups: [{ title: "Мебель", items: ["Диваны","Столы","Кровати","Хранение"] },{ title: "Быт", items: ["Техника","Посуда","Текстиль","Свет"] },{ title: "Дача", items: ["Инструменты","Сад","Растения","Стройка"] }] },
  { title: "Одежда", icon: "◒", href: "/fashion", accent: "bg-[hsl(var(--otiva-orange)/0.14)] text-[hsl(var(--otiva-orange))]", groups: [{ title: "Женское", items: ["Верхняя одежда","Обувь","Сумки","Аксессуары"] },{ title: "Мужское", items: ["Куртки","Кроссовки","Рубашки","Часы"] },{ title: "Бренды", items: ["Премиум","Винтаж","Спорт","Новые вещи"] }] },
  { title: "Детям", icon: "◌", href: "/kids", accent: "bg-[hsl(var(--otiva-mint)/0.14)] text-[hsl(var(--otiva-mint))]", groups: [{ title: "Товары", items: ["Коляски","Кроватки","Игрушки","Одежда"] },{ title: "Развитие", items: ["Кружки","Репетиторы","Книги","Спорт"] },{ title: "Уход", items: ["Питание","Гигиена","Автокресла","Манежи"] }] },
  { title: "Спорт", icon: "●", href: "/sport", accent: "bg-[hsl(var(--otiva-mint)/0.14)] text-[hsl(var(--otiva-mint))]", groups: [{ title: "Инвентарь", items: ["Велосипеды","Тренажеры","Лыжи","Самокаты"] },{ title: "Активный отдых", items: ["Туризм","Рыбалка","Кемпинг","Лодки"] },{ title: "Форма", items: ["Кроссовки","Одежда","Защита","Аксессуары"] }] },
]

export function Header() {
  const pathname = usePathname()
  const [activeIndex, setActiveIndex] = useState(0)
  const [user, setUser] = useState<DemoUser | null>(null)
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
    function syncUser() {
      const stored = window.localStorage.getItem("otiva-demo-user")
      setUser(stored ? JSON.parse(stored) : null)
    }
    syncUser()
    window.addEventListener("storage", syncUser)
    window.addEventListener("otiva-auth-change", syncUser)
    return () => {
      window.removeEventListener("storage", syncUser)
      window.removeEventListener("otiva-auth-change", syncUser)
    }
  }, [])

  useEffect(() => {
    const storedCity = window.localStorage.getItem("otiva-city")
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
    window.localStorage.setItem("otiva-city", city)
  }

  function logout() {
    window.localStorage.removeItem("otiva-demo-user")
    window.dispatchEvent(new Event("otiva-auth-change"))
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
        <div className="lg:hidden">
          {/* Row 1: Logo · City · Auth */}
          <div className="flex items-center gap-2 px-4 pt-5 pb-1">
            <Logo />

            {/* City compact */}
            <div className="relative ml-1">
              <button
                type="button"
                onClick={() => setIsCityOpen((v) => !v)}
                className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-2.5 py-2 text-xs font-semibold text-zinc-700 shadow-sm"
              >
                <span className="text-[hsl(var(--otiva-orange))] text-sm leading-none">⌖</span>
                <span className="max-w-[80px] truncate">{cityLabel}</span>
                <span className="text-zinc-400 text-xs">⌄</span>
              </button>
              {isCityOpen && (
                <div className="fixed inset-x-0 bottom-0 z-[160] max-h-[82vh] overflow-hidden rounded-t-3xl border border-zinc-200 bg-white shadow-2xl">
                  <div className="flex justify-center pt-3">
                    <div className="h-1 w-10 rounded-full bg-zinc-200" />
                  </div>
                  <div className="border-b border-zinc-100 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-base font-semibold text-zinc-950">Выберите город</p>
                      <button type="button" onClick={() => setIsCityOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">×</button>
                    </div>
                    <input
                      value={cityQuery}
                      onChange={(e) => setCityQuery(e.target.value)}
                      placeholder="Найти город"
                      className="mt-3 h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none focus:border-[hsl(var(--otiva-blue))]"
                      autoFocus
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">Популярные</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {popularCities.map((city) => (
                        <button key={city} type="button" onClick={() => chooseCity(city)}
                          className={`rounded-full px-3 py-2 text-sm font-semibold transition ${selectedCity === city ? "bg-[hsl(var(--otiva-blue))] text-white" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-950 hover:text-white"}`}>
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="max-h-[48vh] overflow-y-auto px-2 pb-6">
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

            <div className="flex-1" />

            {/* Auth button */}
            {!user ? (
              <Link href="/login"
                className="flex h-9 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 shadow-sm">
                Войти
              </Link>
            ) : null}
          </div>

          {/* Row 2: Search */}
          <div className="px-4 pt-2 pb-3">
            <form onSubmit={handleSearch} className="flex h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 shadow-inner shadow-zinc-950/[0.03]">
              <span className="text-zinc-400">⌕</span>
              <input
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
                placeholder="Поиск по объявлениям"
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
          </div>
        </div>

        {/* ── DESKTOP LAYOUT (lg+) ─────────────────────────── */}
        <div className="mx-auto hidden max-w-7xl px-4 lg:block">
          <div className="flex items-center gap-3 pt-5 pb-2">
            <Logo />
            <label htmlFor="catalog-menu-toggle"
              className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[hsl(var(--otiva-orange))] px-4 text-sm font-semibold text-white shadow-sm shadow-[hsl(var(--otiva-orange)/0.22)] transition hover:bg-[hsl(var(--otiva-orange)/0.9)]">
              <span className="text-base leading-none">▦</span>
              <span>Категории</span>
            </label>
            <form onSubmit={handleSearch} className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 shadow-inner shadow-zinc-950/[0.03]">
              <span className="text-zinc-400">⌕</span>
              <input
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
                placeholder="Поиск по объявлениям"
                aria-label="Поиск по объявлениям"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="shrink-0 rounded-lg bg-zinc-950 px-3 py-1 text-xs font-semibold text-white transition hover:bg-zinc-700">
                Найти
              </button>
            </form>

            {/* City selector desktop */}
            <div className="relative">
              <button type="button" onClick={() => setIsCityOpen((v) => !v)}
                className="inline-flex h-11 max-w-44 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
                aria-expanded={isCityOpen}>
                <span className="text-[hsl(var(--otiva-orange))]">⌖</span>
                <span className="max-w-28 truncate">{selectedCity}</span>
                <span className="text-zinc-400">⌄</span>
              </button>
              {isCityOpen && (
                <div className="absolute right-0 top-14 z-[120] w-[min(92vw,420px)] overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-950/15">
                  <div className="border-b border-zinc-100 p-4">
                    <p className="text-base font-semibold text-zinc-950">Выберите город</p>
                    <input value={cityQuery} onChange={(e) => setCityQuery(e.target.value)}
                      placeholder="Найти город" autoFocus
                      className="mt-3 h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none transition focus:border-[hsl(var(--otiva-blue))] focus:bg-white" />
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">Популярные</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {popularCities.map((city) => (
                        <button key={city} type="button" onClick={() => chooseCity(city)}
                          className={`rounded-full px-3 py-2 text-sm font-semibold transition ${selectedCity === city ? "bg-[hsl(var(--otiva-blue))] text-white" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-950 hover:text-white"}`}>
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

            <Link href="/favorites" className="flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950">
              <span className="text-xl leading-none">♡</span>
              <span className="hidden xl:inline">Избранное</span>
            </Link>
            <Link href="/my-listings" className="flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950">
              <span className="text-lg leading-none">☰</span>
              <span className="hidden xl:inline">Мои объявления</span>
            </Link>
            <Link href="/chat" className="relative flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950">
                {unreadChats > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[hsl(var(--otiva-orange))] px-1 text-[10px] font-bold text-white">
                    {unreadChats}
                  </span>
                )}
              <span className="text-lg leading-none">◌</span>
              <span className="hidden xl:inline">Сообщения</span>
            </Link>

            {/* Desktop auth */}
            {!user ? (
              <Link href="/login"
                className="flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50">
                Войти
              </Link>
            ) : (
              <div className="group relative">
                <button type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-[hsl(var(--otiva-orange))] text-sm font-bold text-white shadow-sm transition hover:opacity-90"
                  aria-label="Профиль">
                  {initials}
                </button>
                <div className="pointer-events-none absolute right-0 top-11 z-[140] w-52 pt-2 opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
                  <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-950/15">
                    <div className="p-1.5">
                      <Link href="/profile/demo" className="block rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950">Мой профиль</Link>
                      <Link href="/my-listings" className="block rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950">Мои объявления</Link>
                      <Link href="/settings" className="block rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950">Настройки</Link>
                      <div className="my-1 h-px bg-zinc-100" />
                      <button type="button" onClick={logout}
                        className="block w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium text-zinc-400 hover:bg-zinc-100 hover:text-zinc-950">
                        Выйти
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Link href="/create"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[hsl(var(--otiva-orange))] px-4 text-sm font-semibold text-white shadow-sm shadow-[hsl(var(--otiva-orange)/0.22)] transition hover:bg-[hsl(var(--otiva-orange)/0.9)]">
              Разместить
            </Link>
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
                    <img src={`/categories/${category.href.replace("/", "")}.svg`} alt="" className="h-8 w-8 rounded-xl object-cover shadow-sm" />
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
                    <h3 className="text-base font-semibold text-zinc-950">{group.title} ›</h3>
                    <ul className="mt-3 space-y-2">
                      {group.items.map((item) => (
                        <li key={item}><Link href={activeCategory.href} className="text-sm text-zinc-700 hover:text-zinc-950">{item}</Link></li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
            <aside className="rounded-3xl bg-zinc-100 p-5">
              <div className={`mb-4 h-14 w-14 rounded-2xl ${activeCategory.accent}`} />
              <h3 className="text-lg font-semibold text-zinc-950">Сервисы Otiva</h3>
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
      <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-zinc-200 bg-white/95 backdrop-blur-md lg:hidden">
        <div className="flex items-center">
          <Link href="/" className="flex flex-1 flex-col items-center gap-0.5 py-3 text-zinc-500 hover:text-zinc-950">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7m-9 2v8m0 0h4m-4 0H7" /></svg>
            <span className="text-[10px] font-medium">Главная</span>
          </Link>
          <Link href="/categories" className="flex flex-1 flex-col items-center gap-0.5 py-3 text-zinc-500 hover:text-zinc-950">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            <span className="text-[10px] font-medium">Каталог</span>
          </Link>
          <Link href="/my-listings" className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[hsl(var(--otiva-orange))]">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[hsl(var(--otiva-orange))] text-white shadow-md shadow-[hsl(var(--otiva-orange)/0.3)]">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 6h11M8 12h11M8 18h11M4 6h.01M4 12h.01M4 18h.01" /></svg>
            </span>
            <span className="text-[10px] font-semibold">Объявления</span>
          </Link>
          <Link href="/favorites" className="flex flex-1 flex-col items-center gap-0.5 py-3 text-zinc-500 hover:text-zinc-950">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" /></svg>
            <span className="text-[10px] font-medium">Избранное</span>
          </Link>
          {!user ? (
            <Link href="/login" className="flex flex-1 flex-col items-center gap-0.5 py-3 text-zinc-500 hover:text-zinc-950">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
              <span className="text-[10px] font-medium">Войти</span>
            </Link>
          ) : (
            <button type="button" onClick={() => setIsProfileOpen(true)} className="flex flex-1 flex-col items-center gap-0.5 py-3 text-zinc-500 hover:text-zinc-950">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(var(--otiva-orange))] text-xs font-bold text-white">{initials}</span>
              <span className="text-[10px] font-medium">Профиль</span>
            </button>
          )}
        </div>
      </nav>

      {/* ── MOBILE PROFILE SHEET ────────────────────────────── */}
      {isProfileOpen && user && (
        <div className="fixed inset-0 z-[160] lg:hidden" onClick={() => setIsProfileOpen(false)}>
          <div className="absolute inset-0 bg-zinc-950/40" />
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-zinc-200" />
            </div>
            {/* User info */}
            <div className="flex items-center gap-3 border-b border-zinc-100 px-6 py-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--otiva-orange))] text-lg font-bold text-white">{initials}</div>
              <div>
                <p className="font-semibold text-zinc-950">{user.name}</p>
                <p className="text-sm text-zinc-500">{user.email || user.phone}</p>
              </div>
            </div>
            {/* Menu */}
            <div className="p-3">
              {[
                { href: "/profile/demo", label: "Мой профиль" },
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
    </>
  )
}
