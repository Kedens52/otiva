import {
  NASHLO_CITIES_FOR_LISTING,
  NASHLO_CITY_ANYWHERE,
} from "@/lib/city-selection"

export type FilterOption = { value: string; label: string }

export type FilterField =
  | {
      type: "select"
      key: string
      label: string
      options: FilterOption[]
      disabled?: boolean
      helperText?: string
    }
  | {
      type: "range"
      key: string
      label: string
      unit?: string
      disabled?: boolean
      helperText?: string
    }
  | { type: "toggle"; key: string; label: string; disabled?: boolean; helperText?: string }
  | {
      type: "multi"
      key: string
      label: string
      options: FilterOption[]
      disabled?: boolean
      helperText?: string
    }
  | {
      type: "text"
      key: string
      label: string
      placeholder?: string
      disabled?: boolean
      helperText?: string
    }

export type MarketplaceCreateField =
  | {
      type: "select"
      key: string
      label: string
      required?: boolean
      options: Array<string | FilterOption>
    }
  | {
      type: "input"
      key: string
      label: string
      required?: boolean
      placeholder?: string
      inputType?: string
    }
  | {
      type: "range"
      key: string
      label: string
      placeholderFrom?: string
      placeholderTo?: string
      unit?: string
    }
  | {
      type: "toggle-row"
      key: string
      label: string
      required?: boolean
      options: FilterOption[]
    }

export type CategoryFilterConfig = {
  label: string
  fields: FilterField[]
}

export type MarketplaceFilterSection = {
  id: string
  title: string
  description?: string
  keys?: string[]
  includePrice?: boolean
  showGeoActions?: boolean
}

export type MarketplaceSubcategory = {
  slug: string
  label: string
  presetAttributes?: Record<string, string>
  listingCategorySlug?: string
}

export type MarketplaceCategory = {
  slug: string
  title: string
  href: string
  icon: string
  createHints: string[]
  subcategories?: MarketplaceSubcategory[]
}

function textOptions(values: string[]) {
  return values.map((value) => ({ value, label: value }))
}

function lowerOptions(values: string[]) {
  return values.map((value) => ({ value: value.toLowerCase(), label: value }))
}

export const MARKETPLACE_CITIES = NASHLO_CITIES_FOR_LISTING

export const RADIUS_OPTIONS = [
  { value: "1", label: "1 км" },
  { value: "3", label: "3 км" },
  { value: "5", label: "5 км" },
  { value: "10", label: "10 км" },
  { value: "25", label: "25 км" },
  { value: "50", label: "50 км" },
  { value: "city", label: "Весь город" },
] as const

export const CONDITION_FILTER_FIELD: FilterField = {
  type: "select",
  key: "condition",
  label: "Состояние",
  options: [
    { value: "new", label: "Новое" },
    { value: "used", label: "Б/у" },
  ],
}

export const CITY_FILTER_FIELD: FilterField = {
  type: "select",
  key: "city",
  label: "Город",
  options: [
    { value: NASHLO_CITY_ANYWHERE, label: NASHLO_CITY_ANYWHERE },
    ...textOptions([...MARKETPLACE_CITIES]),
  ],
}

export const DISTRICT_FILTER_FIELD: FilterField = {
  type: "text",
  key: "district",
  label: "Район",
  placeholder: "Например: Медведково",
}

export const ADDRESS_FILTER_FIELD: FilterField = {
  type: "text",
  key: "address",
  label: "Адрес, район или метро",
  placeholder: "Введите район, улицу или ориентир",
}

export const RADIUS_FILTER_FIELD: FilterField = {
  type: "select",
  key: "radius",
  label: "Радиус поиска",
  options: RADIUS_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
}

export const DATE_RANGE_FILTER_FIELD: FilterField = {
  type: "select",
  key: "dateRange",
  label: "Дата публикации",
  options: [
    { value: "1d", label: "За сегодня" },
    { value: "3d", label: "За 3 дня" },
    { value: "7d", label: "За неделю" },
    { value: "30d", label: "За месяц" },
  ],
}

export const MARKETPLACE_GEO_FILTER_FIELDS: FilterField[] = [
  CITY_FILTER_FIELD,
  DISTRICT_FILTER_FIELD,
  ADDRESS_FILTER_FIELD,
  RADIUS_FILTER_FIELD,
]

export const GENERAL_FILTERS: FilterField[] = [
  DATE_RANGE_FILTER_FIELD,
  CONDITION_FILTER_FIELD,
  ...MARKETPLACE_GEO_FILTER_FIELDS,
]

const CARS_MAKES = [
  "Toyota",
  "BMW",
  "Mercedes-Benz",
  "Lada (ВАЗ)",
  "Kia",
  "Hyundai",
  "Volkswagen",
  "Audi",
  "Skoda",
  "Renault",
  "Nissan",
  "Ford",
  "Mazda",
  "Honda",
  "Mitsubishi",
  "Lexus",
  "Volvo",
  "Land Rover",
  "Porsche",
  "HAVAL",
  "Chery",
  "Geely",
  "Exeed",
  "Omoda",
  "Belgee",
  "УАЗ",
  "ГАЗ",
  "КАМАЗ",
  "Другая",
]

export const MARKETPLACE_CATEGORIES: MarketplaceCategory[] = [
  {
    slug: "free",
    title: "Бесплатно",
    href: "/free",
    icon: "🎁",
    createHints: [
      "Укажите, как удобно передать вещь.",
      "Добавьте фото реального состояния.",
      "Опишите, что входит в комплект.",
    ],
  },
  {
    slug: "goods",
    title: "Товары",
    href: "/search?cat=goods",
    icon: "📦",
    createHints: [
      "Не пишите 'Продам' в названии.",
      "Добавьте 3-5 фото, чтобы получить больше откликов.",
      "Укажите состояние и точную цену.",
    ],
    subcategories: [
      { slug: "goods_electronics", label: "Электроника", presetAttributes: { subcategory: "goods_electronics" } },
      { slug: "goods_home", label: "Дом и сад", presetAttributes: { subcategory: "goods_home" } },
      { slug: "goods_fashion", label: "Одежда", presetAttributes: { subcategory: "goods_fashion" } },
      { slug: "goods_kids", label: "Детские товары", presetAttributes: { subcategory: "goods_kids" } },
      { slug: "goods_hobby", label: "Хобби", presetAttributes: { subcategory: "goods_hobby" } },
      { slug: "goods_build", label: "Строительство", presetAttributes: { subcategory: "goods_build" } },
    ],
  },
  {
    slug: "cars",
    title: "Авто",
    href: "/transport",
    icon: "🚗",
    createHints: [
      "Укажите марку, модель и год выпуска.",
      "Добавьте пробег и параметры двигателя.",
      "VIN и история обслуживания повышают доверие.",
    ],
    subcategories: [
      { slug: "car_passenger", label: "Легковые", presetAttributes: { vehicle_type: "car" } },
      { slug: "car_commercial", label: "Коммерческий транспорт", presetAttributes: { vehicle_type: "commercial" } },
      { slug: "car_moto", label: "Мототехника", presetAttributes: { vehicle_type: "moto" } },
      { slug: "car_parts_here", label: "Запчасти", listingCategorySlug: "parts" },
    ],
  },
  {
    slug: "real-estate",
    title: "Недвижимость",
    href: "/real-estate",
    icon: "🏠",
    createHints: [
      "Укажите тип сделки: продажа или аренда.",
      "Добавьте площадь, этаж и район.",
      "Фото планировки повышают конверсию.",
    ],
    subcategories: [
      { slug: "re_apartment", label: "Квартиры", presetAttributes: { property_type: "apartment" } },
      { slug: "re_house", label: "Дома", presetAttributes: { property_type: "house" } },
      { slug: "re_commercial", label: "Коммерческая", presetAttributes: { property_type: "commercial" } },
      { slug: "re_land", label: "Земельные участки", presetAttributes: { property_type: "land" } },
    ],
  },
  {
    slug: "services",
    title: "Услуги",
    href: "/services",
    icon: "🛠️",
    createHints: [
      "Сразу укажите формат: онлайн или выезд.",
      "Добавьте опыт и примеры работ.",
      "Четко обозначьте стоимость 'от'.",
    ],
    subcategories: [
      { slug: "svc_repair", label: "Ремонт", presetAttributes: { subcategory: "repair_home" } },
      { slug: "svc_design", label: "Дизайн", presetAttributes: { subcategory: "design" } },
      { slug: "svc_beauty", label: "Красота", presetAttributes: { subcategory: "beauty" } },
      { slug: "svc_auto", label: "Автосервис", presetAttributes: { subcategory: "auto_service" } },
      { slug: "svc_tutor", label: "Обучение", presetAttributes: { subcategory: "tutor" } },
      { slug: "svc_delivery", label: "Доставка", presetAttributes: { subcategory: "courier" } },
      { slug: "svc_it", label: "IT и digital", presetAttributes: { subcategory: "it" } },
    ],
  },
  {
    slug: "jobs",
    title: "Работа",
    href: "/jobs",
    icon: "💼",
    createHints: [
      "Укажите тип занятости и график.",
      "Добавьте зарплатную вилку.",
      "Опишите обязанности и условия.",
    ],
  },
  {
    slug: "electronics",
    title: "Электроника",
    href: "/electronics",
    icon: "📱",
    createHints: [
      "Укажите бренд и модель устройства.",
      "Опишите комплект и состояние.",
      "Фото экрана и корпуса обязательны.",
    ],
  },
  {
    slug: "home",
    title: "Для дома",
    href: "/home-and-garden",
    icon: "🛋️",
    createHints: [
      "Укажите материал и размеры.",
      "Покажите фото в интерьере.",
      "Добавьте информацию о доставке.",
    ],
  },
  {
    slug: "fashion",
    title: "Одежда",
    href: "/personal-items",
    icon: "👕",
    createHints: [
      "Укажите бренд, размер и состояние.",
      "Добавьте фото на светлом фоне.",
      "Покажите дефекты, если они есть.",
    ],
  },
  {
    slug: "kids",
    title: "Детям",
    href: "/personal-items/kids",
    icon: "🧸",
    createHints: [
      "Укажите возрастную группу.",
      "Добавьте точные размеры/параметры.",
      "Проверьте безопасность и комплектность.",
    ],
  },
  {
    slug: "sport",
    title: "Спорт",
    href: "/hobby/sport",
    icon: "⚽",
    createHints: [
      "Укажите размер или характеристики.",
      "Добавьте фото из разных ракурсов.",
      "Опишите, для какого уровня подходит.",
    ],
  },
  {
    slug: "parts",
    title: "Запчасти",
    href: "/transport/parts",
    icon: "⚙️",
    createHints: [
      "Укажите совместимость по модели.",
      "Добавьте артикул, если есть.",
      "Опишите состояние и износ.",
    ],
  },
  {
    slug: "business",
    title: "Бизнес",
    href: "/search?cat=business",
    icon: "🏢",
    createHints: [
      "Добавьте краткие финпоказатели.",
      "Укажите, что входит в продажу.",
      "Опишите формат сделки.",
    ],
  },
  {
    slug: "animals",
    title: "Животные",
    href: "/animals",
    icon: "🐾",
    createHints: [
      "Укажите возраст и особенности.",
      "Добавьте фото и документы, если есть.",
      "Опишите условия передачи.",
    ],
  },
  {
    slug: "hobby",
    title: "Хобби",
    href: "/hobby",
    icon: "🎨",
    createHints: [
      "Укажите подкатегорию и состояние.",
      "Добавьте фото деталей.",
      "Опишите редкость и комплектацию.",
    ],
  },
  {
    slug: "other",
    title: "Другое",
    href: "/search?cat=other",
    icon: "🧩",
    createHints: [
      "Выберите максимально точное описание.",
      "Добавьте больше фото для доверия.",
      "Укажите удобный способ связи.",
    ],
  },
]

export const MARKETPLACE_CREATE_FIELDS: Record<string, MarketplaceCreateField[]> = {
  free: [
    {
      type: "select",
      key: "free_type",
      label: "Что отдаете",
      required: true,
      options: [
        { value: "pickup", label: "Самовывоз" },
        { value: "delivery", label: "Могу передать" },
        { value: "exchange", label: "Можно обмен" },
      ],
    },
  ],
  goods: [
    {
      type: "toggle-row",
      key: "delivery_option",
      label: "Получение",
      options: [
        { value: "pickup", label: "Самовывоз" },
        { value: "delivery", label: "Доставка" },
        { value: "both", label: "Оба варианта" },
      ],
    },
    {
      type: "input",
      key: "brand",
      label: "Бренд",
      placeholder: "Необязательно",
    },
  ],
  parts: [
    {
      type: "select",
      key: "part_type",
      label: "Тип запчасти",
      required: true,
      options: [
        { value: "engine", label: "Двигатель" },
        { value: "transmission", label: "Трансмиссия" },
        { value: "body", label: "Кузов" },
        { value: "suspension", label: "Подвеска / Рулевое" },
        { value: "electronics", label: "Электрика" },
        { value: "interior", label: "Салон" },
        { value: "other", label: "Другое" },
      ],
    },
    {
      type: "input",
      key: "compatibility",
      label: "Совместимость (марка / модель)",
      placeholder: "Например: Toyota Camry XV70",
    },
    {
      type: "input",
      key: "oem_number",
      label: "Артикул / OEM",
      placeholder: "Необязательно",
    },
  ],
  cars: [
    {
      type: "select",
      key: "vehicle_type",
      label: "Тип транспорта",
      required: true,
      options: [
        { value: "car", label: "Легковой автомобиль" },
        { value: "truck", label: "Грузовой автомобиль" },
        { value: "moto", label: "Мотоцикл / мопед" },
        { value: "commercial", label: "Коммерческий транспорт" },
        { value: "special", label: "Спецтехника" },
        { value: "trailer", label: "Прицеп" },
      ],
    },
    {
      type: "select",
      key: "make",
      label: "Марка",
      required: true,
      options: CARS_MAKES,
    },
    {
      type: "input",
      key: "model",
      label: "Модель",
      required: true,
      placeholder: "Например: Camry, X5, Polo",
    },
    {
      type: "range",
      key: "year",
      label: "Год выпуска",
      placeholderFrom: "от",
      placeholderTo: "до",
    },
    {
      type: "input",
      key: "mileage",
      label: "Пробег, км",
      inputType: "number",
      placeholder: "0 — для новых",
    },
    {
      type: "select",
      key: "body_type",
      label: "Тип кузова",
      options: [
        { value: "sedan", label: "Седан" },
        { value: "hatchback", label: "Хэтчбек" },
        { value: "suv", label: "Внедорожник / SUV" },
        { value: "wagon", label: "Универсал" },
        { value: "coupe", label: "Купе" },
        { value: "minivan", label: "Минивэн / Микроавтобус" },
        { value: "pickup", label: "Пикап" },
        { value: "cabriolet", label: "Кабриолет" },
        { value: "liftback", label: "Лифтбек" },
      ],
    },
    {
      type: "select",
      key: "fuel",
      label: "Тип двигателя",
      options: [
        { value: "petrol", label: "Бензин" },
        { value: "diesel", label: "Дизель" },
        { value: "hybrid", label: "Гибрид (бензин + электро)" },
        { value: "electric", label: "Электромобиль" },
        { value: "gas", label: "Газ (LPG/CNG)" },
        { value: "gas_petrol", label: "Газ + бензин" },
      ],
    },
    {
      type: "input",
      key: "engine_volume",
      label: "Объём двигателя, л",
      inputType: "number",
      placeholder: "Например: 2.0",
    },
    {
      type: "input",
      key: "engine_power",
      label: "Мощность, л.с.",
      inputType: "number",
      placeholder: "Например: 150",
    },
    {
      type: "toggle-row",
      key: "transmission",
      label: "КПП",
      options: [
        { value: "auto", label: "Автомат" },
        { value: "manual", label: "Механика" },
        { value: "robot", label: "Робот" },
        { value: "cvt", label: "Вариатор" },
      ],
    },
    {
      type: "toggle-row",
      key: "drive",
      label: "Привод",
      options: [
        { value: "fwd", label: "Передний" },
        { value: "rwd", label: "Задний" },
        { value: "4wd", label: "Полный" },
      ],
    },
    {
      type: "select",
      key: "color",
      label: "Цвет",
      options: [
        "Белый",
        "Чёрный",
        "Серебристый",
        "Серый",
        "Синий",
        "Красный",
        "Зелёный",
        "Коричневый",
        "Бежевый",
        "Оранжевый",
        "Другой",
      ],
    },
    {
      type: "select",
      key: "owners_count",
      label: "Владельцев по ПТС",
      options: [
        { value: "1", label: "1 владелец" },
        { value: "2", label: "2 владельца" },
        { value: "3", label: "3 и более" },
      ],
    },
    {
      type: "toggle-row",
      key: "pts",
      label: "ПТС",
      options: [
        { value: "original", label: "Оригинал" },
        { value: "duplicate", label: "Дубликат" },
        { value: "electronic", label: "Электронный" },
      ],
    },
    {
      type: "select",
      key: "customs",
      label: "Таможня",
      options: [
        { value: "cleared", label: "Растаможен" },
        { value: "uncleared", label: "Не растаможен" },
      ],
    },
    {
      type: "select",
      key: "vin",
      label: "VIN проверка",
      options: [
        { value: "clean", label: "Нет ограничений" },
        { value: "unknown", label: "Не проверял" },
      ],
    },
  ],
  "real-estate": [
    {
      type: "toggle-row",
      key: "deal_type",
      label: "Тип сделки",
      required: true,
      options: [
        { value: "sell", label: "Продажа" },
        { value: "rent", label: "Аренда" },
        { value: "rent_daily", label: "Посуточно" },
      ],
    },
    {
      type: "select",
      key: "property_type",
      label: "Тип объекта",
      required: true,
      options: [
        { value: "apartment", label: "Квартира" },
        { value: "room", label: "Комната" },
        { value: "house", label: "Дом / Коттедж" },
        { value: "dacha", label: "Дача" },
        { value: "land", label: "Участок" },
        { value: "commercial", label: "Коммерческая недвижимость" },
        { value: "garage", label: "Гараж / Машиноместо" },
        { value: "new_build", label: "Новостройка" },
      ],
    },
    {
      type: "toggle-row",
      key: "rooms",
      label: "Количество комнат",
      options: [
        { value: "studio", label: "Студия" },
        { value: "1", label: "1" },
        { value: "2", label: "2" },
        { value: "3", label: "3" },
        { value: "4", label: "4" },
        { value: "5+", label: "5+" },
      ],
    },
    {
      type: "input",
      key: "total_area",
      label: "Общая площадь, м²",
      inputType: "number",
      placeholder: "Например: 65",
    },
    {
      type: "input",
      key: "living_area",
      label: "Жилая площадь, м²",
      inputType: "number",
      placeholder: "Например: 40",
    },
    {
      type: "input",
      key: "kitchen_area",
      label: "Кухня, м²",
      inputType: "number",
      placeholder: "Например: 12",
    },
    {
      type: "range",
      key: "floor",
      label: "Этаж",
      placeholderFrom: "этаж",
      placeholderTo: "из",
    },
    {
      type: "select",
      key: "building_type",
      label: "Тип дома",
      options: [
        { value: "panel", label: "Панельный" },
        { value: "brick", label: "Кирпичный" },
        { value: "mono", label: "Монолитный" },
        { value: "block", label: "Блочный" },
        { value: "wood", label: "Деревянный" },
        { value: "foam", label: "Пенобетон / Газобетон" },
      ],
    },
    {
      type: "input",
      key: "build_year",
      label: "Год постройки",
      inputType: "number",
      placeholder: "Например: 2015",
    },
    {
      type: "select",
      key: "renovation",
      label: "Ремонт",
      options: [
        { value: "design", label: "Дизайнерский" },
        { value: "euro", label: "Евроремонт" },
        { value: "good", label: "Хороший" },
        { value: "cosmetic", label: "Косметический" },
        { value: "none", label: "Требует ремонта" },
        { value: "rough", label: "Черновая отделка" },
      ],
    },
    {
      type: "select",
      key: "bathroom",
      label: "Санузел",
      options: [
        { value: "combined", label: "Совмещённый" },
        { value: "separate", label: "Раздельный" },
        { value: "multiple", label: "Несколько" },
      ],
    },
    {
      type: "select",
      key: "balcony",
      label: "Балкон / Лоджия",
      options: [
        { value: "balcony", label: "Балкон" },
        { value: "loggia", label: "Лоджия" },
        { value: "both", label: "Балкон и лоджия" },
        { value: "none", label: "Нет" },
      ],
    },
    {
      type: "toggle-row",
      key: "seller_type",
      label: "Продавец",
      options: [
        { value: "owner", label: "Собственник" },
        { value: "agent", label: "Агентство" },
        { value: "developer", label: "Застройщик" },
      ],
    },
    {
      type: "toggle-row",
      key: "mortgage",
      label: "Ипотека",
      options: [
        { value: "yes", label: "Возможна" },
        { value: "no", label: "Нет" },
        { value: "approved", label: "Одобрена" },
      ],
    },
  ],
  electronics: [
    {
      type: "select",
      key: "subcategory",
      label: "Подкатегория",
      required: true,
      options: [
        { value: "phones", label: "Смартфоны" },
        { value: "tablets", label: "Планшеты" },
        { value: "laptops", label: "Ноутбуки" },
        { value: "pc", label: "Настольные ПК" },
        { value: "monitors", label: "Мониторы" },
        { value: "tv", label: "Телевизоры" },
        { value: "audio", label: "Аудиотехника" },
        { value: "headphones", label: "Наушники" },
        { value: "photo", label: "Фото / Видео" },
        { value: "consoles", label: "Игровые консоли" },
        { value: "wearables", label: "Умные часы / Фитнес-трекеры" },
        { value: "components", label: "Комплектующие ПК" },
        { value: "network", label: "Сетевое оборудование" },
        { value: "other", label: "Другое" },
      ],
    },
    {
      type: "select",
      key: "brand",
      label: "Бренд",
      options: [
        "Apple",
        "Samsung",
        "Xiaomi",
        "Huawei",
        "Sony",
        "LG",
        "Asus",
        "Lenovo",
        "HP",
        "Dell",
        "MSI",
        "Acer",
        "OnePlus",
        "Realme",
        "Google",
        "Nothing",
        "Oppo",
        "Honor",
        "Vivo",
        "Bose",
        "JBL",
        "Sennheiser",
        "Другой",
      ],
    },
    {
      type: "input",
      key: "model",
      label: "Модель",
      placeholder: "Например: iPhone 15 Pro, Galaxy S24",
    },
    {
      type: "input",
      key: "storage",
      label: "Объём памяти (ГБ)",
      inputType: "number",
      placeholder: "Например: 256",
    },
    {
      type: "select",
      key: "color",
      label: "Цвет",
      options: [
        "Чёрный",
        "Белый",
        "Серый",
        "Серебристый",
        "Золотой",
        "Синий",
        "Зелёный",
        "Красный",
        "Розовый",
        "Другой",
      ],
    },
    {
      type: "select",
      key: "warranty",
      label: "Гарантия",
      options: [
        { value: "yes", label: "Есть" },
        { value: "no", label: "Нет" },
        { value: "mfr", label: "Производителя" },
        { value: "store", label: "Магазинная" },
      ],
    },
  ],
  home: [
    {
      type: "select",
      key: "subcategory",
      label: "Подкатегория",
      required: true,
      options: [
        { value: "furniture", label: "Мебель" },
        { value: "appliances", label: "Бытовая техника" },
        { value: "kitchen", label: "Кухонная техника" },
        { value: "lighting", label: "Освещение" },
        { value: "textiles", label: "Текстиль / Ковры" },
        { value: "decor", label: "Декор / Интерьер" },
        { value: "tools", label: "Инструменты" },
        { value: "garden", label: "Дача и сад" },
        { value: "plumbing", label: "Сантехника" },
        { value: "repair", label: "Стройматериалы" },
        { value: "other", label: "Другое" },
      ],
    },
    {
      type: "select",
      key: "material",
      label: "Материал",
      options: ["Дерево", "МДФ", "ДСП", "Металл", "Пластик", "Стекло", "Ткань", "Кожа", "Другой"],
    },
    {
      type: "select",
      key: "color",
      label: "Цвет / Оттенок",
      options: ["Белый", "Чёрный", "Серый", "Коричневый", "Бежевый", "Дуб", "Венге", "Другой"],
    },
  ],
  fashion: [
    {
      type: "toggle-row",
      key: "gender",
      label: "Для кого",
      required: true,
      options: [
        { value: "women", label: "Женское" },
        { value: "men", label: "Мужское" },
        { value: "kids", label: "Детское" },
        { value: "unisex", label: "Унисекс" },
      ],
    },
    {
      type: "select",
      key: "subcategory",
      label: "Тип",
      required: true,
      options: [
        { value: "outerwear", label: "Верхняя одежда" },
        { value: "tops", label: "Верх (футболки, рубашки)" },
        { value: "bottoms", label: "Низ (брюки, юбки)" },
        { value: "dresses", label: "Платья / Комбинезоны" },
        { value: "shoes", label: "Обувь" },
        { value: "bags", label: "Сумки / Рюкзаки" },
        { value: "accessories", label: "Аксессуары" },
        { value: "sport", label: "Спортивная одежда" },
        { value: "underwear", label: "Нижнее бельё" },
        { value: "other", label: "Другое" },
      ],
    },
    {
      type: "select",
      key: "brand",
      label: "Бренд",
      options: [
        "Nike",
        "Adidas",
        "Zara",
        "H&M",
        "Levi's",
        "Tommy Hilfiger",
        "Calvin Klein",
        "Gucci",
        "Prada",
        "Burberry",
        "Stone Island",
        "The North Face",
        "Uniqlo",
        "Другой",
      ],
    },
    {
      type: "select",
      key: "size",
      label: "Размер (одежда)",
      options: ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "42", "44", "46", "48", "50", "52", "54", "56+"],
    },
    {
      type: "select",
      key: "shoe_size",
      label: "Размер (обувь)",
      options: ["34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47+"],
    },
    {
      type: "select",
      key: "color",
      label: "Цвет",
      options: [
        "Белый",
        "Чёрный",
        "Серый",
        "Синий",
        "Красный",
        "Зелёный",
        "Бежевый",
        "Коричневый",
        "Розовый",
        "Жёлтый",
        "Оранжевый",
        "Мультиколор",
      ],
    },
  ],
  kids: [
    {
      type: "select",
      key: "subcategory",
      label: "Подкатегория",
      required: true,
      options: [
        { value: "clothing", label: "Одежда и обувь" },
        { value: "toys", label: "Игрушки" },
        { value: "strollers", label: "Коляски" },
        { value: "car_seats", label: "Автокресла" },
        { value: "furniture", label: "Детская мебель" },
        { value: "school", label: "Школа и хобби" },
        { value: "sport", label: "Спорт" },
        { value: "nutrition", label: "Питание и уход" },
        { value: "books", label: "Книги" },
        { value: "other", label: "Другое" },
      ],
    },
    {
      type: "select",
      key: "age_group",
      label: "Возраст",
      options: [
        { value: "0-1", label: "До 1 года" },
        { value: "1-3", label: "1–3 года" },
        { value: "3-7", label: "3–7 лет" },
        { value: "7-12", label: "7–12 лет" },
        { value: "12+", label: "Подростки 12+" },
      ],
    },
    {
      type: "select",
      key: "gender",
      label: "Для кого",
      options: [
        { value: "boys", label: "Для мальчиков" },
        { value: "girls", label: "Для девочек" },
        { value: "any", label: "Универсальное" },
      ],
    },
  ],
  sport: [
    {
      type: "select",
      key: "subcategory",
      label: "Подкатегория",
      required: true,
      options: [
        { value: "bikes", label: "Велосипеды" },
        { value: "fitness", label: "Тренажёры и фитнес" },
        { value: "skiing", label: "Лыжи / Сноуборд" },
        { value: "tourism", label: "Туризм / Кемпинг" },
        { value: "fishing", label: "Рыбалка" },
        { value: "hunting", label: "Охота" },
        { value: "team", label: "Командные виды спорта" },
        { value: "scooters", label: "Самокаты / Гироскутеры" },
        { value: "water", label: "Водный спорт" },
        { value: "martial", label: "Единоборства" },
        { value: "climbing", label: "Альпинизм / Скалолазание" },
        { value: "equestrian", label: "Конный спорт" },
        { value: "other", label: "Другое" },
      ],
    },
    {
      type: "select",
      key: "brand",
      label: "Бренд",
      options: ["Nike", "Adidas", "Reebok", "Puma", "Under Armour", "Decathlon", "Trek", "Giant", "Shimano", "Fischer", "Atomic", "Другой"],
    },
  ],
  services: [
    {
      type: "select",
      key: "subcategory",
      label: "Подкатегория",
      required: true,
      options: [
        { value: "repair_home", label: "Ремонт квартир / домов" },
        { value: "plumbing", label: "Сантехника" },
        { value: "electrical", label: "Электрика" },
        { value: "cleaning", label: "Уборка" },
        { value: "moving", label: "Грузчики / Переезды" },
        { value: "beauty", label: "Красота и здоровье" },
        { value: "it", label: "IT / Программирование" },
        { value: "design", label: "Дизайн и реклама" },
        { value: "legal", label: "Юридические услуги" },
        { value: "accounting", label: "Бухгалтерия" },
        { value: "tutor", label: "Репетиторы" },
        { value: "photo_video", label: "Фото и видеосъёмка" },
        { value: "auto_service", label: "Автосервис" },
        { value: "courier", label: "Курьерские услуги" },
        { value: "vet", label: "Ветеринария" },
        { value: "other", label: "Другое" },
      ],
    },
    {
      type: "toggle-row",
      key: "service_type",
      label: "Формат",
      options: [
        { value: "remote", label: "Онлайн / удалённо" },
        { value: "onsite", label: "Выезд к клиенту" },
        { value: "inhouse", label: "У мастера" },
      ],
    },
    {
      type: "select",
      key: "price_type",
      label: "Тип цены",
      options: [
        { value: "fixed", label: "Фиксированная" },
        { value: "hourly", label: "За час" },
        { value: "nego", label: "Договорная" },
      ],
    },
    {
      type: "select",
      key: "experience",
      label: "Опыт",
      options: [
        { value: "1", label: "До 1 года" },
        { value: "3", label: "1–3 года" },
        { value: "5", label: "3–5 лет" },
        { value: "10", label: "5–10 лет" },
        { value: "10+", label: "Более 10 лет" },
      ],
    },
  ],
  jobs: [
    {
      type: "toggle-row",
      key: "listing_type",
      label: "Тип объявления",
      required: true,
      options: [
        { value: "vacancy", label: "Вакансия" },
        { value: "resume", label: "Резюме" },
      ],
    },
    {
      type: "select",
      key: "employment_type",
      label: "Тип занятости",
      required: true,
      options: [
        { value: "full_time", label: "Полная занятость" },
        { value: "part_time", label: "Частичная занятость" },
        { value: "freelance", label: "Фриланс / Проект" },
        { value: "internship", label: "Стажировка" },
        { value: "volunteer", label: "Волонтёрство" },
      ],
    },
    {
      type: "select",
      key: "schedule",
      label: "График",
      options: [
        { value: "full_day", label: "Полный день" },
        { value: "shift", label: "Сменный" },
        { value: "flexible", label: "Гибкий" },
        { value: "remote", label: "Удалённая работа" },
      ],
    },
    {
      type: "select",
      key: "experience",
      label: "Опыт работы",
      options: [
        { value: "no_exp", label: "Без опыта" },
        { value: "1_3", label: "1–3 года" },
        { value: "3_6", label: "3–6 лет" },
        { value: "6plus", label: "Более 6 лет" },
      ],
    },
    {
      type: "input",
      key: "company",
      label: "Компания / Организация",
      placeholder: "Название компании или работодателя",
    },
  ],
  animals: [
    {
      type: "select",
      key: "animal_type",
      label: "Тип животного",
      required: true,
      options: [
        { value: "dogs", label: "Собаки" },
        { value: "cats", label: "Кошки" },
        { value: "birds", label: "Птицы" },
        { value: "fish", label: "Рыбки и аквариум" },
        { value: "rodents", label: "Грызуны и кролики" },
        { value: "reptiles", label: "Рептилии" },
        { value: "farm", label: "Сельхоз животные" },
        { value: "other", label: "Другие животные" },
        { value: "supplies", label: "Товары для животных" },
        { value: "services", label: "Услуги (груминг, вет, передержка)" },
      ],
    },
    {
      type: "select",
      key: "breed",
      label: "Порода",
      options: [
        "Немецкая овчарка",
        "Лабрадор",
        "Хаски",
        "Голден ретривер",
        "Йоркширский терьер",
        "Французский бульдог",
        "Чихуахуа",
        "Шпиц",
        "Британская",
        "Шотландская вислоухая",
        "Мейн-кун",
        "Сфинкс",
        "Метис / Беспородный",
        "Другая",
      ],
    },
    {
      type: "toggle-row",
      key: "animal_gender",
      label: "Пол",
      options: [
        { value: "male", label: "Мальчик" },
        { value: "female", label: "Девочка" },
      ],
    },
    {
      type: "select",
      key: "age",
      label: "Возраст",
      options: [
        { value: "puppy", label: "Щенок / Котёнок" },
        { value: "young", label: "Молодой (до 1 года)" },
        { value: "adult", label: "Взрослый (1–7 лет)" },
        { value: "senior", label: "Пожилой (7+ лет)" },
      ],
    },
  ],
  hobby: [
    {
      type: "select",
      key: "subcategory",
      label: "Подкатегория",
      required: true,
      options: [
        { value: "books", label: "Книги" },
        { value: "music", label: "Музыкальные инструменты" },
        { value: "art", label: "Рисование и творчество" },
        { value: "games", label: "Настольные игры / Игры" },
        { value: "collectibles", label: "Коллекционирование" },
        { value: "photo", label: "Фото и видео" },
        { value: "sewing", label: "Рукоделие и шитьё" },
        { value: "garden", label: "Садоводство" },
        { value: "travel", label: "Путешествия" },
        { value: "other", label: "Другое" },
      ],
    },
    {
      type: "select",
      key: "condition",
      label: "Состояние",
      options: [
        { value: "new", label: "Новое" },
        { value: "like_new", label: "Как новое" },
        { value: "good", label: "Хорошее" },
        { value: "fair", label: "Удовлетворительное" },
      ],
    },
  ],
  business: [
    {
      type: "toggle-row",
      key: "business_type",
      label: "Тип бизнеса",
      required: true,
      options: [
        { value: "sale", label: "Продажа бизнеса" },
        { value: "franchise", label: "Франшиза" },
        { value: "partnership", label: "Партнёрство" },
        { value: "investment", label: "Инвестиции" },
      ],
    },
    {
      type: "input",
      key: "subcategory",
      label: "Категория бизнеса",
      placeholder: "Например: Кафе, ПВЗ, производство",
    },
    {
      type: "toggle-row",
      key: "seller_type",
      label: "Продавец",
      options: [
        { value: "private", label: "Частный владелец" },
        { value: "business", label: "Компания" },
      ],
    },
  ],
  other: [],
}

export const MARKETPLACE_FILTER_CONFIGS: Record<string, CategoryFilterConfig> = {
  free: {
    label: "Бесплатно / Отдам даром",
    fields: [
      CITY_FILTER_FIELD,
      CONDITION_FILTER_FIELD,
      {
        type: "select",
        key: "free_type",
        label: "Формат",
        options: [
          { value: "pickup", label: "Самовывоз" },
          { value: "delivery", label: "Могу передать" },
          { value: "exchange", label: "Можно обмен" },
        ],
      },
      { type: "toggle", key: "with_photos", label: "Только с фото" },
    ],
  },
  cars: {
    label: "Транспорт",
    fields: [
      {
        type: "select",
        key: "vehicle_type",
        label: "Тип транспорта",
        options: [
          { value: "car", label: "Легковые" },
          { value: "truck", label: "Грузовые" },
          { value: "moto", label: "Мотоциклы" },
          { value: "commercial", label: "Коммерческий" },
          { value: "special", label: "Спецтехника" },
        ],
      },
      {
        type: "select",
        key: "make",
        label: "Марка",
        options: textOptions(CARS_MAKES),
      },
      { type: "range", key: "year", label: "Год выпуска" },
      { type: "range", key: "mileage", label: "Пробег, км" },
      {
        type: "select",
        key: "body_type",
        label: "Кузов",
        options: [
          { value: "sedan", label: "Седан" },
          { value: "hatchback", label: "Хэтчбек" },
          { value: "suv", label: "Внедорожник / SUV" },
          { value: "wagon", label: "Универсал" },
          { value: "coupe", label: "Купе" },
          { value: "minivan", label: "Минивэн" },
          { value: "pickup", label: "Пикап" },
          { value: "cabriolet", label: "Кабриолет" },
        ],
      },
      {
        type: "select",
        key: "fuel",
        label: "Двигатель",
        options: [
          { value: "petrol", label: "Бензин" },
          { value: "diesel", label: "Дизель" },
          { value: "hybrid", label: "Гибрид" },
          { value: "electric", label: "Электро" },
          { value: "gas", label: "Газ (LPG/CNG)" },
          { value: "gas_petrol", label: "Газ + бензин" },
        ],
      },
      {
        type: "select",
        key: "transmission",
        label: "КПП",
        options: [
          { value: "auto", label: "Автомат" },
          { value: "manual", label: "Механика" },
          { value: "robot", label: "Робот" },
          { value: "cvt", label: "Вариатор" },
        ],
      },
      {
        type: "select",
        key: "drive",
        label: "Привод",
        options: [
          { value: "fwd", label: "Передний" },
          { value: "rwd", label: "Задний" },
          { value: "4wd", label: "Полный" },
        ],
      },
      {
        type: "text",
        key: "model",
        label: "Модель",
        placeholder: "Например: Camry, X5",
      },
      {
        type: "text",
        key: "generation",
        label: "Поколение",
        placeholder: "Например: XV70, F15",
      },
      { type: "range", key: "engine_volume", label: "Объём двигателя, л" },
      { type: "range", key: "engine_power", label: "Мощность, л.с." },
      CONDITION_FILTER_FIELD,
      {
        type: "select",
        key: "color",
        label: "Цвет",
        options: textOptions([
          "Белый",
          "Чёрный",
          "Серебристый",
          "Серый",
          "Синий",
          "Красный",
          "Зелёный",
          "Коричневый",
          "Бежевый",
          "Оранжевый",
          "Другой",
        ]),
      },
      {
        type: "select",
        key: "owners_count",
        label: "Владельцев по ПТС",
        options: [
          { value: "1", label: "1" },
          { value: "2", label: "2" },
          { value: "3", label: "3 и более" },
        ],
      },
      {
        type: "select",
        key: "steering",
        label: "Руль",
        options: [
          { value: "left", label: "Левый" },
          { value: "right", label: "Правый" },
        ],
      },
      {
        type: "select",
        key: "pts",
        label: "ПТС",
        options: [
          { value: "original", label: "Оригинал" },
          { value: "duplicate", label: "Дубликат" },
          { value: "electronic", label: "Электронный" },
        ],
      },
      {
        type: "select",
        key: "customs",
        label: "Таможня",
        options: [
          { value: "cleared", label: "Растаможен" },
          { value: "uncleared", label: "Не растаможен" },
        ],
      },
      {
        type: "select",
        key: "vin",
        label: "VIN",
        options: [
          { value: "clean", label: "Указан / проверен" },
          { value: "unknown", label: "Не указан" },
        ],
      },
      {
        type: "select",
        key: "seller_type",
        label: "Тип продавца",
        options: [
          { value: "private", label: "Частник" },
          { value: "business", label: "Автосалон" },
          { value: "intermediary", label: "Посредник" },
        ],
      },
      { type: "toggle", key: "exchange", label: "Возможен обмен" },
      { type: "toggle", key: "with_photos", label: "Только с фото" },
      CITY_FILTER_FIELD,
    ],
  },
  "real-estate": {
    label: "Недвижимость",
    fields: [
      {
        type: "select",
        key: "deal_type",
        label: "Тип сделки",
        options: [
          { value: "sell", label: "Продажа" },
          { value: "rent", label: "Аренда" },
          { value: "rent_daily", label: "Посуточно" },
        ],
      },
      {
        type: "select",
        key: "property_type",
        label: "Тип объекта",
        options: [
          { value: "apartment", label: "Квартира" },
          { value: "room", label: "Комната" },
          { value: "house", label: "Дом / Дача" },
          { value: "dacha", label: "Дача" },
          { value: "land", label: "Участок" },
          { value: "commercial", label: "Коммерческая" },
          { value: "garage", label: "Гараж" },
          { value: "new_build", label: "Новостройка" },
        ],
      },
      {
        type: "multi",
        key: "rooms",
        label: "Комнат",
        options: [
          { value: "studio", label: "Студия" },
          { value: "1", label: "1" },
          { value: "2", label: "2" },
          { value: "3", label: "3" },
          { value: "4+", label: "4+" },
        ],
      },
      { type: "range", key: "area", label: "Площадь, м²" },
      { type: "range", key: "living_area", label: "Жилая площадь, м²" },
      { type: "range", key: "kitchen_area", label: "Площадь кухни, м²" },
      { type: "range", key: "land_area", label: "Площадь участка" },
      { type: "range", key: "floor", label: "Этаж" },
      {
        type: "select",
        key: "building_type",
        label: "Тип дома",
        options: [
          { value: "panel", label: "Панельный" },
          { value: "brick", label: "Кирпичный" },
          { value: "mono", label: "Монолитный" },
          { value: "block", label: "Блочный" },
          { value: "wood", label: "Деревянный" },
          { value: "foam", label: "Пенобетон / Газобетон" },
        ],
      },
      {
        type: "select",
        key: "renovation",
        label: "Ремонт",
        options: [
          { value: "design", label: "Дизайнерский" },
          { value: "euro", label: "Евроремонт" },
          { value: "good", label: "Хороший" },
          { value: "cosmetic", label: "Косметический" },
          { value: "none", label: "Требует ремонта" },
          { value: "rough", label: "Черновая отделка" },
        ],
      },
      {
        type: "select",
        key: "bathroom",
        label: "Санузел",
        options: [
          { value: "combined", label: "Совмещённый" },
          { value: "separate", label: "Раздельный" },
          { value: "multiple", label: "Несколько" },
        ],
      },
      {
        type: "select",
        key: "balcony",
        label: "Балкон / лоджия",
        options: [
          { value: "balcony", label: "Балкон" },
          { value: "loggia", label: "Лоджия" },
          { value: "both", label: "Балкон и лоджия" },
          { value: "none", label: "Нет" },
        ],
      },
      {
        type: "select",
        key: "mortgage",
        label: "Ипотека",
        options: [
          { value: "yes", label: "Возможна" },
          { value: "no", label: "Нет" },
          { value: "approved", label: "Одобрена" },
        ],
      },
      { type: "range", key: "total_floors", label: "Этажность дома" },
      { type: "range", key: "build_year", label: "Год постройки" },
      {
        type: "text",
        key: "jk_name",
        label: "ЖК / название",
        placeholder: "Например: Символ",
      },
      { type: "toggle", key: "with_photos", label: "Только с фото" },
      { type: "toggle", key: "from_owner", label: "Только от собственника" },
      {
        type: "select",
        key: "seller_type",
        label: "Продавец",
        options: [
          { value: "owner", label: "Собственник" },
          { value: "agent", label: "Агент" },
          { value: "developer", label: "Застройщик" },
        ],
      },
      { type: "toggle", key: "floor_not_first", label: "Не первый этаж" },
      { type: "toggle", key: "floor_not_last", label: "Не последний этаж" },
      { type: "toggle", key: "lift", label: "Есть лифт" },
      { type: "toggle", key: "parking", label: "Есть парковка" },
      { type: "toggle", key: "furniture", label: "Есть мебель" },
      { type: "toggle", key: "appliances", label: "Есть техника" },
      { type: "toggle", key: "kids_allowed", label: "Можно с детьми" },
      { type: "toggle", key: "pets_allowed", label: "Можно с животными" },
      { type: "toggle", key: "deposit", label: "Есть залог" },
      { type: "toggle", key: "commission", label: "Есть комиссия" },
      {
        type: "select",
        key: "rent_term",
        label: "Срок аренды",
        options: [
          { value: "daily", label: "Посуточно" },
          { value: "monthly", label: "На месяц" },
          { value: "long", label: "Долгосрочно" },
        ],
      },
      { type: "toggle", key: "maternity_capital", label: "Маткапитал" },
      { type: "toggle", key: "new_build", label: "Новостройка" },
      { type: "toggle", key: "resale", label: "Вторичка" },
      {
        type: "text",
        key: "district",
        label: "Район / ЖК / ориентир",
        placeholder: "Например: Сокол, ЖК «Сердце столицы»",
      },
      CITY_FILTER_FIELD,
    ],
  },
  electronics: {
    label: "Электроника",
    fields: [
      {
        type: "select",
        key: "subcategory",
        label: "Подкатегория",
        options: [
          { value: "phones", label: "Смартфоны" },
          { value: "tablets", label: "Планшеты" },
          { value: "laptops", label: "Ноутбуки" },
          { value: "pc", label: "Настольные ПК" },
          { value: "monitors", label: "Мониторы" },
          { value: "tv", label: "Телевизоры" },
          { value: "audio", label: "Аудиотехника" },
          { value: "headphones", label: "Наушники" },
          { value: "photo", label: "Фото / Видео" },
          { value: "consoles", label: "Игровые консоли" },
          { value: "wearables", label: "Умные часы / фитнес" },
          { value: "components", label: "Комплектующие ПК" },
          { value: "network", label: "Сетевое оборудование" },
          { value: "other", label: "Другое" },
        ],
      },
      {
        type: "select",
        key: "brand",
        label: "Бренд",
        options: lowerOptions([
          "Apple",
          "Samsung",
          "Xiaomi",
          "Huawei",
          "Sony",
          "LG",
          "Asus",
          "Lenovo",
          "HP",
          "Dell",
          "MSI",
          "Acer",
          "OnePlus",
          "Realme",
          "Google",
          "Nothing",
          "Oppo",
          "Honor",
          "Vivo",
          "Bose",
          "JBL",
          "Sennheiser",
          "Другой",
        ]),
      },
      { type: "text", key: "model", label: "Модель", placeholder: "Например: iPhone 15, Galaxy S24" },
      {
        type: "select",
        key: "storage",
        label: "Память, ГБ",
        options: ["32", "64", "128", "256", "512", "1024", "2048"].map((size) => ({
          value: size,
          label: `${size} ГБ`,
        })),
      },
      {
        type: "select",
        key: "color",
        label: "Цвет",
        options: textOptions([
          "Чёрный",
          "Белый",
          "Серый",
          "Серебристый",
          "Золотой",
          "Синий",
          "Зелёный",
          "Красный",
          "Розовый",
          "Другой",
        ]),
      },
      {
        type: "select",
        key: "warranty",
        label: "Гарантия",
        options: [
          { value: "yes", label: "Есть" },
          { value: "no", label: "Нет" },
          { value: "mfr", label: "Производителя" },
          { value: "store", label: "Магазинная" },
        ],
      },
      { type: "text", key: "processor", label: "Процессор", placeholder: "Например: Apple M2, Intel Core i5" },
      { type: "text", key: "video_card", label: "Видеокарта", placeholder: "Например: RTX 4060" },
      { type: "text", key: "diagonal", label: "Диагональ", placeholder: "Например: 15.6" },
      { type: "text", key: "battery", label: "Аккумулятор", placeholder: "Например: 89%, держит 8 часов" },
      {
        type: "select",
        key: "package",
        label: "Комплект",
        options: [
          { value: "full", label: "Полный комплект" },
          { value: "partial", label: "Частичный комплект" },
          { value: "device_only", label: "Только устройство" },
        ],
      },
      {
        type: "select",
        key: "delivery_option",
        label: "Доставка",
        options: [
          { value: "pickup", label: "Самовывоз" },
          { value: "delivery", label: "Доставка" },
          { value: "both", label: "Любая" },
        ],
      },
      CONDITION_FILTER_FIELD,
      { type: "toggle", key: "with_photos", label: "Только с фото" },
      CITY_FILTER_FIELD,
    ],
  },
  home: {
    label: "Дом и интерьер",
    fields: [
      {
        type: "select",
        key: "subcategory",
        label: "Подкатегория",
        options: [
          { value: "furniture", label: "Мебель" },
          { value: "appliances", label: "Бытовая техника" },
          { value: "kitchen", label: "Кухонная техника" },
          { value: "lighting", label: "Освещение" },
          { value: "textiles", label: "Текстиль / Ковры" },
          { value: "decor", label: "Декор / Интерьер" },
          { value: "tools", label: "Инструменты" },
          { value: "garden", label: "Дача и сад" },
          { value: "plumbing", label: "Сантехника" },
          { value: "repair", label: "Стройматериалы" },
          { value: "other", label: "Другое" },
        ],
      },
      {
        type: "select",
        key: "material",
        label: "Материал",
        options: textOptions(["Дерево", "МДФ", "ДСП", "Металл", "Пластик", "Стекло", "Ткань", "Кожа", "Другой"]),
      },
      {
        type: "select",
        key: "color",
        label: "Цвет",
        options: textOptions(["Белый", "Чёрный", "Серый", "Коричневый", "Бежевый", "Дуб", "Венге", "Другой"]),
      },
      CONDITION_FILTER_FIELD,
      { type: "toggle", key: "with_photos", label: "Только с фото" },
      CITY_FILTER_FIELD,
    ],
  },
  fashion: {
    label: "Одежда и обувь",
    fields: [
      {
        type: "select",
        key: "gender",
        label: "Для кого",
        options: [
          { value: "women", label: "Женское" },
          { value: "men", label: "Мужское" },
          { value: "kids", label: "Детское" },
          { value: "unisex", label: "Унисекс" },
        ],
      },
      {
        type: "select",
        key: "subcategory",
        label: "Тип",
        options: [
          { value: "outerwear", label: "Верхняя одежда" },
          { value: "shoes", label: "Обувь" },
          { value: "accessories", label: "Аксессуары" },
          { value: "bags", label: "Сумки" },
          { value: "sport", label: "Спортивная одежда" },
        ],
      },
      { type: "select", key: "size", label: "Размер", options: textOptions(["XS", "S", "M", "L", "XL", "XXL", "XXXL"]) },
      { type: "text", key: "brand", label: "Бренд", placeholder: "Например: Zara, Nike" },
      {
        type: "select",
        key: "color",
        label: "Цвет",
        options: textOptions(["Чёрный", "Белый", "Серый", "Синий", "Красный", "Зелёный", "Коричневый", "Бежевый", "Розовый", "Другой"]),
      },
      {
        type: "select",
        key: "season",
        label: "Сезон",
        options: [
          { value: "summer", label: "Лето" },
          { value: "winter", label: "Зима" },
          { value: "demi", label: "Демисезон" },
          { value: "all", label: "Всесезонное" },
        ],
      },
      { type: "text", key: "material", label: "Материал", placeholder: "Например: Кожа, хлопок" },
      {
        type: "select",
        key: "delivery_option",
        label: "Доставка",
        options: [
          { value: "pickup", label: "Самовывоз" },
          { value: "delivery", label: "Доставка" },
          { value: "both", label: "Любая" },
        ],
      },
      CONDITION_FILTER_FIELD,
      { type: "toggle", key: "with_photos", label: "Только с фото" },
      CITY_FILTER_FIELD,
    ],
  },
  kids: {
    label: "Детям",
    fields: [
      {
        type: "select",
        key: "subcategory",
        label: "Подкатегория",
        options: [
          { value: "clothing", label: "Одежда" },
          { value: "toys", label: "Игрушки" },
          { value: "strollers", label: "Коляски" },
          { value: "furniture", label: "Мебель" },
          { value: "school", label: "Школа и развитие" },
          { value: "sport", label: "Спорт" },
          { value: "nutrition", label: "Питание и уход" },
        ],
      },
      {
        type: "select",
        key: "gender",
        label: "Для кого",
        options: [
          { value: "boys", label: "Для мальчиков" },
          { value: "girls", label: "Для девочек" },
          { value: "any", label: "Универсальное" },
        ],
      },
      {
        type: "select",
        key: "age_group",
        label: "Возраст",
        options: [
          { value: "0-1", label: "До 1 года" },
          { value: "1-3", label: "1–3 года" },
          { value: "3-7", label: "3–7 лет" },
          { value: "7-12", label: "7–12 лет" },
          { value: "12+", label: "Подростки 12+" },
        ],
      },
      CONDITION_FILTER_FIELD,
      { type: "toggle", key: "with_photos", label: "Только с фото" },
      CITY_FILTER_FIELD,
    ],
  },
  sport: {
    label: "Спорт и отдых",
    fields: [
      {
        type: "select",
        key: "subcategory",
        label: "Подкатегория",
        options: [
          { value: "bikes", label: "Велосипеды" },
          { value: "fitness", label: "Тренажёры и фитнес" },
          { value: "skiing", label: "Лыжи / Сноуборд" },
          { value: "tourism", label: "Туризм / Кемпинг" },
          { value: "fishing", label: "Рыбалка" },
          { value: "hunting", label: "Охота" },
          { value: "team", label: "Командные виды" },
          { value: "scooters", label: "Самокаты / Гироскутеры" },
          { value: "water", label: "Водный спорт" },
          { value: "martial", label: "Единоборства" },
          { value: "climbing", label: "Альпинизм / Скалолазание" },
          { value: "equestrian", label: "Конный спорт" },
          { value: "other", label: "Другое" },
        ],
      },
      {
        type: "select",
        key: "brand",
        label: "Бренд",
        options: textOptions(["Nike", "Adidas", "Reebok", "Puma", "Under Armour", "Decathlon", "Trek", "Giant", "Shimano", "Fischer", "Atomic", "Другой"]),
      },
      CONDITION_FILTER_FIELD,
      { type: "toggle", key: "with_photos", label: "Только с фото" },
      CITY_FILTER_FIELD,
    ],
  },
  jobs: {
    label: "Работа",
    fields: [
      {
        type: "select",
        key: "listing_type",
        label: "Тип объявления",
        options: [
          { value: "vacancy", label: "Вакансия" },
          { value: "resume", label: "Резюме" },
        ],
      },
      {
        type: "select",
        key: "employment_type",
        label: "Тип занятости",
        options: [
          { value: "full_time", label: "Полная занятость" },
          { value: "part_time", label: "Частичная занятость" },
          { value: "freelance", label: "Фриланс / проект" },
          { value: "internship", label: "Стажировка" },
          { value: "volunteer", label: "Волонтёрство" },
        ],
      },
      {
        type: "select",
        key: "experience",
        label: "Опыт",
        options: [
          { value: "no_exp", label: "Без опыта" },
          { value: "1_3", label: "1–3 года" },
          { value: "3_6", label: "3–6 лет" },
          { value: "6plus", label: "Более 6 лет" },
        ],
      },
      {
        type: "select",
        key: "schedule",
        label: "График",
        options: [
          { value: "full_day", label: "Полный день" },
          { value: "shift", label: "Сменный" },
          { value: "flexible", label: "Гибкий" },
          { value: "remote", label: "Удалённая работа" },
        ],
      },
      { type: "text", key: "company", label: "Компания", placeholder: "Название работодателя" },
      { type: "text", key: "job_sector", label: "Сфера", placeholder: "Например: Продажи, IT, Логистика" },
      { type: "text", key: "position", label: "Должность", placeholder: "Например: Менеджер по продажам" },
      { type: "toggle", key: "remote", label: "Удалённо" },
      { type: "toggle", key: "daily_pay", label: "Ежедневные выплаты" },
      { type: "toggle", key: "with_photos", label: "Только с фото" },
      CITY_FILTER_FIELD,
    ],
  },
  goods: {
    label: "Товары",
    fields: [
      {
        type: "select",
        key: "subcategory",
        label: "Подкатегория",
        options: [
          { value: "goods_electronics", label: "Электроника" },
          { value: "goods_home", label: "Дом и сад" },
          { value: "goods_fashion", label: "Одежда" },
          { value: "goods_kids", label: "Детские товары" },
          { value: "goods_hobby", label: "Хобби" },
          { value: "goods_build", label: "Строительство" },
        ],
      },
      { type: "text", key: "brand", label: "Бренд", placeholder: "Например: Bosch" },
      { type: "text", key: "model", label: "Модель", placeholder: "Например: GSR 180-LI" },
      CONDITION_FILTER_FIELD,
      {
        type: "select",
        key: "seller_type",
        label: "Тип продавца",
        options: [
          { value: "private", label: "Частное лицо" },
          { value: "business", label: "Магазин / компания" },
        ],
      },
      {
        type: "select",
        key: "delivery_option",
        label: "Доставка",
        options: [
          { value: "pickup", label: "Самовывоз" },
          { value: "delivery", label: "Доставка" },
          { value: "both", label: "Любая" },
        ],
      },
      {
        type: "select",
        key: "originality",
        label: "Оригинал",
        options: [
          { value: "original", label: "Оригинал" },
          { value: "analog", label: "Аналог" },
        ],
      },
      { type: "toggle", key: "exchange", label: "Возможен обмен" },
      { type: "text", key: "color", label: "Цвет", placeholder: "Например: Белый" },
      { type: "text", key: "size", label: "Размер", placeholder: "Например: M / 42 / 140x200" },
      { type: "text", key: "material", label: "Материал", placeholder: "Например: Хлопок" },
      {
        type: "select",
        key: "warranty",
        label: "Гарантия",
        options: [
          { value: "yes", label: "Есть" },
          { value: "no", label: "Нет" },
          { value: "mfr", label: "От производителя" },
        ],
      },
      { type: "toggle", key: "delivery", label: "Есть доставка" },
      { type: "toggle", key: "with_photos", label: "Только с фото" },
      CITY_FILTER_FIELD,
    ],
  },
  parts: {
    label: "Запчасти",
    fields: [
      {
        type: "select",
        key: "part_type",
        label: "Тип запчасти",
        options: [
          { value: "engine", label: "Двигатель" },
          { value: "transmission", label: "Трансмиссия" },
          { value: "body", label: "Кузов" },
          { value: "suspension", label: "Подвеска" },
          { value: "electronics", label: "Электрика" },
          { value: "interior", label: "Салон" },
          { value: "other", label: "Другое" },
        ],
      },
      {
        type: "select",
        key: "make",
        label: "Марка",
        options: textOptions([
          "Toyota",
          "BMW",
          "Mercedes-Benz",
          "Volkswagen",
          "Audi",
          "Skoda",
          "Ford",
          "Hyundai",
          "Kia",
          "Nissan",
          "Mazda",
          "Honda",
          "Lada (ВАЗ)",
          "УАЗ",
          "Другая",
        ]),
      },
      { type: "text", key: "model", label: "Модель", placeholder: "Например: Camry 70" },
      {
        type: "select",
        key: "originality",
        label: "Оригинал / аналог",
        options: [
          { value: "original", label: "Оригинал" },
          { value: "analog", label: "Аналог" },
        ],
      },
      { type: "text", key: "compatibility", label: "Совместимость", placeholder: "Марка / модель / год" },
      { type: "text", key: "oem_number", label: "Артикул / OEM", placeholder: "Номер детали" },
      { type: "range", key: "year", label: "Год (для агрегатов)" },
      {
        type: "select",
        key: "delivery_option",
        label: "Доставка",
        options: [
          { value: "pickup", label: "Самовывоз" },
          { value: "delivery", label: "Доставка" },
          { value: "both", label: "Любая" },
        ],
      },
      CONDITION_FILTER_FIELD,
      { type: "toggle", key: "with_photos", label: "Только с фото" },
      CITY_FILTER_FIELD,
    ],
  },
  business: {
    label: "Бизнес",
    fields: [
      {
        type: "select",
        key: "business_type",
        label: "Тип",
        options: [
          { value: "sale", label: "Продажа бизнеса" },
          { value: "franchise", label: "Франшиза" },
          { value: "partnership", label: "Партнерство" },
          { value: "investment", label: "Инвестиции" },
        ],
      },
      CONDITION_FILTER_FIELD,
      {
        type: "select",
        key: "seller_type",
        label: "Тип продавца",
        options: [
          { value: "private", label: "Частный" },
          { value: "business", label: "Компания" },
        ],
      },
      { type: "text", key: "subcategory", label: "Категория бизнеса", placeholder: "Например: Кафе, ПВЗ, производство" },
      { type: "toggle", key: "with_photos", label: "Только с фото" },
      CITY_FILTER_FIELD,
    ],
  },
  animals: {
    label: "Животные",
    fields: [
      {
        type: "select",
        key: "animal_type",
        label: "Вид / категория",
        options: [
          { value: "dogs", label: "Собаки" },
          { value: "cats", label: "Кошки" },
          { value: "birds", label: "Птицы" },
          { value: "fish", label: "Рыбки и аквариум" },
          { value: "rodents", label: "Грызуны" },
          { value: "reptiles", label: "Рептилии" },
          { value: "farm", label: "Сельхоз животные" },
          { value: "other", label: "Другие животные" },
          { value: "supplies", label: "Товары для животных" },
          { value: "services", label: "Услуги (груминг, вет)" },
        ],
      },
      {
        type: "select",
        key: "breed",
        label: "Порода",
        options: [
          { value: "Метис / Беспородный", label: "Метис / беспородный" },
          { value: "Лабрадор", label: "Лабрадор" },
          { value: "Немецкая овчарка", label: "Немецкая овчарка" },
          { value: "Хаски", label: "Хаски" },
          { value: "Французский бульдог", label: "Французский бульдог" },
          { value: "Шпиц", label: "Шпиц" },
          { value: "Британская", label: "Британская" },
          { value: "Мейн-кун", label: "Мейн-кун" },
          { value: "Сфинкс", label: "Сфинкс" },
          { value: "Другая", label: "Другая" },
        ],
      },
      {
        type: "select",
        key: "animal_gender",
        label: "Пол",
        options: [
          { value: "male", label: "Мальчик" },
          { value: "female", label: "Девочка" },
        ],
      },
      {
        type: "select",
        key: "age",
        label: "Возраст",
        options: [
          { value: "puppy", label: "Щенок / котёнок" },
          { value: "young", label: "Молодой (до 1 года)" },
          { value: "adult", label: "Взрослый (1–7 лет)" },
          { value: "senior", label: "Пожилой (7+ лет)" },
        ],
      },
      CONDITION_FILTER_FIELD,
      { type: "toggle", key: "documents", label: "Есть документы" },
      { type: "toggle", key: "vaccinated", label: "Есть прививки" },
      { type: "toggle", key: "sterilized", label: "Стерилизация" },
      {
        type: "select",
        key: "seller_type",
        label: "Продавец",
        options: [
          { value: "private", label: "Частное лицо" },
          { value: "breeder", label: "Питомник" },
        ],
      },
      { type: "toggle", key: "with_photos", label: "Только с фото" },
      CITY_FILTER_FIELD,
    ],
  },
  hobby: {
    label: "Хобби и отдых",
    fields: [
      {
        type: "select",
        key: "subcategory",
        label: "Подкатегория",
        options: [
          { value: "books", label: "Книги и журналы" },
          { value: "music", label: "Музыкальные инструменты" },
          { value: "art", label: "Рисование и творчество" },
          { value: "games", label: "Настольные игры" },
          { value: "collectibles", label: "Коллекционирование" },
          { value: "travel", label: "Туризм / Путешествия" },
          { value: "photo", label: "Фото и видео" },
          { value: "handmade", label: "Рукоделие и шитьё" },
          { value: "garden", label: "Садоводство" },
          { value: "other", label: "Другое" },
        ],
      },
      CONDITION_FILTER_FIELD,
      { type: "toggle", key: "with_photos", label: "Только с фото" },
      CITY_FILTER_FIELD,
    ],
  },
  other: {
    label: "Другое",
    fields: [
      { type: "toggle", key: "with_photos", label: "Только с фото" },
      CITY_FILTER_FIELD,
    ],
  },
  services: {
    label: "Услуги",
    fields: [
      {
        type: "select",
        key: "subcategory",
        label: "Подкатегория",
        options: [
          { value: "repair_home", label: "Ремонт и строительство" },
          { value: "plumbing", label: "Сантехника" },
          { value: "electrical", label: "Электрика" },
          { value: "windows_doors", label: "Окна и двери" },
          { value: "ceilings", label: "Натяжные потолки" },
          { value: "house_build", label: "Строительство домов" },
          { value: "roofing", label: "Кровля" },
          { value: "tiling", label: "Плитка" },
          { value: "custom_furniture", label: "Мебель на заказ" },
          { value: "cleaning", label: "Уборка" },
          { value: "moving", label: "Грузчики / переезды" },
          { value: "beauty", label: "Красота и здоровье" },
          { value: "hair", label: "Парикмахер" },
          { value: "manicure", label: "Маникюр" },
          { value: "massage", label: "Массаж" },
          { value: "cosmetology", label: "Косметология" },
          { value: "brows_lashes", label: "Брови и ресницы" },
          { value: "fitness_trainer", label: "Фитнес-тренер" },
          { value: "makeup", label: "Визажист" },
          { value: "it", label: "IT и интернет" },
          { value: "design", label: "Дизайн и реклама" },
          { value: "logos", label: "Логотипы" },
          { value: "sites", label: "Сайты" },
          { value: "smm", label: "SMM" },
          { value: "ads", label: "Реклама" },
          { value: "video_edit", label: "Монтаж видео" },
          { value: "3d", label: "3D-моделирование" },
          { value: "polygraphy", label: "Полиграфия" },
          { value: "presentations", label: "Презентации" },
          { value: "legal", label: "Юридические" },
          { value: "accounting", label: "Бухгалтерия и финансы" },
          { value: "courier", label: "Доставка и курьеры" },
          { value: "cargo", label: "Грузоперевозки" },
          { value: "relocation", label: "Переезды" },
          { value: "manipulator", label: "Манипулятор" },
          { value: "special_tech", label: "Спецтехника" },
          { value: "trash", label: "Вывоз мусора" },
          { value: "tutor", label: "Репетиторы" },
          { value: "languages", label: "Иностранные языки" },
          { value: "music_lessons", label: "Музыка" },
          { value: "sport_lessons", label: "Спорт" },
          { value: "courses", label: "Курсы" },
          { value: "exam_prep", label: "Подготовка к экзаменам" },
          { value: "photo_video", label: "Фото и видео" },
          { value: "auto_service", label: "Автосервис" },
          { value: "diagnostics", label: "Диагностика" },
          { value: "tire_service", label: "Шиномонтаж" },
          { value: "detailing", label: "Детейлинг" },
          { value: "auto_electric", label: "Автоэлектрик" },
          { value: "body_repair", label: "Кузовной ремонт" },
          { value: "tow", label: "Эвакуатор" },
          { value: "vet", label: "Ветеринария" },
          { value: "assembly", label: "Сборка мебели" },
          { value: "handyman", label: "Мастер на час" },
          { value: "pet_care", label: "Уход за животными" },
          { value: "nanny", label: "Няни" },
          { value: "caregiver", label: "Сиделки" },
          { value: "other", label: "Другое" },
        ],
      },
      {
        type: "select",
        key: "service_type",
        label: "Формат",
        options: [
          { value: "remote", label: "Удалённо" },
          { value: "onsite", label: "Выезд" },
          { value: "inhouse", label: "У мастера" },
          { value: "online", label: "Онлайн" },
        ],
      },
      {
        type: "select",
        key: "price_type",
        label: "Тип цены",
        options: [
          { value: "fixed", label: "За услугу" },
          { value: "hourly", label: "За час" },
          { value: "sqm", label: "За м²" },
          { value: "nego", label: "Договорная" },
          { value: "from", label: "От" },
        ],
      },
      {
        type: "select",
        key: "experience",
        label: "Опыт",
        options: [
          { value: "any", label: "Любой" },
          { value: "1", label: "От 1 года" },
          { value: "3", label: "От 3 лет" },
          { value: "5", label: "От 5 лет" },
          { value: "10", label: "От 10 лет" },
        ],
      },
      {
        type: "select",
        key: "seller_type",
        label: "Исполнитель",
        options: [
          { value: "private", label: "Частный специалист" },
          { value: "business", label: "Компания" },
        ],
      },
      { type: "toggle", key: "portfolio", label: "Есть портфолио" },
      { type: "toggle", key: "reviews", label: "Есть отзывы" },
      { type: "toggle", key: "fast_response", label: "Быстро отвечает" },
      { type: "toggle", key: "today", label: "Работает сегодня" },
      { type: "toggle", key: "weekend", label: "Работает в выходные" },
      { type: "toggle", key: "contract", label: "Договор" },
      { type: "toggle", key: "guarantee", label: "Гарантия" },
      { type: "text", key: "district", label: "Район / метро", placeholder: "Например: Сокол, м. Тверская" },
      { type: "toggle", key: "with_photos", label: "Только с фото" },
      CITY_FILTER_FIELD,
    ],
  },
}

export const MARKETPLACE_FILTER_SECTIONS: Record<string, MarketplaceFilterSection[]> = {
  cars: [
    { id: "main", title: "Основное", includePrice: true, keys: ["vehicle_type", "make", "model", "generation", "condition", "seller_type"] },
    { id: "history", title: "Год и пробег", keys: ["year", "mileage", "owners_count"] },
    { id: "tech", title: "Технические", keys: ["transmission", "fuel", "drive", "body_type", "engine_volume", "engine_power", "steering", "color", "pts", "customs", "vin"] },
    { id: "geo", title: "Местоположение", keys: ["city", "district", "address", "radius"], showGeoActions: true },
    { id: "extra", title: "Дополнительно", keys: ["exchange", "with_photos"] },
  ],
  parts: [
    { id: "main", title: "Основное", includePrice: true, keys: ["make", "model", "part_type", "condition", "originality"] },
    { id: "compatibility", title: "Совместимость", keys: ["compatibility", "oem_number", "year"] },
    { id: "geo", title: "Местоположение и выдача", keys: ["city", "district", "address", "radius", "delivery_option"], showGeoActions: true },
    { id: "extra", title: "Дополнительно", keys: ["with_photos"] },
  ],
  "real-estate": [
    { id: "main", title: "Основное", includePrice: true, keys: ["deal_type", "property_type", "seller_type", "rooms"] },
    { id: "area", title: "Площадь и этаж", keys: ["area", "living_area", "kitchen_area", "land_area", "floor", "total_floors", "floor_not_first", "floor_not_last"] },
    { id: "home", title: "Дом и состояние", keys: ["building_type", "build_year", "renovation", "bathroom", "balcony", "lift", "parking", "furniture", "appliances", "jk_name"] },
    { id: "deal", title: "Условия сделки", keys: ["mortgage", "maternity_capital", "new_build", "resale", "kids_allowed", "pets_allowed", "deposit", "commission", "rent_term", "from_owner"] },
    { id: "geo", title: "Локация", keys: ["city", "district", "address", "radius"], showGeoActions: true },
    { id: "extra", title: "Дополнительно", keys: ["with_photos"] },
  ],
  services: [
    { id: "main", title: "Услуга и цена", includePrice: true, keys: ["subcategory", "price_type", "seller_type", "experience"] },
    { id: "format", title: "Формат и условия", keys: ["service_type", "contract", "guarantee", "portfolio", "reviews"] },
    { id: "activity", title: "Отклик и доступность", keys: ["fast_response", "today", "weekend"] },
    { id: "geo", title: "Локация", keys: ["city", "district", "address", "radius"], showGeoActions: true },
    { id: "extra", title: "Дополнительно", keys: ["with_photos"] },
  ],
  goods: [
    { id: "main", title: "Основное", includePrice: true, keys: ["subcategory", "condition", "brand", "model", "seller_type"] },
    { id: "details", title: "Характеристики", keys: ["originality", "warranty", "exchange", "color", "size", "material"] },
    { id: "geo", title: "Локация и доставка", keys: ["city", "district", "address", "radius", "delivery_option"], showGeoActions: true },
    { id: "extra", title: "Дополнительно", keys: ["with_photos"] },
  ],
  electronics: [
    { id: "main", title: "Основное", includePrice: true, keys: ["subcategory", "brand", "model", "condition", "storage"] },
    { id: "details", title: "Характеристики", keys: ["processor", "video_card", "diagonal", "battery", "package", "warranty"] },
    { id: "geo", title: "Локация и доставка", keys: ["city", "district", "address", "radius", "delivery_option"], showGeoActions: true },
    { id: "extra", title: "Дополнительно", keys: ["with_photos"] },
  ],
  fashion: [
    { id: "main", title: "Основное", includePrice: true, keys: ["gender", "subcategory", "size", "brand", "condition"] },
    { id: "details", title: "Характеристики", keys: ["season", "color", "material"] },
    { id: "geo", title: "Локация и доставка", keys: ["city", "district", "address", "radius", "delivery_option"], showGeoActions: true },
    { id: "extra", title: "Дополнительно", keys: ["with_photos"] },
  ],
  jobs: [
    { id: "main", title: "Вакансия", includePrice: true, keys: ["listing_type", "job_sector", "position", "company"] },
    { id: "conditions", title: "Условия", keys: ["employment_type", "schedule", "experience", "remote", "daily_pay"] },
    { id: "geo", title: "Локация", keys: ["city", "district", "address", "radius"], showGeoActions: true },
    { id: "extra", title: "Дополнительно", keys: ["with_photos"] },
  ],
  animals: [
    { id: "main", title: "Основное", includePrice: true, keys: ["animal_type", "breed", "animal_gender", "age", "seller_type"] },
    { id: "care", title: "Состояние и документы", keys: ["condition", "documents", "vaccinated", "sterilized"] },
    { id: "geo", title: "Локация", keys: ["city", "district", "address", "radius"], showGeoActions: true },
    { id: "extra", title: "Дополнительно", keys: ["with_photos"] },
  ],
  business: [
    { id: "main", title: "Основное", includePrice: true, keys: ["business_type", "subcategory", "condition", "seller_type"] },
    { id: "geo", title: "Локация", keys: ["city", "district", "address", "radius"], showGeoActions: true },
    { id: "extra", title: "Дополнительно", keys: ["with_photos"] },
  ],
}

function fallbackFilterSections(): MarketplaceFilterSection[] {
  return [
    { id: "main", title: "Основные параметры", includePrice: true, keys: ["condition", "subcategory", "brand", "model", "seller_type"] },
    { id: "geo", title: "Локация", keys: ["city", "district", "address", "radius"], showGeoActions: true },
    { id: "extra", title: "Дополнительно", keys: ["with_photos", "delivery_option"] },
  ]
}

export function getCategoryConfig(slug: string | null | undefined): MarketplaceCategory | null {
  if (!slug) return null
  return MARKETPLACE_CATEGORIES.find((category) => category.slug === slug) ?? null
}

export function getCategoryCreateFields(slug: string | null | undefined): MarketplaceCreateField[] {
  if (!slug) return []
  return MARKETPLACE_CREATE_FIELDS[slug] ?? []
}

export function getCategoryFilterConfig(slug: string | null | undefined): CategoryFilterConfig | null {
  if (!slug) return null
  return MARKETPLACE_FILTER_CONFIGS[slug] ?? null
}

export function getCategoryFilterSections(slug: string | null | undefined): MarketplaceFilterSection[] {
  if (!slug) return fallbackFilterSections()
  return MARKETPLACE_FILTER_SECTIONS[slug] ?? fallbackFilterSections()
}

export function getRequiredCategoryAttributes(slug: string | null | undefined): Array<{ key: string; label: string }> {
  const fields = getCategoryCreateFields(slug)
  const required = new Map<string, { key: string; label: string }>()
  for (const field of fields) {
    if (!("required" in field) || !field.required) continue
    required.set(field.key, { key: field.key, label: field.label })
  }
  return [...required.values()]
}

export function resolveListingCategorySlug(
  categorySlug: string,
  subcategorySlug: string | null,
): string {
  if (!subcategorySlug) return categorySlug
  const category = getCategoryConfig(categorySlug)
  const subcategory = category?.subcategories?.find((item) => item.slug === subcategorySlug)
  return subcategory?.listingCategorySlug ?? categorySlug
}
