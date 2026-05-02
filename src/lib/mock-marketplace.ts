export type ListingCategory =
  | "free"
  | "cars"
  | "real-estate"
  | "services"
  | "electronics"
  | "home"
  | "fashion"
  | "kids"
  | "sport"

export type MarketplaceListing = {
  id: string
  category: ListingCategory
  title: string
  subtitle: string
  price: number
  city: string
  district?: string
  imageTone: string
  promoted?: boolean
  tags: string[]
  description: string
  seller: {
    name: string
    rating: number
    since: string
    verified: boolean
  }
  specs: Record<string, string>
}

export const marketplaceCategories: Array<{
  slug: ListingCategory
  href: string
  title: string
  caption: string
  count: string
  tone: string
}> = [
  {
    slug: "free",
    href: "/free",
    title: "Бесплатно",
    caption: "Вещи, которые отдают даром или за самовывоз",
    count: "32 объявления",
    tone: "from-[hsl(var(--nashlo-orange))] to-amber-300",
  },
  {
    slug: "cars",
    href: "/cars",
    title: "Авто",
    caption: "Машины с понятной историей и быстрым подбором",
    count: "128 объявлений",
    tone: "from-[hsl(var(--nashlo-mint))] to-zinc-400",
  },
  {
    slug: "real-estate",
    href: "/real-estate",
    title: "Недвижимость",
    caption: "Квартиры, дома и апартаменты для жизни",
    count: "84 объекта",
    tone: "from-[hsl(var(--nashlo-blue))] to-zinc-300",
  },
  {
    slug: "services",
    href: "/services",
    title: "Услуги",
    caption: "Ремонт, доставка, мастера и специалисты",
    count: "213 специалистов",
    tone: "from-[hsl(var(--nashlo-orange))] to-zinc-300",
  },
  {
    slug: "electronics",
    href: "/electronics",
    title: "Электроника",
    caption: "Смартфоны, ноутбуки, консоли и техника",
    count: "96 товаров",
    tone: "from-[hsl(var(--nashlo-blue))] to-zinc-500",
  },
  {
    slug: "home",
    href: "/home",
    title: "Дом и интерьер",
    caption: "Мебель, свет, декор и бытовые вещи",
    count: "141 товар",
    tone: "from-[hsl(var(--nashlo-orange))] to-stone-300",
  },
  {
    slug: "fashion",
    href: "/fashion",
    title: "Одежда",
    caption: "Бренды, аксессуары и капсульный гардероб",
    count: "178 товаров",
    tone: "from-zinc-950 to-[hsl(var(--nashlo-orange)/0.45)]",
  },
  {
    slug: "kids",
    href: "/kids",
    title: "Детям",
    caption: "Коляски, игрушки, одежда и обучение",
    count: "74 объявления",
    tone: "from-[hsl(var(--nashlo-mint))] to-zinc-200",
  },
  {
    slug: "sport",
    href: "/sport",
    title: "Спорт",
    caption: "Велосипеды, тренажеры и активный отдых",
    count: "58 товаров",
    tone: "from-zinc-900 to-[hsl(var(--nashlo-mint)/0.55)]",
  },
]

export const listings: MarketplaceListing[] = [
  {
    id: "1",
    category: "cars",
    title: "BMW 5 Series 2021",
    subtitle: "530i xDrive, один владелец",
    price: 2500000,
    city: "Москва",
    district: "Хамовники",
    imageTone: "from-zinc-950 via-zinc-700 to-zinc-300",
    promoted: true,
    tags: ["Седан", "Бензин", "Полный привод"],
    description:
      "Автомобиль в отличном состоянии, обслуживался у официального дилера. Богатая комплектация, прозрачная история, готов к проверке.",
    seller: { name: "Алексей Морозов", rating: 4.9, since: "на Нашло с 2022", verified: true },
    specs: {
      Год: "2021",
      Пробег: "48 000 км",
      Двигатель: "2.0 л, бензин",
      Коробка: "Автомат",
      Привод: "Полный",
      Цвет: "Графитовый",
    },
  },
  {
    id: "2",
    category: "cars",
    title: "Mercedes-Benz E-Class",
    subtitle: "E 200 Avantgarde, отличная комплектация",
    price: 3200000,
    city: "Санкт-Петербург",
    district: "Петроградская",
    imageTone: "from-zinc-900 via-neutral-500 to-zinc-200",
    promoted: true,
    tags: ["Седан", "Автомат", "Комфорт"],
    description:
      "Комфортный бизнес-седан с аккуратным салоном, камерой, ассистентами и зимним пакетом. Без срочных вложений.",
    seller: { name: "Марина Волкова", rating: 4.8, since: "на Нашло с 2021", verified: true },
    specs: {
      Год: "2020",
      Пробег: "62 000 км",
      Двигатель: "2.0 л, бензин",
      Коробка: "Автомат",
      Привод: "Задний",
      Цвет: "Белый металлик",
    },
  },
  {
    id: "3",
    category: "cars",
    title: "Tesla Model 3 Long Range",
    subtitle: "Полный привод, максимальная батарея",
    price: 4100000,
    city: "Москва",
    district: "Пресня",
    imageTone: "from-neutral-950 via-zinc-800 to-zinc-200",
    tags: ["Электро", "AWD", "Autopilot"],
    description:
      "Свежая Tesla с большим запасом хода, ухоженным интерьером и домашней зарядкой в комплекте.",
    seller: { name: "Илья Соколов", rating: 4.7, since: "на Нашло с 2023", verified: true },
    specs: {
      Год: "2022",
      Пробег: "31 000 км",
      Двигатель: "Электро",
      Коробка: "Редуктор",
      Привод: "Полный",
      Цвет: "Синий",
    },
  },
  {
    id: "4",
    category: "real-estate",
    title: "Светлая квартира у парка",
    subtitle: "2 комнаты, панорамные окна",
    price: 18500000,
    city: "Москва",
    district: "Сокол",
    imageTone: "from-zinc-100 via-zinc-200 to-stone-400",
    promoted: true,
    tags: ["68 м²", "2 комнаты", "Парк рядом"],
    description:
      "Тихий дом, дизайнерский ремонт, подземный паркинг и зеленый двор без машин.",
    seller: { name: "Нашло Realty", rating: 5, since: "партнер Нашло", verified: true },
    specs: {
      Площадь: "68 м²",
      Комнаты: "2",
      Этаж: "9 из 17",
      Метро: "Сокол, 8 минут",
      Ремонт: "Современный",
      Документы: "Готовы",
    },
  },
  {
    id: "5",
    category: "services",
    title: "Ремонт квартиры под ключ",
    subtitle: "Дизайн, материалы, контроль сроков",
    price: 150000,
    city: "Москва",
    imageTone: "from-stone-100 via-zinc-200 to-neutral-500",
    tags: ["Гарантия", "Смета", "Бригада"],
    description:
      "Команда мастеров ведет ремонт от черновых работ до финальной уборки. Фиксируем этапы и бюджет.",
    seller: { name: "Студия Forma", rating: 4.9, since: "на Нашло с 2020", verified: true },
    specs: {
      Опыт: "9 лет",
      Команда: "12 мастеров",
      Срок: "от 30 дней",
      Гарантия: "2 года",
    },
  },
  {
    id: "6",
    category: "electronics",
    title: "iPhone 15 Pro 256 ГБ",
    subtitle: "Natural Titanium, полный комплект",
    price: 89000,
    city: "Москва",
    imageTone: "from-zinc-950 via-zinc-700 to-zinc-200",
    tags: ["Гарантия", "256 ГБ", "Без сколов"],
    description: "Аккуратный смартфон, коробка и чек на месте. Батарея 96%, состояние близко к новому.",
    seller: { name: "Даниил Ким", rating: 4.9, since: "на Нашло с 2021", verified: true },
    specs: { Память: "256 ГБ", Цвет: "Titanium", Состояние: "Отличное", Батарея: "96%" },
  },
  {
    id: "7",
    category: "home",
    title: "Диван модульный Milano",
    subtitle: "Светлая ткань, глубокая посадка",
    price: 72000,
    city: "Москва",
    imageTone: "from-stone-100 via-zinc-200 to-stone-500",
    tags: ["Модульный", "Ткань", "Доставка"],
    description: "Современный диван для гостиной, без пятен и повреждений. Можно забрать по секциям.",
    seller: { name: "Анна Павлова", rating: 4.8, since: "на Нашло с 2022", verified: true },
    specs: { Размер: "310 × 180 см", Материал: "Ткань", Цвет: "Светло-серый", Доставка: "По договоренности" },
  },
  {
    id: "8",
    category: "fashion",
    title: "Пальто из шерсти",
    subtitle: "Минималистичный крой, размер M",
    price: 18000,
    city: "Санкт-Петербург",
    imageTone: "from-zinc-900 via-zinc-400 to-stone-100",
    tags: ["Шерсть", "Размер M", "Сезон"],
    description: "Теплое пальто в спокойном цвете, подходит для базового гардероба.",
    seller: { name: "Екатерина Лебедева", rating: 4.7, since: "на Нашло с 2023", verified: false },
    specs: { Размер: "M", Материал: "Шерсть", Состояние: "Очень хорошее", Сезон: "Осень-зима" },
  },
  {
    id: "9",
    category: "kids",
    title: "Коляска Stokke Xplory",
    subtitle: "Комплект 2 в 1, после одного ребенка",
    price: 54000,
    city: "Москва",
    imageTone: "from-zinc-100 via-zinc-200 to-zinc-500",
    tags: ["2 в 1", "Люлька", "Прогулка"],
    description: "Коляска в хорошем состоянии, все механизмы работают, хранение в квартире.",
    seller: { name: "Ольга Смирнова", rating: 5, since: "на Нашло с 2020", verified: true },
    specs: { Комплект: "2 в 1", Состояние: "Хорошее", Цвет: "Серый", Возраст: "0-3 года" },
  },
  {
    id: "10",
    category: "sport",
    title: "Велосипед Specialized Sirrus",
    subtitle: "Городской фитнес-байк",
    price: 68000,
    city: "Москва",
    imageTone: "from-zinc-200 via-zinc-300 to-zinc-900",
    tags: ["Размер M", "Гидравлика", "Легкая рама"],
    description: "Быстрый городской велосипед, обслужен перед продажей. Подойдет для города и парков.",
    seller: { name: "Никита Орлов", rating: 4.8, since: "на Нашло с 2021", verified: true },
    specs: { Рама: "M", Тормоза: "Гидравлика", Вес: "11.5 кг", Колеса: "700C" },
  },
]

export function formatPrice(price: number) {
  return new Intl.NumberFormat("ru-RU").format(price) + " ₽"
}

export function getListingById(id: string) {
  return listings.find((listing) => listing.id === id)
}

export function getListingsByCategory(category: ListingCategory) {
  return listings.filter((listing) => listing.category === category)
}

export function getCategoryBySlug(slug: string) {
  return marketplaceCategories.find((category) => category.slug === slug)
}
