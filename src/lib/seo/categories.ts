type SeoChildFilter = {
  key: string
  value: string
}

export type SeoCategoryChild = {
  slug: string
  label: string
  title: string
  description: string
  internalCategorySlug?: string
  filter?: SeoChildFilter
}

export type SeoStructuredDataType = "CollectionPage" | "ItemList"

export type SeoCategoryConfig = {
  slug: string
  label: string
  /** H1 на странице категории */
  h1: string
  /** Шаблон meta title (корневая страница) */
  title: string
  description: string
  internalCategorySlug: string
  cityCategorySlugs?: string[]
  oldPaths: string[]
  children: SeoCategoryChild[]
  /** Похожие разделы для перелинковки */
  relatedSlugs?: string[]
  structuredDataType?: SeoStructuredDataType
  /** Корневая страница в sitemap */
  sitemapPriority?: number
}

const transportChildren: SeoCategoryChild[] = [
  {
    slug: "passenger-cars",
    label: "Легковые автомобили",
    title: "Легковые автомобили",
    description: "Подборка объявлений о продаже легковых автомобилей с актуальными предложениями и фото.",
    filter: { key: "vehicle_type", value: "car" },
  },
  {
    slug: "commercial",
    label: "Коммерческий транспорт",
    title: "Коммерческий транспорт",
    description: "Объявления о продаже коммерческого транспорта, фургонов и спецавтомобилей.",
    filter: { key: "vehicle_type", value: "commercial" },
  },
  {
    slug: "motorcycles",
    label: "Мототехника",
    title: "Мототехника",
    description: "Мотоциклы, скутеры и мототехника с фото, описанием и ценой.",
    filter: { key: "vehicle_type", value: "moto" },
  },
  {
    slug: "parts",
    label: "Запчасти",
    title: "Автозапчасти",
    description: "Запчасти и комплектующие для автомобилей с фильтрами по совместимости и брендам.",
    internalCategorySlug: "parts",
  },
]

const realEstateChildren: SeoCategoryChild[] = [
  {
    slug: "apartments",
    label: "Квартиры",
    title: "Квартиры",
    description: "Квартиры для продажи и аренды с фильтрами по площади, этажу и ремонту.",
    filter: { key: "property_type", value: "apartment" },
  },
  {
    slug: "houses",
    label: "Дома",
    title: "Дома",
    description: "Объявления о продаже и аренде домов, дач и коттеджей.",
    filter: { key: "property_type", value: "house" },
  },
  {
    slug: "commercial",
    label: "Коммерческая недвижимость",
    title: "Коммерческая недвижимость",
    description: "Офисы, помещения и склады для продажи и аренды.",
    filter: { key: "property_type", value: "commercial" },
  },
  {
    slug: "land",
    label: "Земельные участки",
    title: "Земельные участки",
    description: "Земельные участки, дачи и территории под строительство.",
    filter: { key: "property_type", value: "land" },
  },
]

const servicesChildren: SeoCategoryChild[] = [
  {
    slug: "repair",
    label: "Ремонт",
    title: "Услуги ремонта",
    description: "Мастера по ремонту квартир, домов и техники.",
    filter: { key: "subcategory", value: "repair_home" },
  },
  {
    slug: "design",
    label: "Дизайн",
    title: "Дизайн и проектирование",
    description: "Дизайнеры интерьеров, графики и digital-проектов.",
    filter: { key: "subcategory", value: "design" },
  },
  {
    slug: "beauty",
    label: "Красота",
    title: "Услуги красоты",
    description: "Мастера красоты, ухода и бьюти-услуги рядом.",
    filter: { key: "subcategory", value: "beauty" },
  },
  {
    slug: "auto-service",
    label: "Автосервис",
    title: "Автосервис",
    description: "Обслуживание, ремонт и диагностика автомобилей.",
    filter: { key: "subcategory", value: "auto_service" },
  },
  {
    slug: "tutoring",
    label: "Обучение",
    title: "Обучение и репетиторы",
    description: "Репетиторы, курсы и образовательные услуги.",
    filter: { key: "subcategory", value: "tutor" },
  },
  {
    slug: "delivery",
    label: "Доставка",
    title: "Курьеры и доставка",
    description: "Курьерские услуги, доставка и грузоперевозки.",
    filter: { key: "subcategory", value: "courier" },
  },
]

const electronicsChildren: SeoCategoryChild[] = [
  {
    slug: "phones",
    label: "Смартфоны",
    title: "Смартфоны",
    description: "Смартфоны и телефоны с фильтрами по бренду, памяти и состоянию.",
    filter: { key: "subcategory", value: "phones" },
  },
  {
    slug: "laptops",
    label: "Ноутбуки",
    title: "Ноутбуки",
    description: "Ноутбуки, ультрабуки и игровые модели с фото и характеристиками.",
    filter: { key: "subcategory", value: "laptops" },
  },
  {
    slug: "pc",
    label: "ПК и комплектующие",
    title: "ПК и комплектующие",
    description: "Стационарные компьютеры и комплектующие для апгрейда.",
    filter: { key: "subcategory", value: "pc" },
  },
  {
    slug: "tv-audio",
    label: "ТВ и аудио",
    title: "ТВ и аудио",
    description: "Телевизоры, колонки, аудиосистемы и домашние кинотеатры.",
    filter: { key: "subcategory", value: "tv,audio" },
  },
]

const homeChildren: SeoCategoryChild[] = [
  {
    slug: "furniture",
    label: "Мебель",
    title: "Мебель",
    description: "Мебель для дома, офиса и дачи с фото и описанием.",
    filter: { key: "subcategory", value: "furniture" },
  },
  {
    slug: "appliances",
    label: "Техника",
    title: "Техника для дома",
    description: "Бытовая техника и полезные устройства для дома.",
    filter: { key: "subcategory", value: "appliances" },
  },
  {
    slug: "decor",
    label: "Декор",
    title: "Декор и интерьер",
    description: "Предметы интерьера, текстиль и декор для дома.",
    filter: { key: "subcategory", value: "decor" },
  },
]

const animalsChildren: SeoCategoryChild[] = [
  {
    slug: "dogs",
    label: "Собаки",
    title: "Собаки",
    description: "Щенки, собаки и объявления о продаже и передаче питомцев.",
    filter: { key: "animal_type", value: "dogs" },
  },
  {
    slug: "cats",
    label: "Кошки",
    title: "Кошки",
    description: "Котята и кошки с фото, описанием и условиями передачи.",
    filter: { key: "animal_type", value: "cats" },
  },
  {
    slug: "birds",
    label: "Птицы",
    title: "Птицы",
    description: "Птицы, аксессуары и сопутствующие объявления.",
    filter: { key: "animal_type", value: "birds" },
  },
  {
    slug: "fish",
    label: "Рыбы и аквариумы",
    title: "Рыбы и аквариумы",
    description: "Аквариумы, рыбки и сопутствующие товары.",
    filter: { key: "animal_type", value: "fish" },
  },
]

export const SEO_CATEGORY_CONFIGS: SeoCategoryConfig[] = [
  {
    slug: "transport",
    label: "Транспорт",
    h1: "Транспорт",
    title: "Транспорт на Nashlo — купить и продать",
    description:
      "Объявления о продаже транспорта на Nashlo: автомобили, мото, грузовой транспорт, спецтехника, запчасти и автоуслуги.",
    internalCategorySlug: "cars",
    oldPaths: ["/cars"],
    children: transportChildren,
    relatedSlugs: ["real-estate", "services", "electronics"],
    sitemapPriority: 0.9,
  },
  {
    slug: "real-estate",
    label: "Недвижимость",
    h1: "Недвижимость",
    title: "Недвижимость на Nashlo — купить, продать и снять",
    description:
      "Объявления о продаже и аренде недвижимости на Nashlo: квартиры, дома, комнаты, участки и коммерческие помещения.",
    internalCategorySlug: "real-estate",
    oldPaths: [],
    children: realEstateChildren,
    relatedSlugs: ["transport", "services", "home-and-garden"],
    sitemapPriority: 0.9,
  },
  {
    slug: "services",
    label: "Услуги",
    h1: "Услуги",
    title: "Услуги на Nashlo — специалисты рядом",
    description:
      "Найдите специалистов и услуги рядом с вами на Nashlo: ремонт, доставка, красота, обучение, строительство и другие направления.",
    internalCategorySlug: "services",
    oldPaths: [],
    children: servicesChildren,
    relatedSlugs: ["real-estate", "jobs", "business"],
    sitemapPriority: 0.88,
  },
  {
    slug: "electronics",
    label: "Электроника",
    h1: "Электроника",
    title: "Электроника на Nashlo — купить и продать",
    description:
      "Смартфоны, ноутбуки, компьютеры и техника с фильтрами по бренду, состоянию и цене на Nashlo.",
    internalCategorySlug: "electronics",
    oldPaths: [],
    children: electronicsChildren,
    relatedSlugs: ["home-and-garden", "personal-items", "goods"],
    sitemapPriority: 0.85,
  },
  {
    slug: "home-and-garden",
    label: "Дом и сад",
    h1: "Дом и сад",
    title: "Дом и сад на Nashlo — товары для дома",
    description:
      "Мебель, бытовая техника, декор и товары для сада на Nashlo. Покупайте и продавайте рядом с домом.",
    internalCategorySlug: "home",
    oldPaths: ["/home"],
    children: homeChildren,
    relatedSlugs: ["electronics", "real-estate", "services"],
    sitemapPriority: 0.85,
  },
  {
    slug: "personal-items",
    label: "Одежда, обувь и аксессуары",
    h1: "Личные вещи",
    title: "Одежда и аксессуары на Nashlo",
    description:
      "Одежда, обувь, аксессуары и товары для детей на Nashlo. Актуальные объявления с фото и ценами.",
    internalCategorySlug: "fashion",
    oldPaths: ["/fashion"],
    children: [
      {
        slug: "kids",
        label: "Детские товары",
        title: "Детские товары на Nashlo",
        description: "Одежда, игрушки и товары для детей разных возрастов.",
        internalCategorySlug: "kids",
      },
    ],
    relatedSlugs: ["electronics", "hobby", "free"],
    sitemapPriority: 0.82,
  },
  {
    slug: "hobby",
    label: "Хобби и отдых",
    h1: "Хобби и отдых",
    title: "Хобби и отдых на Nashlo",
    description:
      "Товары для хобби, творчества, коллекций, спорта и активного отдыха на Nashlo.",
    internalCategorySlug: "hobby",
    oldPaths: [],
    children: [
      {
        slug: "sport",
        label: "Спорт и отдых",
        title: "Спорт и отдых на Nashlo",
        description: "Велосипеды, тренажёры, туризм и спортивные товары.",
        internalCategorySlug: "sport",
      },
    ],
    relatedSlugs: ["electronics", "personal-items", "animals"],
    sitemapPriority: 0.8,
  },
  {
    slug: "animals",
    label: "Животные",
    h1: "Животные",
    title: "Животные на Nashlo — питомцы и товары",
    description:
      "Питомцы, корма, аксессуары и объявления о передаче животных на Nashlo.",
    internalCategorySlug: "animals",
    oldPaths: [],
    children: animalsChildren,
    relatedSlugs: ["services", "home-and-garden", "free"],
    sitemapPriority: 0.8,
  },
  {
    slug: "jobs",
    label: "Работа",
    h1: "Работа",
    title: "Работа на Nashlo — вакансии и подработка",
    description:
      "Вакансии, подработка и предложения работы на Nashlo. Ищите работу рядом или размещайте вакансии.",
    internalCategorySlug: "jobs",
    oldPaths: [],
    children: [],
    relatedSlugs: ["services", "business", "transport"],
    sitemapPriority: 0.85,
  },
  {
    slug: "parts",
    label: "Запчасти и аксессуары",
    h1: "Запчасти",
    title: "Запчасти и аксессуары на Nashlo",
    description:
      "Автозапчасти, шины, диски и аксессуары для авто и техники на Nashlo.",
    internalCategorySlug: "parts",
    oldPaths: [],
    children: [],
    relatedSlugs: ["transport", "electronics", "services"],
    sitemapPriority: 0.78,
  },
  {
    slug: "goods",
    label: "Товары",
    h1: "Товары",
    title: "Товары на Nashlo — покупка и продажа",
    description:
      "Разные категории товаров на Nashlo: электроника, дом, одежда, детские товары и многое другое.",
    internalCategorySlug: "goods",
    oldPaths: [],
    children: [],
    relatedSlugs: ["electronics", "personal-items", "home-and-garden"],
    sitemapPriority: 0.75,
  },
  {
    slug: "free",
    label: "Отдам даром",
    h1: "Отдам даром",
    title: "Отдам даром на Nashlo — бесплатные объявления",
    description:
      "Бесплатные объявления: отдайте ненужные вещи соседям или найдите полезное рядом на Nashlo.",
    internalCategorySlug: "free",
    oldPaths: ["/free"],
    children: [],
    relatedSlugs: ["personal-items", "home-and-garden", "animals"],
    sitemapPriority: 0.7,
  },
  {
    slug: "business",
    label: "Бизнес и услуги",
    h1: "Бизнес",
    title: "Бизнес на Nashlo — продажа и партнёрство",
    description:
      "Продажа бизнеса, франшизы, инвестиции и партнёрские предложения на Nashlo.",
    internalCategorySlug: "business",
    oldPaths: [],
    children: [],
    relatedSlugs: ["services", "jobs", "real-estate"],
    sitemapPriority: 0.72,
  },
]

export function getRelatedSeoCategories(slug: string, limit = 4) {
  const config = getSeoCategoryConfig(slug)
  const related = config?.relatedSlugs ?? []
  return related
    .map((s) => getSeoCategoryConfig(s))
    .filter((c): c is SeoCategoryConfig => Boolean(c))
    .slice(0, limit)
}

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
}

export const SEO_CATEGORY_ROUTE_MAP = Object.fromEntries(
  SEO_CATEGORY_CONFIGS.flatMap((config) => [
    [config.internalCategorySlug, `/${config.slug}`],
    ...config.children
      .filter((child) => child.internalCategorySlug)
      .map((child) => [child.internalCategorySlug as string, `/${config.slug}/${child.slug}`]),
  ]),
) as Record<string, string>

const CHILD_LOOKUP = new Map<string, SeoCategoryChild>(
  SEO_CATEGORY_CONFIGS.flatMap((config) =>
    config.children.map((child) => [`${config.slug}:${child.slug}`, child] as const),
  ),
)

export function getSeoCategoryConfig(slug: string) {
  return SEO_CATEGORY_CONFIGS.find((config) => config.slug === slug) ?? null
}

export function getSeoCategoryRouteByInternalSlug(slug: string) {
  return SEO_CATEGORY_ROUTE_MAP[slug] ?? null
}

export function getSeoCategoryChild(configSlug: string, childSlug: string) {
  return CHILD_LOOKUP.get(`${configSlug}:${childSlug}`) ?? null
}

export function toSeoSegment(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .split("")
    .map((char) => CYRILLIC_TO_LATIN[char] ?? char)
    .join("")

  return normalized
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
}

export function getSeoCategoryPath(categorySlug: string, segment?: string | null) {
  return segment ? `/${categorySlug}/${segment}` : `/${categorySlug}`
}

export function resolveListingSeoPath(input: {
  categorySlug: string | null | undefined
  attributes?: Record<string, unknown> | null
}) {
  const categorySlug = input.categorySlug
  const attributes = input.attributes ?? {}

  if (!categorySlug) return "/search"

  if (categorySlug === "parts") return "/transport/parts"
  if (categorySlug === "kids") return "/personal-items/kids"
  if (categorySlug === "sport") return "/hobby/sport"

  if (categorySlug === "cars") {
    const vehicleType = typeof attributes.vehicle_type === "string" ? attributes.vehicle_type : null
    if (vehicleType === "commercial") return "/transport/commercial"
    if (vehicleType === "moto") return "/transport/motorcycles"
    if (vehicleType === "car") return "/transport/passenger-cars"
    return "/transport"
  }

  if (categorySlug === "real-estate") {
    const propertyType = typeof attributes.property_type === "string" ? attributes.property_type : null
    const propertyTypeMap: Record<string, string> = {
      apartment: "apartments",
      house: "houses",
      commercial: "commercial",
      land: "land",
    }
    return propertyType ? `/real-estate/${propertyTypeMap[propertyType] ?? ""}`.replace(/\/$/, "") : "/real-estate"
  }

  if (categorySlug === "services") {
    const subcategory = typeof attributes.subcategory === "string" ? attributes.subcategory : null
    const subcategoryMap: Record<string, string> = {
      repair_home: "repair",
      design: "design",
      beauty: "beauty",
      auto_service: "auto-service",
      tutor: "tutoring",
      courier: "delivery",
    }
    return subcategory ? `/services/${subcategoryMap[subcategory] ?? ""}`.replace(/\/$/, "") : "/services"
  }

  if (categorySlug === "electronics") {
    const subcategory = typeof attributes.subcategory === "string" ? attributes.subcategory : null
    const subcategoryMap: Record<string, string> = {
      phones: "phones",
      laptops: "laptops",
      pc: "pc",
      tv: "tv-audio",
      audio: "tv-audio",
    }
    return subcategory ? `/electronics/${subcategoryMap[subcategory] ?? ""}`.replace(/\/$/, "") : "/electronics"
  }

  if (categorySlug === "home") return "/home-and-garden"
  if (categorySlug === "fashion") return "/personal-items"
  if (categorySlug === "hobby") return "/hobby"
  if (categorySlug === "animals") {
    const animalType = typeof attributes.animal_type === "string" ? attributes.animal_type : null
    const animalMap: Record<string, string> = {
      dogs: "dogs",
      cats: "cats",
      birds: "birds",
      fish: "fish",
    }
    return animalType ? `/animals/${animalMap[animalType] ?? ""}`.replace(/\/$/, "") : "/animals"
  }
  if (categorySlug === "jobs") return "/jobs"
  if (categorySlug === "parts") return "/parts"
  if (categorySlug === "goods") return "/goods"
  if (categorySlug === "free") return "/free"
  if (categorySlug === "business") return "/search?cat=business"

  return "/search"
}
