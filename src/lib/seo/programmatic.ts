/**
 * Programmatic SEO page engine.
 *
 * Converts any slug of the form:
 *   {intent}-{item}-{citySlug}
 *   {item}-{citySlug}
 *   {service}-{citySlug}
 * …into a full SeoLandingConfig without DB access.
 *
 * This powers ~2 000 auto-generated SEO pages for city × category × intent.
 */

import type { SeoLandingConfig } from "@/lib/seo/landings"
import { SEO_CITIES_BY_SLUG_DESC, getCityBySlug, type SeoCity } from "@/lib/seo/cities"

// ─── Item / service definitions ───────────────────────────────────────────────

type SeoItem = {
  /** One or more URL segments that identify this item (no city suffix) */
  keys: string[]
  /** Nominative: "iPhone", "квартира" */
  noun: string
  /** Nominative plural: "iPhone", "квартиры" */
  nounPlural: string
  /** Accusative (after "Купить"): "iPhone", "квартиру" */
  accusative: string
  /** Internal category slug */
  categorySlug: string
  /** Which intents are relevant */
  intents: SeoIntent[]
  fixedParams?: Record<string, string>
  priority?: number
}

type SeoIntent = "kupit" | "snyat" | "arenda" | "prodat" | "sdat" | "service" | "job" | "bu" | "nedorogo"

const SEO_ITEMS: SeoItem[] = [
  // Electronics
  { keys: ["iphone"],           noun: "iPhone",              nounPlural: "iPhone",            accusative: "iPhone",            categorySlug: "phones",    intents: ["kupit", "bu", "nedorogo"], fixedParams: { brand: "Apple" }, priority: 0.85 },
  { keys: ["samsung"],          noun: "Samsung",             nounPlural: "Samsung",           accusative: "Samsung",           categorySlug: "phones",    intents: ["kupit", "bu"], fixedParams: { brand: "Samsung" } },
  { keys: ["telefon","telefony"],noun: "телефон",            nounPlural: "телефоны",          accusative: "телефон",           categorySlug: "phones",    intents: ["kupit", "bu", "nedorogo"], priority: 0.8 },
  { keys: ["noutbuk","noutbuki"],noun: "ноутбук",            nounPlural: "ноутбуки",          accusative: "ноутбук",           categorySlug: "laptops",   intents: ["kupit", "bu", "nedorogo"], priority: 0.8 },
  { keys: ["planset","planshety"],noun: "планшет",           nounPlural: "планшеты",          accusative: "планшет",           categorySlug: "phones",    intents: ["kupit", "bu"] },
  { keys: ["televizor","televizory"],noun: "телевизор",      nounPlural: "телевизоры",        accusative: "телевизор",         categorySlug: "electronics",intents: ["kupit", "bu", "nedorogo"] },
  { keys: ["igrovaya-pristavka"],noun: "игровая приставка",  nounPlural: "игровые приставки", accusative: "игровую приставку", categorySlug: "electronics",intents: ["kupit", "bu"] },
  // Home
  { keys: ["holodilnik","holodilniki"],noun: "холодильник",  nounPlural: "холодильники",      accusative: "холодильник",       categorySlug: "home",      intents: ["kupit", "bu"], fixedParams: { subcategory: "appliances" } },
  { keys: ["stiralnaya-mashina"],noun: "стиральная машина",  nounPlural: "стиральные машины", accusative: "стиральную машину", categorySlug: "home",      intents: ["kupit", "bu"], fixedParams: { subcategory: "appliances" } },
  { keys: ["mebel"],             noun: "мебель",             nounPlural: "мебель",            accusative: "мебель",            categorySlug: "home",      intents: ["kupit", "bu", "nedorogo"], fixedParams: { subcategory: "furniture" }, priority: 0.75 },
  { keys: ["divan","divany"],    noun: "диван",              nounPlural: "диваны",            accusative: "диван",             categorySlug: "home",      intents: ["kupit", "bu"], fixedParams: { subcategory: "furniture" } },
  { keys: ["krovat","krovati"],  noun: "кровать",            nounPlural: "кровати",           accusative: "кровать",           categorySlug: "home",      intents: ["kupit", "bu"], fixedParams: { subcategory: "furniture" } },
  // Cars & Transport
  { keys: ["avtomobil","avto","mashina"],noun: "автомобиль", nounPlural: "автомобили",        accusative: "автомобиль",        categorySlug: "cars",      intents: ["kupit", "prodat", "bu", "nedorogo"], priority: 0.9 },
  { keys: ["mototsikl","mototsikhly"],noun: "мотоцикл",     nounPlural: "мотоциклы",         accusative: "мотоцикл",          categorySlug: "motorcycles",intents: ["kupit", "bu"] },
  { keys: ["velosiped","velosipedy"],noun: "велосипед",      nounPlural: "велосипеды",        accusative: "велосипед",         categorySlug: "sport",     intents: ["kupit", "bu", "nedorogo"], fixedParams: { subcategory: "bikes" } },
  { keys: ["zapchasti"],         noun: "запчасти",           nounPlural: "запчасти",          accusative: "запчасти",          categorySlug: "parts",     intents: ["kupit", "nedorogo"], priority: 0.8 },
  // Real estate
  { keys: ["kvartira","kvartiru","kvartiry"],noun: "квартира",nounPlural: "квартиры",         accusative: "квартиру",          categorySlug: "real-estate",intents: ["kupit", "snyat", "arenda", "sdat"], priority: 0.9 },
  { keys: ["komnata","komnatu","komnaty"],noun: "комната",   nounPlural: "комнаты",           accusative: "комнату",           categorySlug: "real-estate",intents: ["snyat", "arenda"] },
  { keys: ["dom","doma"],        noun: "дом",                nounPlural: "дома",              accusative: "дом",               categorySlug: "real-estate",intents: ["kupit", "snyat", "arenda"] },
  { keys: ["dacha","dachi"],     noun: "дача",               nounPlural: "дачи",              accusative: "дачу",              categorySlug: "real-estate",intents: ["kupit", "snyat", "arenda"] },
  { keys: ["garazh","garazhi"],  noun: "гараж",              nounPlural: "гаражи",            accusative: "гараж",             categorySlug: "real-estate",intents: ["kupit", "arenda"] },
  // Clothing & Kids
  { keys: ["odezhda"],           noun: "одежда",             nounPlural: "одежда",            accusative: "одежду",            categorySlug: "clothing",  intents: ["kupit", "bu", "nedorogo"], priority: 0.7 },
  { keys: ["detskie-tovary","detskie-veshchi"],noun: "детские товары",nounPlural: "детские товары",accusative: "детские товары",categorySlug: "kids",    intents: ["kupit", "bu", "nedorogo"] },
  { keys: ["detskaya-kolyaska","detskie-kolyaski"],noun: "детская коляска",nounPlural: "детские коляски",accusative: "детскую коляску",categorySlug: "kids",intents: ["kupit", "bu"], fixedParams: { subcategory: "strollers" } },
  // Sport
  { keys: ["trenazher","trenazhery"],noun: "тренажёр",       nounPlural: "тренажёры",         accusative: "тренажёр",          categorySlug: "sport",     intents: ["kupit", "bu", "nedorogo"], fixedParams: { subcategory: "fitness" } },
  // Animals
  { keys: ["sobaka","sobaki"],   noun: "собака",             nounPlural: "собаки",            accusative: "собаку",            categorySlug: "animals",   intents: ["kupit", "nedorogo"], fixedParams: { animalType: "dogs" } },
  { keys: ["koshka","koshki"],   noun: "кошка",              nounPlural: "кошки",             accusative: "кошку",             categorySlug: "animals",   intents: ["kupit", "nedorogo"], fixedParams: { animalType: "cats" } },
  { keys: ["kotenok","kotята"],  noun: "котёнок",            nounPlural: "котята",            accusative: "котёнка",           categorySlug: "animals",   intents: ["kupit", "nedorogo"], fixedParams: { animalType: "cats" } },
  // Services (intent will be "service")
  { keys: ["remont-kvartir"],    noun: "ремонт квартир",     nounPlural: "ремонт квартир",    accusative: "ремонт квартир",    categorySlug: "services",  intents: ["service"], fixedParams: { subcategory: "repair_apartment" }, priority: 0.8 },
  { keys: ["remont-holodilnikov"],noun: "ремонт холодильников",nounPlural:"ремонт холодильников",accusative: "ремонт холодильников",categorySlug: "services",intents: ["service"], fixedParams: { subcategory: "repair_home" }, priority: 0.75 },
  { keys: ["remont-stiralnyh-mashin"],noun: "ремонт стиральных машин",nounPlural: "ремонт стиральных машин",accusative: "ремонт стиральных машин",categorySlug: "services",intents: ["service"], fixedParams: { subcategory: "repair_home" } },
  { keys: ["gruzchiki"],         noun: "грузчики",           nounPlural: "грузчики",          accusative: "грузчиков",         categorySlug: "services",  intents: ["service"], fixedParams: { subcategory: "moving" }, priority: 0.8 },
  { keys: ["repetitor"],         noun: "репетитор",          nounPlural: "репетиторы",        accusative: "репетитора",        categorySlug: "services",  intents: ["service"], fixedParams: { subcategory: "education" } },
  { keys: ["uborka","uborka-kvartir"],noun: "уборка квартир", nounPlural: "уборка квартир",   accusative: "уборку квартир",    categorySlug: "services",  intents: ["service"], fixedParams: { subcategory: "cleaning" } },
  { keys: ["santehnik"],         noun: "сантехник",          nounPlural: "сантехники",        accusative: "сантехника",        categorySlug: "services",  intents: ["service"], fixedParams: { subcategory: "plumbing" } },
  { keys: ["elektrik"],          noun: "электрик",           nounPlural: "электрики",         accusative: "электрика",         categorySlug: "services",  intents: ["service"], fixedParams: { subcategory: "electrical" } },
  // Jobs (intent = "job")
  { keys: ["rabota-voditel"],    noun: "водитель",           nounPlural: "водители",          accusative: "работу водителем",  categorySlug: "jobs",      intents: ["job"], fixedParams: { jobCategory: "driver" }, priority: 0.75 },
  { keys: ["rabota-kurier"],     noun: "курьер",             nounPlural: "курьеры",           accusative: "работу курьером",   categorySlug: "jobs",      intents: ["job"], fixedParams: { jobCategory: "delivery" } },
  { keys: ["rabota-prodavets"],  noun: "продавец",           nounPlural: "продавцы",          accusative: "работу продавцом",  categorySlug: "jobs",      intents: ["job"], fixedParams: { jobCategory: "sales" } },
  { keys: ["rabota-stroitel"],   noun: "строитель",          nounPlural: "строители",         accusative: "работу строителем", categorySlug: "jobs",      intents: ["job"], fixedParams: { jobCategory: "construction" } },
]

// Build lookup: key → item (flattened)
const ITEM_BY_KEY = new Map<string, SeoItem>()
for (const item of SEO_ITEMS) {
  for (const key of item.keys) {
    ITEM_BY_KEY.set(key, item)
  }
}

// ─── Intent prefixes ─────────────────────────────────────────────────────────

type IntentConfig = {
  id: SeoIntent
  prefixes: string[]      // slug prefixes that trigger this intent
  titleVerb: string       // "Купить"
  h1Template: (accusative: string, inCity: string) => string
  titleTemplate: (accusative: string, inCity: string) => string
  descTemplate: (nounPlural: string, inCity: string) => string
  seoTextTemplate: (noun: string, nounPlural: string, inCity: string) => string
}

const INTENT_CONFIGS: IntentConfig[] = [
  {
    id: "kupit",
    prefixes: ["kupit"],
    titleVerb: "Купить",
    h1Template: (acc, city) => `Купить ${acc} в ${city}`,
    titleTemplate: (acc, city) => `Купить ${acc} в ${city} — объявления | Нашло`,
    descTemplate: (pl, city) => `Продажа: ${pl} в ${city} от частных лиц и компаний. Актуальные цены, фото, контакты на Нашло.`,
    seoTextTemplate: (noun, pl, city) => `На Нашло собраны свежие объявления о продаже: ${pl} в ${city}. Сравнивайте цены и состояние, смотрите фото, связывайтесь с продавцом напрямую. Размещение бесплатное.`,
  },
  {
    id: "prodat",
    prefixes: ["prodat"],
    titleVerb: "Продать",
    h1Template: (acc, city) => `Продать ${acc} в ${city}`,
    titleTemplate: (acc, city) => `Продать ${acc} в ${city} — разместить объявление | Нашло`,
    descTemplate: (pl, city) => `Подайте объявление о продаже: ${pl} в ${city} на Нашло. Бесплатно, быстро, без посредников.`,
    seoTextTemplate: (noun, pl, city) => `Продайте ${noun} в ${city} быстро. Разместите объявление на Нашло бесплатно — тысячи покупателей уже ищут ${pl} в ${city}.`,
  },
  {
    id: "snyat",
    prefixes: ["snyat"],
    titleVerb: "Снять",
    h1Template: (acc, city) => `Снять ${acc} в ${city}`,
    titleTemplate: (acc, city) => `Снять ${acc} в ${city} — аренда без посредников | Нашло`,
    descTemplate: (pl, city) => `Аренда: ${pl} в ${city} от собственников. Без посредников, с фото и ценами на Нашло.`,
    seoTextTemplate: (noun, pl, city) => `Ищете ${pl} в аренду в ${city}? На Нашло — объявления от собственников. Фильтруйте по цене, количеству комнат и районам.`,
  },
  {
    id: "arenda",
    prefixes: ["arenda"],
    titleVerb: "Аренда",
    h1Template: (acc, city) => `Аренда ${acc} в ${city}`,
    titleTemplate: (acc, city) => `Аренда ${acc} в ${city} | Нашло`,
    descTemplate: (pl, city) => `Аренда: ${pl} в ${city}. Объявления от собственников с фото и ценами.`,
    seoTextTemplate: (noun, pl, city) => `Объявления аренды ${pl} в ${city} на Нашло. Долгосрочная и посуточная аренда от частных лиц.`,
  },
  {
    id: "sdat",
    prefixes: ["sdat"],
    titleVerb: "Сдать",
    h1Template: (acc, city) => `Сдать ${acc} в ${city}`,
    titleTemplate: (acc, city) => `Сдать ${acc} в ${city} — разместить объявление | Нашло`,
    descTemplate: (pl, city) => `Сдайте ${pl} в ${city} быстро. Разместите объявление об аренде на Нашло бесплатно.`,
    seoTextTemplate: (noun, pl, city) => `Разместите объявление о сдаче ${noun} в ${city} на Нашло. Тысячи арендаторов ищут жильё прямо сейчас.`,
  },
  {
    id: "service",
    prefixes: [],          // services matched by item key directly
    titleVerb: "Услуга",
    h1Template: (acc, city) => `${acc.charAt(0).toUpperCase() + acc.slice(1)} в ${city}`,
    titleTemplate: (acc, city) => `${acc.charAt(0).toUpperCase() + acc.slice(1)} в ${city} — мастера | Нашло`,
    descTemplate: (pl, city) => `Найдите специалиста: ${pl} в ${city}. Объявления мастеров с ценами и отзывами на Нашло.`,
    seoTextTemplate: (noun, pl, city) => `На Нашло — проверенные мастера по ${noun} в ${city}. Сравнивайте цены, читайте отзывы, связывайтесь напрямую.`,
  },
  {
    id: "job",
    prefixes: [],          // jobs matched by item key directly
    titleVerb: "Работа",
    h1Template: (acc, city) => `Работа ${acc} в ${city}`,
    titleTemplate: (acc, city) => `Работа ${acc} в ${city} — вакансии | Нашло`,
    descTemplate: (pl, city) => `Вакансии ${pl} в ${city}. Свежие объявления от работодателей с зарплатой и условиями.`,
    seoTextTemplate: (noun, pl, city) => `Ищете работу ${noun} в ${city}? На Нашло — актуальные вакансии от работодателей. Полная и частичная занятость, подработка.`,
  },
  {
    id: "bu",
    prefixes: ["bu"],
    titleVerb: "Б/у",
    h1Template: (acc, city) => `${acc.charAt(0).toUpperCase() + acc.slice(1)} б/у в ${city}`,
    titleTemplate: (acc, city) => `${acc.charAt(0).toUpperCase() + acc.slice(1)} б/у в ${city} | Нашло`,
    descTemplate: (pl, city) => `Б/у ${pl} в ${city} от частных лиц. Проверенные объявления с фото.`,
    seoTextTemplate: (noun, pl, city) => `Объявления о продаже ${pl} б/у в ${city}. Выгодные цены на проверенные товары от частных продавцов.`,
  },
  {
    id: "nedorogo",
    prefixes: ["nedorogo"],
    titleVerb: "Недорого",
    h1Template: (acc, city) => `${acc.charAt(0).toUpperCase() + acc.slice(1)} недорого в ${city}`,
    titleTemplate: (acc, city) => `${acc.charAt(0).toUpperCase() + acc.slice(1)} недорого в ${city} | Нашло`,
    descTemplate: (pl, city) => `Дешёвые ${pl} в ${city}. Выгодные объявления с фото и ценами на Нашло.`,
    seoTextTemplate: (noun, pl, city) => `Найдите ${pl} по низкой цене в ${city} на Нашло. Сравнивайте предложения и экономьте.`,
  },
]

const INTENT_BY_PREFIX = new Map<string, IntentConfig>()
for (const cfg of INTENT_CONFIGS) {
  for (const prefix of cfg.prefixes) {
    INTENT_BY_PREFIX.set(prefix, cfg)
  }
}

// ─── Parser ───────────────────────────────────────────────────────────────────

type ParsedSlug = {
  city: SeoCity
  item: SeoItem
  intent: IntentConfig
}

function tryParseSlug(slug: string): ParsedSlug | null {
  // 1. Try to find a city suffix (ordered by length DESC to avoid greedy mismatch)
  let city: SeoCity | null = null
  let rest = ""
  for (const candidate of SEO_CITIES_BY_SLUG_DESC) {
    const suffix = "-" + candidate.slug
    if (slug.endsWith(suffix)) {
      city = candidate
      rest = slug.slice(0, slug.length - suffix.length)
      break
    }
  }
  if (!city || !rest) return null

  // 2. Try to detect intent prefix
  let intentCfg: IntentConfig | null = null
  let itemKey = rest
  for (const [prefix, cfg] of Array.from(INTENT_BY_PREFIX)) {
    if (rest === prefix || rest.startsWith(prefix + "-")) {
      intentCfg = cfg
      itemKey = rest.startsWith(prefix + "-") ? rest.slice(prefix.length + 1) : ""
      break
    }
  }

  // 3. Look up item
  const item = ITEM_BY_KEY.get(itemKey) ?? null

  if (!item) {
    // No intent prefix — maybe the whole rest is a service/job key
    const directItem = ITEM_BY_KEY.get(rest) ?? null
    if (!directItem) return null
    // Infer intent from item
    const defaultIntent = directItem.intents[0]
    const cfg = INTENT_CONFIGS.find((c) => c.id === defaultIntent) ?? null
    if (!cfg) return null
    return { city, item: directItem, intent: cfg }
  }

  // Validate intent makes sense for item
  if (intentCfg && !item.intents.includes(intentCfg.id)) {
    // Fallback to first valid intent
    const fallback = INTENT_CONFIGS.find((c) => item.intents.includes(c.id))
    if (!fallback) return null
    intentCfg = fallback
  }
  if (!intentCfg) {
    const fallback = INTENT_CONFIGS.find((c) => item.intents.includes(c.id))
    if (!fallback) return null
    intentCfg = fallback
  }

  return { city, item, intent: intentCfg }
}

// ─── Config builder ───────────────────────────────────────────────────────────

export function getProgrammaticLanding(slug: string): SeoLandingConfig | null {
  const parsed = tryParseSlug(slug)
  if (!parsed) return null

  const { city, item, intent } = parsed
  const acc = item.accusative
  const noun = item.noun
  const plural = item.nounPlural
  const inCity = city.inCity

  return {
    slug,
    title: intent.h1Template(acc, city.name),
    seoTitle: intent.titleTemplate(acc, inCity),
    seoDescription: intent.descTemplate(plural, inCity),
    h1: intent.h1Template(acc, inCity),
    seoText: intent.seoTextTemplate(noun, plural, inCity),
    categorySlug: item.categorySlug,
    internalCategorySlug: item.categorySlug,
    city: city.name,
    fixedParams: item.fixedParams,
    indexable: true,
    priority: item.priority ?? 0.7,
    changefreq: "weekly",
  }
}

// ─── Slug generator for sitemap ───────────────────────────────────────────────

/**
 * Generates all valid programmatic slugs.
 * Used by the sitemap route to enumerate pages.
 *
 * Limits to high-value combinations to keep the sitemap manageable.
 */
export function getAllProgrammaticSlugs(): string[] {
  const slugs: string[] = []

  for (const item of SEO_ITEMS) {
    // Skip job items — they already include "rabota-" in the key
    const isJob = item.intents[0] === "job"
    const isService = item.intents[0] === "service"

    for (const city of SEO_CITIES_BY_SLUG_DESC) {
      const baseKey = item.keys[0]  // canonical key

      for (const intentId of item.intents) {
        // Jobs and services skip prefix (key already encodes intent)
        if (isJob || isService) {
          if (intentId !== item.intents[0]) continue
          slugs.push(`${baseKey}-${city.slug}`)
        } else {
          const intentCfg = INTENT_CONFIGS.find((c) => c.id === intentId)
          if (!intentCfg) continue
          if (intentCfg.prefixes.length === 0) continue
          const prefix = intentCfg.prefixes[0]
          slugs.push(`${prefix}-${baseKey}-${city.slug}`)
        }
      }
    }
  }

  return slugs
}

export type { SeoItem, SeoIntent, IntentConfig, ParsedSlug }
