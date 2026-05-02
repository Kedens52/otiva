"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"

// ── Category definitions with their specific fields ──────────────────────────

const CATEGORIES = [
  { id: "free",         label: "Бесплатно",          icon: "🎁" },
  { id: "cars",         label: "Транспорт",        icon: "🚗" },
  { id: "real-estate",  label: "Недвижимость",      icon: "🏠" },
  { id: "electronics",  label: "Электроника",       icon: "📱" },
  { id: "home",         label: "Дом и интерьер",    icon: "🛋️" },
  { id: "fashion",      label: "Одежда и обувь",    icon: "👗" },
  { id: "kids",         label: "Детям",             icon: "🧸" },
  { id: "sport",        label: "Спорт и отдых",     icon: "⚽" },
  { id: "services",     label: "Услуги",            icon: "🔧" },
  { id: "jobs",         label: "Работа",            icon: "💼" },
  { id: "animals",      label: "Животные",          icon: "🐾" },
  { id: "hobby",        label: "Хобби",             icon: "🎨" },
  { id: "other",        label: "Другое",            icon: "📦" },
]

type FieldDef =
  | { type: "select"; key: string; label: string; required?: boolean; options: string[] | { value: string; label: string }[] }
  | { type: "input";  key: string; label: string; required?: boolean; placeholder?: string; inputType?: string }
  | { type: "range";  key: string; label: string; placeholderFrom?: string; placeholderTo?: string; unit?: string }
  | { type: "toggle-row"; key: string; label: string; required?: boolean; options: { value: string; label: string }[] }

const CARS_MAKES = [
  "Toyota","BMW","Mercedes-Benz","Lada (ВАЗ)","Kia","Hyundai","Volkswagen","Audi",
  "Skoda","Renault","Nissan","Ford","Mazda","Honda","Mitsubishi","Lexus","Volvo",
  "Land Rover","Porsche","HAVAL","Chery","Geely","Exeed","Omoda","Belgee","УАЗ",
  "ГАЗ","КАМАЗ","Другая",
]
const CARS_MODELS: Record<string, string[]> = {
  "toyota": ["Camry","Corolla","RAV4","Land Cruiser","Highlander","Yaris","C-HR","Venza"],
  "bmw": ["3 Series","5 Series","7 Series","X3","X5","X6","X7","M3","M5"],
  "mercedes-benz": ["C-Class","E-Class","S-Class","GLC","GLE","GLS","A-Class","CLA"],
  "lada (ваз)": ["Vesta","Granta","Niva Travel","Niva Legend","Largus","XRAY","Kalina"],
  "kia": ["Optima","Sportage","Sorento","Rio","Cerato","Stinger","Carnival","Seltos"],
  "hyundai": ["Solaris","Tucson","Santa Fe","Creta","Elantra","i30","i40","IONIQ"],
  "volkswagen": ["Polo","Tiguan","Passat","Golf","Touareg","Jetta","Arteon"],
  "audi": ["A4","A6","A8","Q5","Q7","Q8","A3","TT","e-tron"],
  "skoda": ["Octavia","Superb","Karoq","Kodiaq","Rapid","Fabia"],
  "renault": ["Logan","Duster","Sandero","Kaptur","Arkana","Koleos"],
}

const CATEGORY_EXTRA_FIELDS: Record<string, FieldDef[]> = {
  free: [
    {
      type: "select", key: "free_type", label: "Что отдаете", required: true,
      options: [
        { value: "pickup", label: "Самовывоз" },
        { value: "delivery", label: "Могу передать" },
        { value: "exchange", label: "Можно обмен" },
      ],
    },
  ],

  // ── Транспорт ──────────────────────────────────────────────────────────────
  "cars": [
    {
      type: "select", key: "vehicle_type", label: "Тип транспорта", required: true,
      options: [
        { value: "car",        label: "Легковой автомобиль" },
        { value: "truck",      label: "Грузовой автомобиль" },
        { value: "moto",       label: "Мотоцикл / мопед" },
        { value: "commercial", label: "Коммерческий транспорт" },
        { value: "special",    label: "Спецтехника" },
        { value: "trailer",    label: "Прицеп" },
      ],
    },
    {
      type: "select", key: "make", label: "Марка", required: true,
      options: CARS_MAKES,
    },
    {
      type: "input", key: "model", label: "Модель", required: true,
      placeholder: "Например: Camry, X5, Polo",
    },
    {
      type: "range", key: "year", label: "Год выпуска",
      placeholderFrom: "от", placeholderTo: "до",
    },
    {
      type: "input", key: "mileage", label: "Пробег, км", inputType: "number",
      placeholder: "0 — для новых",
    },
    {
      type: "select", key: "body_type", label: "Тип кузова",
      options: [
        { value: "sedan",     label: "Седан" },
        { value: "hatchback", label: "Хэтчбек" },
        { value: "suv",       label: "Внедорожник / SUV" },
        { value: "wagon",     label: "Универсал" },
        { value: "coupe",     label: "Купе" },
        { value: "minivan",   label: "Минивэн / Микроавтобус" },
        { value: "pickup",    label: "Пикап" },
        { value: "cabriolet", label: "Кабриолет" },
        { value: "liftback",  label: "Лифтбек" },
      ],
    },
    {
      type: "select", key: "fuel", label: "Тип двигателя",
      options: [
        { value: "petrol",   label: "Бензин" },
        { value: "diesel",   label: "Дизель" },
        { value: "hybrid",   label: "Гибрид (бензин + электро)" },
        { value: "electric", label: "Электромобиль" },
        { value: "gas",      label: "Газ (LPG/CNG)" },
        { value: "gas_petrol", label: "Газ + бензин" },
      ],
    },
    {
      type: "input", key: "engine_volume", label: "Объём двигателя, л", inputType: "number",
      placeholder: "Например: 2.0",
    },
    {
      type: "input", key: "engine_power", label: "Мощность, л.с.", inputType: "number",
      placeholder: "Например: 150",
    },
    {
      type: "toggle-row", key: "transmission", label: "КПП",
      options: [
        { value: "auto",   label: "Автомат" },
        { value: "manual", label: "Механика" },
        { value: "robot",  label: "Робот" },
        { value: "cvt",    label: "Вариатор" },
      ],
    },
    {
      type: "toggle-row", key: "drive", label: "Привод",
      options: [
        { value: "fwd", label: "Передний" },
        { value: "rwd", label: "Задний" },
        { value: "4wd", label: "Полный" },
      ],
    },
    {
      type: "select", key: "color", label: "Цвет",
      options: [
        "Белый","Чёрный","Серебристый","Серый","Синий","Красный",
        "Зелёный","Коричневый","Бежевый","Оранжевый","Другой",
      ],
    },
    {
      type: "select", key: "owners_count", label: "Владельцев по ПТС",
      options: [
        { value: "1", label: "1 владелец" },
        { value: "2", label: "2 владельца" },
        { value: "3", label: "3 и более" },
      ],
    },
    {
      type: "toggle-row", key: "pts", label: "ПТС",
      options: [
        { value: "original", label: "Оригинал" },
        { value: "duplicate",label: "Дубликат" },
        { value: "electronic",label: "Электронный" },
      ],
    },
    {
      type: "select", key: "customs", label: "Таможня",
      options: [
        { value: "cleared",   label: "Растаможен" },
        { value: "uncleared", label: "Не растаможен" },
      ],
    },
    {
      type: "select", key: "vin", label: "VIN проверка",
      options: [
        { value: "clean",    label: "Нет ограничений" },
        { value: "unknown",  label: "Не проверял" },
      ],
    },
  ],

  // ── Недвижимость ───────────────────────────────────────────────────────────
  "real-estate": [
    {
      type: "toggle-row", key: "deal_type", label: "Тип сделки", required: true,
      options: [
        { value: "sell",       label: "Продажа" },
        { value: "rent",       label: "Аренда" },
        { value: "rent_daily", label: "Посуточно" },
      ],
    },
    {
      type: "select", key: "property_type", label: "Тип объекта", required: true,
      options: [
        { value: "apartment",  label: "Квартира" },
        { value: "room",       label: "Комната" },
        { value: "house",      label: "Дом / Коттедж" },
        { value: "dacha",      label: "Дача" },
        { value: "land",       label: "Участок" },
        { value: "commercial", label: "Коммерческая недвижимость" },
        { value: "garage",     label: "Гараж / Машиноместо" },
        { value: "new_build",  label: "Новостройка" },
      ],
    },
    {
      type: "toggle-row", key: "rooms", label: "Количество комнат",
      options: [
        { value: "studio", label: "Студия" },
        { value: "1",      label: "1" },
        { value: "2",      label: "2" },
        { value: "3",      label: "3" },
        { value: "4",      label: "4" },
        { value: "5+",     label: "5+" },
      ],
    },
    {
      type: "input", key: "total_area", label: "Общая площадь, м²", inputType: "number",
      placeholder: "Например: 65",
    },
    {
      type: "input", key: "living_area", label: "Жилая площадь, м²", inputType: "number",
      placeholder: "Например: 40",
    },
    {
      type: "input", key: "kitchen_area", label: "Кухня, м²", inputType: "number",
      placeholder: "Например: 12",
    },
    {
      type: "range", key: "floor", label: "Этаж",
      placeholderFrom: "этаж", placeholderTo: "из",
    },
    {
      type: "select", key: "building_type", label: "Тип дома",
      options: [
        { value: "panel",  label: "Панельный" },
        { value: "brick",  label: "Кирпичный" },
        { value: "mono",   label: "Монолитный" },
        { value: "block",  label: "Блочный" },
        { value: "wood",   label: "Деревянный" },
        { value: "foam",   label: "Пенобетон / Газобетон" },
      ],
    },
    {
      type: "input", key: "build_year", label: "Год постройки", inputType: "number",
      placeholder: "Например: 2015",
    },
    {
      type: "select", key: "renovation", label: "Ремонт",
      options: [
        { value: "design",    label: "Дизайнерский" },
        { value: "euro",      label: "Евроремонт" },
        { value: "good",      label: "Хороший" },
        { value: "cosmetic",  label: "Косметический" },
        { value: "none",      label: "Требует ремонта" },
        { value: "rough",     label: "Черновая отделка" },
      ],
    },
    {
      type: "select", key: "bathroom", label: "Санузел",
      options: [
        { value: "combined", label: "Совмещённый" },
        { value: "separate", label: "Раздельный" },
        { value: "multiple", label: "Несколько" },
      ],
    },
    {
      type: "select", key: "balcony", label: "Балкон / Лоджия",
      options: [
        { value: "balcony",  label: "Балкон" },
        { value: "loggia",   label: "Лоджия" },
        { value: "both",     label: "Балкон и лоджия" },
        { value: "none",     label: "Нет" },
      ],
    },
    {
      type: "toggle-row", key: "from_owner", label: "Продавец",
      options: [
        { value: "owner",  label: "Собственник" },
        { value: "agent",  label: "Агентство" },
      ],
    },
    {
      type: "toggle-row", key: "mortgage", label: "Ипотека",
      options: [
        { value: "yes",      label: "Возможна" },
        { value: "no",       label: "Нет" },
        { value: "approved", label: "Одобрена" },
      ],
    },
  ],

  // ── Электроника ────────────────────────────────────────────────────────────
  "electronics": [
    {
      type: "select", key: "subcategory", label: "Подкатегория", required: true,
      options: [
        { value: "phones",    label: "Смартфоны" },
        { value: "tablets",   label: "Планшеты" },
        { value: "laptops",   label: "Ноутбуки" },
        { value: "pc",        label: "Настольные ПК" },
        { value: "monitors",  label: "Мониторы" },
        { value: "tv",        label: "Телевизоры" },
        { value: "audio",     label: "Аудиотехника" },
        { value: "headphones",label: "Наушники" },
        { value: "photo",     label: "Фото / Видео" },
        { value: "consoles",  label: "Игровые консоли" },
        { value: "wearables", label: "Умные часы / Фитнес-трекеры" },
        { value: "components",label: "Комплектующие ПК" },
        { value: "network",   label: "Сетевое оборудование" },
        { value: "other",     label: "Другое" },
      ],
    },
    {
      type: "select", key: "brand", label: "Бренд",
      options: [
        "Apple","Samsung","Xiaomi","Huawei","Sony","LG","Asus","Lenovo",
        "HP","Dell","MSI","Acer","OnePlus","Realme","Google","Nothing",
        "Oppo","Honor","Vivo","Bose","JBL","Sennheiser","Другой",
      ],
    },
    {
      type: "input", key: "model", label: "Модель",
      placeholder: "Например: iPhone 15 Pro, Galaxy S24",
    },
    {
      type: "input", key: "storage", label: "Объём памяти (ГБ)", inputType: "number",
      placeholder: "Например: 256",
    },
    {
      type: "select", key: "color", label: "Цвет",
      options: [
        "Чёрный","Белый","Серый","Серебристый","Золотой",
        "Синий","Зелёный","Красный","Розовый","Другой",
      ],
    },
    {
      type: "select", key: "warranty", label: "Гарантия",
      options: [
        { value: "yes",   label: "Есть" },
        { value: "no",    label: "Нет" },
        { value: "mfr",   label: "Производителя" },
        { value: "store", label: "Магазинная" },
      ],
    },
  ],

  // ── Дом и интерьер ─────────────────────────────────────────────────────────
  "home": [
    {
      type: "select", key: "subcategory", label: "Подкатегория", required: true,
      options: [
        { value: "furniture",  label: "Мебель" },
        { value: "appliances", label: "Бытовая техника" },
        { value: "kitchen",    label: "Кухонная техника" },
        { value: "lighting",   label: "Освещение" },
        { value: "textiles",   label: "Текстиль / Ковры" },
        { value: "decor",      label: "Декор / Интерьер" },
        { value: "tools",      label: "Инструменты" },
        { value: "garden",     label: "Дача и сад" },
        { value: "plumbing",   label: "Сантехника" },
        { value: "repair",     label: "Стройматериалы" },
        { value: "other",      label: "Другое" },
      ],
    },
    {
      type: "select", key: "material", label: "Материал",
      options: [
        "Дерево","МДФ","ДСП","Металл","Пластик","Стекло","Ткань","Кожа","Другой",
      ],
    },
    {
      type: "select", key: "color", label: "Цвет / Оттенок",
      options: [
        "Белый","Чёрный","Серый","Коричневый","Бежевый","Дуб","Венге","Другой",
      ],
    },
  ],

  // ── Одежда ─────────────────────────────────────────────────────────────────
  "fashion": [
    {
      type: "toggle-row", key: "gender", label: "Для кого", required: true,
      options: [
        { value: "women", label: "Женское" },
        { value: "men",   label: "Мужское" },
        { value: "kids",  label: "Детское" },
        { value: "unisex",label: "Унисекс" },
      ],
    },
    {
      type: "select", key: "subcategory", label: "Тип", required: true,
      options: [
        { value: "outerwear",   label: "Верхняя одежда" },
        { value: "tops",        label: "Верх (футболки, рубашки)" },
        { value: "bottoms",     label: "Низ (брюки, юбки)" },
        { value: "dresses",     label: "Платья / Комбинезоны" },
        { value: "shoes",       label: "Обувь" },
        { value: "bags",        label: "Сумки / Рюкзаки" },
        { value: "accessories", label: "Аксессуары" },
        { value: "sport",       label: "Спортивная одежда" },
        { value: "underwear",   label: "Нижнее бельё" },
        { value: "other",       label: "Другое" },
      ],
    },
    {
      type: "select", key: "brand", label: "Бренд",
      options: [
        "Nike","Adidas","Zara","H&M","Levi's","Tommy Hilfiger","Calvin Klein",
        "Gucci","Prada","Burberry","Stone Island","The North Face","Uniqlo","Другой",
      ],
    },
    {
      type: "select", key: "size", label: "Размер (одежда)",
      options: ["XXS","XS","S","M","L","XL","XXL","XXXL","42","44","46","48","50","52","54","56+"],
    },
    {
      type: "select", key: "shoe_size", label: "Размер (обувь)",
      options: ["34","35","36","37","38","39","40","41","42","43","44","45","46","47+"],
    },
    {
      type: "select", key: "color", label: "Цвет",
      options: [
        "Белый","Чёрный","Серый","Синий","Красный","Зелёный",
        "Бежевый","Коричневый","Розовый","Жёлтый","Оранжевый","Мультиколор",
      ],
    },
  ],

  // ── Детям ──────────────────────────────────────────────────────────────────
  "kids": [
    {
      type: "select", key: "subcategory", label: "Подкатегория", required: true,
      options: [
        { value: "clothing",   label: "Одежда и обувь" },
        { value: "toys",       label: "Игрушки" },
        { value: "strollers",  label: "Коляски" },
        { value: "car_seats",  label: "Автокресла" },
        { value: "furniture",  label: "Детская мебель" },
        { value: "school",     label: "Школа и хобби" },
        { value: "sport",      label: "Спорт" },
        { value: "nutrition",  label: "Питание и уход" },
        { value: "books",      label: "Книги" },
        { value: "other",      label: "Другое" },
      ],
    },
    {
      type: "select", key: "age_group", label: "Возраст",
      options: [
        { value: "0-1",  label: "До 1 года" },
        { value: "1-3",  label: "1–3 года" },
        { value: "3-7",  label: "3–7 лет" },
        { value: "7-12", label: "7–12 лет" },
        { value: "12+",  label: "Подростки 12+" },
      ],
    },
    {
      type: "select", key: "gender", label: "Для кого",
      options: [
        { value: "boys",  label: "Для мальчиков" },
        { value: "girls", label: "Для девочек" },
        { value: "any",   label: "Универсальное" },
      ],
    },
  ],

  // ── Спорт ──────────────────────────────────────────────────────────────────
  "sport": [
    {
      type: "select", key: "subcategory", label: "Подкатегория", required: true,
      options: [
        { value: "bikes",     label: "Велосипеды" },
        { value: "fitness",   label: "Тренажёры и фитнес" },
        { value: "skiing",    label: "Лыжи / Сноуборд" },
        { value: "tourism",   label: "Туризм / Кемпинг" },
        { value: "fishing",   label: "Рыбалка" },
        { value: "hunting",   label: "Охота" },
        { value: "team",      label: "Командные виды спорта" },
        { value: "scooters",  label: "Самокаты / Гироскутеры" },
        { value: "water",     label: "Водный спорт" },
        { value: "martial",   label: "Единоборства" },
        { value: "climbing",  label: "Альпинизм / Скалолазание" },
        { value: "equestrian",label: "Конный спорт" },
        { value: "other",     label: "Другое" },
      ],
    },
    {
      type: "select", key: "brand", label: "Бренд",
      options: [
        "Nike","Adidas","Reebok","Puma","Under Armour","Decathlon","Trek",
        "Giant","Shimano","Fischer","Atomic","Другой",
      ],
    },
  ],

  // ── Услуги ─────────────────────────────────────────────────────────────────
  "services": [
    {
      type: "select", key: "subcategory", label: "Подкатегория", required: true,
      options: [
        { value: "repair_home",  label: "Ремонт квартир / домов" },
        { value: "plumbing",     label: "Сантехника" },
        { value: "electrical",   label: "Электрика" },
        { value: "cleaning",     label: "Уборка" },
        { value: "moving",       label: "Грузчики / Переезды" },
        { value: "beauty",       label: "Красота и здоровье" },
        { value: "it",           label: "IT / Программирование" },
        { value: "design",       label: "Дизайн и реклама" },
        { value: "legal",        label: "Юридические услуги" },
        { value: "accounting",   label: "Бухгалтерия" },
        { value: "tutor",        label: "Репетиторы" },
        { value: "photo_video",  label: "Фото и видеосъёмка" },
        { value: "auto_service", label: "Автосервис" },
        { value: "courier",      label: "Курьерские услуги" },
        { value: "vet",          label: "Ветеринария" },
        { value: "other",        label: "Другое" },
      ],
    },
    {
      type: "toggle-row", key: "service_type", label: "Формат",
      options: [
        { value: "remote",  label: "Онлайн / удалённо" },
        { value: "onsite",  label: "Выезд к клиенту" },
        { value: "inhouse", label: "У мастера" },
      ],
    },
    {
      type: "select", key: "price_type", label: "Тип цены",
      options: [
        { value: "fixed",  label: "Фиксированная" },
        { value: "hourly", label: "За час" },
        { value: "nego",   label: "Договорная" },
      ],
    },
    {
      type: "select", key: "experience", label: "Опыт",
      options: [
        { value: "1",  label: "До 1 года" },
        { value: "3",  label: "1–3 года" },
        { value: "5",  label: "3–5 лет" },
        { value: "10", label: "5–10 лет" },
        { value: "10+",label: "Более 10 лет" },
      ],
    },
  ],

  // ── Работа ─────────────────────────────────────────────────────────────────
  "jobs": [
    {
      type: "toggle-row", key: "listing_type", label: "Тип объявления", required: true,
      options: [
        { value: "vacancy", label: "Вакансия" },
        { value: "resume",  label: "Резюме" },
      ],
    },
    {
      type: "select", key: "employment_type", label: "Тип занятости", required: true,
      options: [
        { value: "full_time",   label: "Полная занятость" },
        { value: "part_time",   label: "Частичная занятость" },
        { value: "freelance",   label: "Фриланс / Проект" },
        { value: "internship",  label: "Стажировка" },
        { value: "volunteer",   label: "Волонтёрство" },
      ],
    },
    {
      type: "select", key: "schedule", label: "График",
      options: [
        { value: "full_day", label: "Полный день" },
        { value: "shift",    label: "Сменный" },
        { value: "flexible", label: "Гибкий" },
        { value: "remote",   label: "Удалённая работа" },
      ],
    },
    {
      type: "select", key: "experience", label: "Опыт работы",
      options: [
        { value: "no_exp", label: "Без опыта" },
        { value: "1_3",    label: "1–3 года" },
        { value: "3_6",    label: "3–6 лет" },
        { value: "6plus",  label: "Более 6 лет" },
      ],
    },
    {
      type: "input", key: "company", label: "Компания / Организация",
      placeholder: "Название компании или работодателя",
    },
  ],

  // ── Животные ───────────────────────────────────────────────────────────────
  "animals": [
    {
      type: "select", key: "animal_type", label: "Тип животного", required: true,
      options: [
        { value: "dogs",     label: "Собаки" },
        { value: "cats",     label: "Кошки" },
        { value: "birds",    label: "Птицы" },
        { value: "fish",     label: "Рыбки и аквариум" },
        { value: "rodents",  label: "Грызуны и кролики" },
        { value: "reptiles", label: "Рептилии" },
        { value: "farm",     label: "Сельхоз животные" },
        { value: "other",    label: "Другие животные" },
        { value: "supplies", label: "Товары для животных" },
        { value: "services", label: "Услуги (груминг, вет, передержка)" },
      ],
    },
    {
      type: "select", key: "breed", label: "Порода",
      options: [
        "Немецкая овчарка","Лабрадор","Хаски","Голден ретривер","Йоркширский терьер",
        "Французский бульдог","Чихуахуа","Шпиц","Британская","Шотландская вислоухая",
        "Мейн-кун","Сфинкс","Метис / Беспородный","Другая",
      ],
    },
    {
      type: "toggle-row", key: "animal_gender", label: "Пол",
      options: [
        { value: "male",   label: "Мальчик" },
        { value: "female", label: "Девочка" },
      ],
    },
    {
      type: "select", key: "age", label: "Возраст",
      options: [
        { value: "puppy",   label: "Щенок / Котёнок" },
        { value: "young",   label: "Молодой (до 1 года)" },
        { value: "adult",   label: "Взрослый (1–7 лет)" },
        { value: "senior",  label: "Пожилой (7+ лет)" },
      ],
    },
  ],

  // ── Хобби ──────────────────────────────────────────────────────────────────
  "hobby": [
    {
      type: "select", key: "subcategory", label: "Подкатегория", required: true,
      options: [
        { value: "books",     label: "Книги" },
        { value: "music",     label: "Музыкальные инструменты" },
        { value: "art",       label: "Рисование и творчество" },
        { value: "games",     label: "Настольные игры / Игры" },
        { value: "collectibles", label: "Коллекционирование" },
        { value: "photo",     label: "Фото и видео" },
        { value: "sewing",    label: "Рукоделие и шитьё" },
        { value: "garden",    label: "Садоводство" },
        { value: "travel",    label: "Путешествия" },
        { value: "other",     label: "Другое" },
      ],
    },
    {
      type: "select", key: "condition", label: "Состояние",
      options: [
        { value: "new",       label: "Новое" },
        { value: "like_new",  label: "Как новое" },
        { value: "good",      label: "Хорошее" },
        { value: "fair",      label: "Удовлетворительное" },
      ],
    },
  ],
}

const CITIES = [
  "Москва","Санкт-Петербург","Казань","Екатеринбург","Новосибирск",
  "Сочи","Краснодар","Нижний Новгород","Самара","Ростов-на-Дону",
  "Уфа","Воронеж","Пермь","Тюмень","Омск","Красноярск","Волгоград",
  "Иркутск","Хабаровск","Владивосток","Ставрополь","Тула","Калининград",
]

// ── Component ────────────────────────────────────────────────────────────────

export default function CreatePage() {
  const router = useRouter()
  const [category, setCategory] = useState("")
  const [extraFields, setExtraFields] = useState<Record<string, string>>({})
  const [form, setForm] = useState({ title: "", description: "", price: "", city: "", address: "", condition: "used", free: false })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState("")
  const [images, setImages] = useState<string[]>([])
  const [video, setVideo]   = useState<string>("")
  const [uploading, setUploading] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function geocodeAddress(address: string) {
    if (!address.trim()) return
    setGeocoding(true)
    try {
      const query = form.city ? `${form.city}, ${address}` : address
      const res = await fetch(`/api/geocode?address=${encodeURIComponent(query)}`)
      if (res.ok) { const data = await res.json(); setCoords(data) }
    } catch { /* ignore */ } finally {
      setGeocoding(false)
    }
  }

  function onAddressChange(value: string) {
    setForm((f) => ({ ...f, address: value }))
    setCoords(null)
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current)
    if (value.trim()) {
      geocodeTimer.current = setTimeout(() => geocodeAddress(value), 800)
    }
  }

  function updateExtra(key: string, value: string) {
    setExtraFields((f) => ({ ...f, [key]: value }))
  }

  function update(key: keyof typeof form, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }))
    setError("")
  }

  const extraDefs = CATEGORY_EXTRA_FIELDS[category] ?? []

  async function uploadFile(file: File, type: "image" | "video") {
    setUploading(true)
    const fd = new FormData()
    fd.append("file", file)
    fd.append("type", type)
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const text = await res.text()
      let data: { url?: string; error?: string }
      try { data = JSON.parse(text) } catch {
        throw new Error(res.status === 413 ? "Файл слишком большой для сервера (>50MB)" : "Ошибка сервера при загрузке")
      }
      if (!res.ok) throw new Error(data.error || "Ошибка загрузки")
      if (type === "image") setImages((prev) => [...prev, data.url!])
      else setVideo(data.url!)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки")
    } finally {
      setUploading(false)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!form.title.trim()) return setError("Введите название")
    if (!category)          return setError("Выберите категорию")
    if (!form.city)         return setError("Выберите город")
    if (!form.free && (!form.price || isNaN(Number(form.price)))) return setError("Введите цену")

    // Validate required extra fields
    for (const def of extraDefs) {
      if ((def as { required?: boolean }).required && !extraFields[def.key]?.trim()) {
        return setError(`Укажите: ${def.label}`)
      }
    }

    setLoading(true)

    // Build description with minimum length
    const description = form.description.trim() || form.title.trim()
    const descFull = description.length < 10 ? description.padEnd(10, " ") : description

    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      description: descFull,
      price: form.free ? 0 : Number(form.price),
      categorySlug: category,
      city: form.city,
      images,
      attributes: { condition: form.condition, ...extraFields },
    }
    if (video) payload.video = video
    if (form.address.trim()) payload.location = form.address.trim()
    if (coords) { payload.lat = coords.lat; payload.lng = coords.lng }

    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.status === 401) { router.push("/login?from=/create"); return }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Ошибка при сохранении")
      router.push("/my-listings")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка при сохранении")
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 pb-28 lg:pb-10">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Разместить объявление</h1>
      <p className="mt-1 text-sm text-zinc-500">Заполните форму — объявление появится сразу после публикации</p>

      <form onSubmit={submit} className="mt-8 space-y-6">

        {/* ── Category picker ─────────────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-3">
            Категория <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setCategory(c.id)
                  setExtraFields({})
                  if (c.id === "free") setForm((current) => ({ ...current, free: true, price: "" }))
                }}
                className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 px-2 py-3 text-center text-xs font-medium transition ${
                  category === c.id
                    ? "border-[hsl(var(--nashlo-orange))] bg-[hsl(var(--nashlo-orange)/0.06)] text-zinc-950"
                    : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300 hover:bg-white"
                }`}
              >
                <span className="text-xl">{c.icon}</span>
                <span className="leading-4">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Title ──────────────────────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Название <span className="text-red-500">*</span>
          </label>
          <input
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            maxLength={80}
            placeholder="Кратко опишите товар или услугу"
            className="mt-1.5 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none transition focus:border-[hsl(var(--nashlo-orange))] focus:bg-white"
          />
          <p className="mt-1 text-right text-xs text-zinc-400">{form.title.length}/80</p>
        </div>

        {/* ── Category-specific extra fields ─────────────────────────────── */}
        {extraDefs.length > 0 && (
          <div className="space-y-4 rounded-3xl border border-zinc-100 bg-zinc-50 p-5">
            <p className="text-sm font-semibold text-zinc-950">
              Параметры: {CATEGORIES.find((c) => c.id === category)?.label}
            </p>
            {extraDefs.map((def) => {
              if (def.type === "select") {
                return (
                  <div key={def.key}>
                    <label className="block text-sm font-medium text-zinc-700">
                      {def.label}{def.required && <span className="text-red-500"> *</span>}
                    </label>
                    <select
                      value={extraFields[def.key] || ""}
                      onChange={(e) => updateExtra(def.key, e.target.value)}
                      className="mt-1.5 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none transition focus:border-[hsl(var(--nashlo-orange))]"
                    >
                      <option value="">Выберите...</option>
                      {def.options.map((o) =>
                        typeof o === "string"
                          ? <option key={o} value={o}>{o}</option>
                          : <option key={o.value} value={o.value}>{o.label}</option>
                      )}
                    </select>
                  </div>
                )
              }

              if (def.type === "input") {
                return (
                  <div key={def.key}>
                    <label className="block text-sm font-medium text-zinc-700">
                      {def.label}{def.required && <span className="text-red-500"> *</span>}
                    </label>
                    <input
                      type={def.inputType || "text"}
                      value={extraFields[def.key] || ""}
                      onChange={(e) => updateExtra(def.key, e.target.value)}
                      placeholder={def.placeholder}
                      className="mt-1.5 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none transition focus:border-[hsl(var(--nashlo-orange))]"
                    />
                  </div>
                )
              }

              if (def.type === "range") {
                return (
                  <div key={def.key}>
                    <label className="block text-sm font-medium text-zinc-700">{def.label}</label>
                    <div className="mt-1.5 flex gap-2">
                      <input
                        type="number"
                        value={extraFields[def.key + "_from"] || ""}
                        onChange={(e) => updateExtra(def.key + "_from", e.target.value)}
                        placeholder={def.placeholderFrom || "от"}
                        className="h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none transition focus:border-[hsl(var(--nashlo-orange))]"
                      />
                      <input
                        type="number"
                        value={extraFields[def.key + "_to"] || ""}
                        onChange={(e) => updateExtra(def.key + "_to", e.target.value)}
                        placeholder={def.placeholderTo || "до"}
                        className="h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none transition focus:border-[hsl(var(--nashlo-orange))]"
                      />
                    </div>
                  </div>
                )
              }

              if (def.type === "toggle-row") {
                return (
                  <div key={def.key}>
                    <label className="block text-sm font-medium text-zinc-700">
                      {def.label}{def.required && <span className="text-red-500"> *</span>}
                    </label>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {def.options.map((o) => (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => updateExtra(def.key, o.value)}
                          className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                            extraFields[def.key] === o.value
                              ? "border-zinc-950 bg-zinc-950 text-white"
                              : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                          }`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              }

              return null
            })}
          </div>
        )}

        {/* ── Description ────────────────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-zinc-700">Описание</label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={5}
            maxLength={3000}
            placeholder="Подробнее о товаре: состояние, комплектация, причина продажи..."
            className="mt-1.5 w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm outline-none transition focus:border-[hsl(var(--nashlo-orange))] focus:bg-white"
          />
          <p className="mt-1 text-right text-xs text-zinc-400">{form.description.length}/3000</p>
        </div>

        {/* ── Price + Condition ──────────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Цена, ₽ <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1.5">
              <input
                type="number" min="0"
                value={form.free ? "" : form.price}
                onChange={(e) => update("price", e.target.value)}
                disabled={form.free}
                placeholder={form.free ? "Бесплатно" : "0"}
                className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 pr-8 text-sm outline-none transition focus:border-[hsl(var(--nashlo-orange))] focus:bg-white disabled:text-zinc-400"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400">₽</span>
            </div>
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-zinc-500">
              <input
                type="checkbox"
                checked={form.free}
                onChange={(e) => update("free", e.target.checked)}
                className="rounded"
              />
              Бесплатно / Отдам даром
            </label>
          </div>

          {category !== "services" && category !== "real-estate" && (
            <div>
              <label className="block text-sm font-medium text-zinc-700">Состояние</label>
              <div className="mt-1.5 flex gap-2">
                {[{ id: "new", label: "Новое" }, { id: "used", label: "Б/у" }].map((c) => (
                  <button
                    key={c.id} type="button"
                    onClick={() => update("condition", c.id)}
                    className={`flex-1 rounded-2xl border py-3 text-sm font-medium transition ${
                      form.condition === c.id
                        ? "border-zinc-950 bg-zinc-950 text-white"
                        : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── City + Address ─────────────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Город <span className="text-red-500">*</span>
            </label>
            <select
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              className="mt-1.5 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none transition focus:border-[hsl(var(--nashlo-orange))] focus:bg-white"
            >
              <option value="">Выберите город</option>
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Адрес <span className="text-zinc-400 font-normal text-xs">(для карты)</span>
            </label>
            <div className="relative mt-1.5">
              <input
                value={form.address}
                onChange={(e) => onAddressChange(e.target.value)}
                placeholder="ул. Ленина, 10"
                className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 pr-10 text-sm outline-none transition focus:border-[hsl(var(--nashlo-orange))] focus:bg-white"
              />
              {geocoding && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
                </div>
              )}
              {coords && !geocoding && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 text-sm">📍</span>
              )}
            </div>
            {coords && <p className="mt-1 text-xs text-emerald-600">Место найдено на карте ✓</p>}
          </div>
        </div>

        {/* Фото */}
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700">Фотографии <span className="text-zinc-400">(до 10 штук)</span></p>
          <div className="flex flex-wrap gap-2">
            {images.map((url, i) => (
              <div key={i} className="relative h-24 w-24 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[10px] text-white"
                >✕</button>
              </div>
            ))}
            {images.length < 10 && (
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={uploading}
                className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-zinc-200 text-zinc-400 hover:border-zinc-400 hover:text-zinc-600 disabled:opacity-50"
              >
                <span className="text-2xl">+</span>
                <span className="text-[10px]">Фото</span>
              </button>
            )}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || [])
                files.slice(0, 10 - images.length).forEach((f) => uploadFile(f, "image"))
                e.target.value = ""
              }}
            />
          </div>
        </div>

        {/* Видео */}
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700">Видео <span className="text-zinc-400">(до 50MB, необязательно)</span></p>
          {video ? (
            <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
              <video src={video} controls className="max-h-48 w-full object-cover" />
              <button
                type="button"
                onClick={() => setVideo("")}
                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white"
              >✕</button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              disabled={uploading}
              className="flex h-16 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-200 text-sm text-zinc-400 hover:border-zinc-400 hover:text-zinc-600 disabled:opacity-50"
            >
              <span className="text-lg">▶</span> Загрузить видео
            </button>
          )}
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) uploadFile(f, "video")
              e.target.value = ""
            }}
          />
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading || uploading}
          className="h-12 w-full rounded-2xl bg-[hsl(var(--nashlo-orange))] text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {uploading ? "Загружаем фото..." : loading ? "Публикуем..." : "Опубликовать объявление"}
        </button>

        <p className="text-center text-xs text-zinc-400">
          Нажимая кнопку, вы соглашаетесь с{" "}
          <a href="/terms" className="underline hover:text-zinc-700">условиями использования</a>
        </p>
      </form>
    </main>
  )
}
