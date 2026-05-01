// ──────────────────────────────────────────────────────────────────────────────
// Filter schema — extensible per category
// To add a new category/subcategory: add an entry to CATEGORY_FILTERS below.
// Each filter field has a type: "select" | "range" | "toggle" | "multi"
// ──────────────────────────────────────────────────────────────────────────────

export type FilterOption = { value: string; label: string }

export type FilterField =
  | { type: "select";  key: string; label: string; options: FilterOption[] }
  | { type: "range";   key: string; label: string; unit?: string }
  | { type: "toggle";  key: string; label: string }
  | { type: "multi";   key: string; label: string; options: FilterOption[] }

export type CategoryFilterConfig = {
  label: string
  fields: FilterField[]
}

// ── Shared field sets ─────────────────────────────────────────────────────────

const CONDITION_FIELD: FilterField = {
  type: "select", key: "condition", label: "Состояние",
  options: [
    { value: "new",  label: "Новое" },
    { value: "used", label: "Б/у" },
  ],
}

const CITY_FIELD: FilterField = {
  type: "select", key: "city", label: "Город",
  options: [
    "Москва","Санкт-Петербург","Казань","Екатеринбург","Новосибирск",
    "Сочи","Краснодар","Нижний Новгород","Самара","Ростов-на-Дону",
    "Уфа","Воронеж","Пермь","Тюмень","Омск","Красноярск","Волгоград",
  ].map((c) => ({ value: c, label: c })),
}

// ── Category-specific filter configs ─────────────────────────────────────────

export const CATEGORY_FILTERS: Record<string, CategoryFilterConfig> = {

  // ── Транспорт ──────────────────────────────────────────────────────────────
  cars: {
    label: "Транспорт",
    fields: [
      {
        type: "select", key: "vehicle_type", label: "Тип транспорта",
        options: [
          { value: "car",        label: "Легковые" },
          { value: "truck",      label: "Грузовые" },
          { value: "moto",       label: "Мотоциклы" },
          { value: "commercial", label: "Коммерческий" },
          { value: "special",    label: "Спецтехника" },
        ],
      },
      {
        type: "select", key: "make", label: "Марка",
        options: [
          "Toyota","BMW","Mercedes-Benz","Lada","Kia","Hyundai","Volkswagen",
          "Audi","Skoda","Renault","Nissan","Ford","Mazda","Honda","Mitsubishi",
          "Lexus","Volvo","Land Rover","Porsche","HAVAL","Chery","Geely",
        ].map((m) => ({ value: m.toLowerCase().replace(/\s/g, "-"), label: m })),
      },
      {
        type: "range", key: "year", label: "Год выпуска",
      },
      {
        type: "range", key: "mileage", label: "Пробег, км",
      },
      {
        type: "select", key: "body_type", label: "Кузов",
        options: [
          { value: "sedan",    label: "Седан" },
          { value: "hatchback",label: "Хэтчбек" },
          { value: "suv",      label: "Внедорожник / SUV" },
          { value: "wagon",    label: "Универсал" },
          { value: "coupe",    label: "Купе" },
          { value: "minivan",  label: "Минивэн" },
          { value: "pickup",   label: "Пикап" },
          { value: "cabriolet",label: "Кабриолет" },
        ],
      },
      {
        type: "select", key: "fuel", label: "Двигатель",
        options: [
          { value: "petrol",   label: "Бензин" },
          { value: "diesel",   label: "Дизель" },
          { value: "hybrid",   label: "Гибрид" },
          { value: "electric", label: "Электро" },
          { value: "gas",      label: "Газ / Газ+бензин" },
        ],
      },
      {
        type: "select", key: "transmission", label: "КПП",
        options: [
          { value: "auto",   label: "Автомат" },
          { value: "manual", label: "Механика" },
          { value: "robot",  label: "Робот" },
          { value: "cvt",    label: "Вариатор" },
        ],
      },
      {
        type: "select", key: "drive", label: "Привод",
        options: [
          { value: "fwd",  label: "Передний" },
          { value: "rwd",  label: "Задний" },
          { value: "4wd",  label: "Полный" },
        ],
      },
      { type: "toggle", key: "with_photos", label: "Только с фото" },
      CITY_FIELD,
    ],
  },

  // ── Недвижимость ───────────────────────────────────────────────────────────
  "real-estate": {
    label: "Недвижимость",
    fields: [
      {
        type: "select", key: "deal_type", label: "Тип сделки",
        options: [
          { value: "sell", label: "Продажа" },
          { value: "rent", label: "Аренда" },
          { value: "rent_daily", label: "Посуточно" },
        ],
      },
      {
        type: "select", key: "property_type", label: "Тип объекта",
        options: [
          { value: "apartment", label: "Квартира" },
          { value: "room",      label: "Комната" },
          { value: "house",     label: "Дом / Дача" },
          { value: "land",      label: "Участок" },
          { value: "commercial",label: "Коммерческая" },
          { value: "garage",    label: "Гараж" },
        ],
      },
      {
        type: "multi", key: "rooms", label: "Комнат",
        options: [
          { value: "studio", label: "Студия" },
          { value: "1",      label: "1" },
          { value: "2",      label: "2" },
          { value: "3",      label: "3" },
          { value: "4+",     label: "4+" },
        ],
      },
      { type: "range", key: "area",  label: "Площадь, м²" },
      { type: "range", key: "floor", label: "Этаж" },
      {
        type: "select", key: "building_type", label: "Тип дома",
        options: [
          { value: "panel",  label: "Панельный" },
          { value: "brick",  label: "Кирпичный" },
          { value: "mono",   label: "Монолитный" },
          { value: "wood",   label: "Деревянный" },
        ],
      },
      { type: "toggle", key: "with_photos",   label: "Только с фото" },
      { type: "toggle", key: "from_owner",    label: "Только от собственника" },
      CITY_FIELD,
    ],
  },

  // ── Электроника ────────────────────────────────────────────────────────────
  electronics: {
    label: "Электроника",
    fields: [
      {
        type: "select", key: "subcategory", label: "Подкатегория",
        options: [
          { value: "phones",   label: "Смартфоны" },
          { value: "tablets",  label: "Планшеты" },
          { value: "laptops",  label: "Ноутбуки" },
          { value: "pc",       label: "Компьютеры" },
          { value: "tv",       label: "Телевизоры" },
          { value: "audio",    label: "Аудио / Наушники" },
          { value: "photo",    label: "Фото / Видео" },
          { value: "consoles", label: "Игровые консоли" },
          { value: "wearables",label: "Умные часы" },
          { value: "other",    label: "Другое" },
        ],
      },
      {
        type: "select", key: "brand", label: "Бренд",
        options: [
          "Apple","Samsung","Xiaomi","Huawei","Sony","LG","Asus","Lenovo",
          "HP","Dell","MSI","Acer","OnePlus","Realme","Google","Nothing",
        ].map((b) => ({ value: b.toLowerCase(), label: b })),
      },
      CONDITION_FIELD,
      { type: "toggle", key: "with_photos", label: "Только с фото" },
      CITY_FIELD,
    ],
  },

  // ── Дом и интерьер ─────────────────────────────────────────────────────────
  home: {
    label: "Дом и интерьер",
    fields: [
      {
        type: "select", key: "subcategory", label: "Подкатегория",
        options: [
          { value: "furniture",  label: "Мебель" },
          { value: "appliances", label: "Бытовая техника" },
          { value: "kitchen",    label: "Кухня" },
          { value: "lighting",   label: "Освещение" },
          { value: "textiles",   label: "Текстиль" },
          { value: "tools",      label: "Инструменты" },
          { value: "garden",     label: "Дача и сад" },
          { value: "other",      label: "Другое" },
        ],
      },
      CONDITION_FIELD,
      { type: "toggle", key: "with_photos", label: "Только с фото" },
      CITY_FIELD,
    ],
  },

  // ── Одежда ─────────────────────────────────────────────────────────────────
  fashion: {
    label: "Одежда и обувь",
    fields: [
      {
        type: "select", key: "gender", label: "Для кого",
        options: [
          { value: "women", label: "Женское" },
          { value: "men",   label: "Мужское" },
          { value: "kids",  label: "Детское" },
          { value: "unisex",label: "Унисекс" },
        ],
      },
      {
        type: "select", key: "subcategory", label: "Тип",
        options: [
          { value: "outerwear", label: "Верхняя одежда" },
          { value: "shoes",     label: "Обувь" },
          { value: "accessories",label: "Аксессуары" },
          { value: "bags",      label: "Сумки" },
          { value: "sport",     label: "Спортивная одежда" },
        ],
      },
      {
        type: "select", key: "size", label: "Размер",
        options: ["XS","S","M","L","XL","XXL","XXXL"].map((s) => ({ value: s, label: s })),
      },
      CONDITION_FIELD,
      { type: "toggle", key: "with_photos", label: "Только с фото" },
      CITY_FIELD,
    ],
  },

  // ── Детям ──────────────────────────────────────────────────────────────────
  kids: {
    label: "Детям",
    fields: [
      {
        type: "select", key: "subcategory", label: "Подкатегория",
        options: [
          { value: "clothing",   label: "Одежда" },
          { value: "toys",       label: "Игрушки" },
          { value: "strollers",  label: "Коляски" },
          { value: "furniture",  label: "Мебель" },
          { value: "school",     label: "Школа и развитие" },
          { value: "sport",      label: "Спорт" },
          { value: "nutrition",  label: "Питание и уход" },
        ],
      },
      {
        type: "select", key: "age_group", label: "Возраст",
        options: [
          { value: "0-1",  label: "До 1 года" },
          { value: "1-3",  label: "1–3 года" },
          { value: "3-7",  label: "3–7 лет" },
          { value: "7-12", label: "7–12 лет" },
          { value: "12+",  label: "Подростки" },
        ],
      },
      CONDITION_FIELD,
      CITY_FIELD,
    ],
  },

  // ── Спорт ──────────────────────────────────────────────────────────────────
  sport: {
    label: "Спорт и отдых",
    fields: [
      {
        type: "select", key: "subcategory", label: "Подкатегория",
        options: [
          { value: "bikes",     label: "Велосипеды" },
          { value: "fitness",   label: "Тренажёры" },
          { value: "skiing",    label: "Лыжи / Сноуборд" },
          { value: "tourism",   label: "Туризм / Кемпинг" },
          { value: "fishing",   label: "Рыбалка / Охота" },
          { value: "team",      label: "Командные виды" },
          { value: "scooters",  label: "Самокаты / Гироскутеры" },
          { value: "water",     label: "Водный спорт" },
        ],
      },
      CONDITION_FIELD,
      CITY_FIELD,
    ],
  },

  // ── Услуги ─────────────────────────────────────────────────────────────────
  services: {
    label: "Услуги",
    fields: [
      {
        type: "select", key: "subcategory", label: "Подкатегория",
        options: [
          { value: "repair",   label: "Ремонт и строительство" },
          { value: "cleaning", label: "Уборка" },
          { value: "beauty",   label: "Красота и здоровье" },
          { value: "it",       label: "IT и интернет" },
          { value: "design",   label: "Дизайн и реклама" },
          { value: "legal",    label: "Юридические" },
          { value: "finance",  label: "Бухгалтерия и финансы" },
          { value: "delivery", label: "Доставка и переезды" },
          { value: "tutor",    label: "Репетиторы" },
          { value: "photo",    label: "Фото и видео" },
        ],
      },
      CITY_FIELD,
    ],
  },
}

// ── General (fallback) filters ────────────────────────────────────────────────
export const GENERAL_FILTERS: FilterField[] = [
  CONDITION_FIELD,
  CITY_FIELD,
]

// ── Filter state type ─────────────────────────────────────────────────────────
export type FilterState = Record<string, string | string[]>

export function emptyFilters(): FilterState {
  return {}
}

export function hasActiveFilters(state: FilterState): boolean {
  return Object.values(state).some((v) => (Array.isArray(v) ? v.length > 0 : Boolean(v)))
}
