import type { Metadata } from "next"
import { WANT_TO_BUY_SECTION_LABEL } from "@/config/want-to-buy-brand"
import { buildPageMetadata, SITE_NAME, type BuildPageMetadataInput } from "@/lib/seo/site"
import {
  getWantToBuyCategoriesPath,
  getWantToBuyHubPath,
  getWantToBuySearchPath,
} from "@/lib/want-to-buy/routes"

const BRAND = SITE_NAME

/** Базовые ключевые фразы раздела «Куплю». */
export const WANT_TO_BUY_SEO_KEYWORDS = [
  "куплю",
  "заявка покупателя",
  "заявки покупателей",
  "ищу товар",
  "кто купит",
  "найти покупателя",
  "отклик на заявку",
  "разместить заявку куплю",
  "куплю б у",
  "доска заявок куплю",
  WANT_TO_BUY_SECTION_LABEL.toLowerCase(),
  "nashlo куплю",
  "kyplu",
  "nashlo kyplu",
] as const

export const WANT_TO_BUY_HUB_SEO = {
  title: `Покупки наоборот — заявки «Куплю» на ${BRAND}`,
  description:
    "Оставьте заявку «Куплю» с бюджетом и городом — продавцы сами предложат варианты. Смотрите запросы покупателей по авто, недвижимости, технике, одежде и услугам.",
  jsonLdTitle: "Куплю — заявки покупателей",
  jsonLdDescription:
    "Заявки покупателей на Нашло: разместите запрос «Куплю» или предложите товар по заявке других пользователей.",
} as const

function titleWithBrand(main: string): string {
  return `${main} | ${BRAND}`
}

function extraKeywords(...parts: string[]): string[] {
  const base = [...WANT_TO_BUY_SEO_KEYWORDS]
  for (const part of parts) {
    const normalized = part.trim().toLowerCase()
    if (!normalized) continue
    base.push(`куплю ${normalized}`, `заявка куплю ${normalized}`, `ищу ${normalized}`)
  }
  return [...new Set(base)]
}

export function buildWantToBuyPageMetadata(
  input: BuildPageMetadataInput & { keywordHints?: string[] },
): Metadata {
  const { keywordHints, keywords, ...rest } = input
  return buildPageMetadata({
    ...rest,
    keywords: keywords ?? extraKeywords(...(keywordHints ?? [])),
  })
}

export function buildWantToBuyHubMetadata(): Metadata {
  const path = getWantToBuyHubPath()
  return buildWantToBuyPageMetadata({
    title: WANT_TO_BUY_HUB_SEO.title,
    description: WANT_TO_BUY_HUB_SEO.description,
    path,
    canonicalPath: path,
  })
}

export function buildWantToBuySearchMetadata(): Metadata {
  const path = getWantToBuySearchPath()
  return buildWantToBuyPageMetadata({
    title: titleWithBrand("Поиск заявок Куплю — фильтр по категории и городу"),
    description:
      "Поиск заявок покупателей на Нашло: категория, город, бюджет, сортировка по откликам и дате. Найдите запрос «Куплю» и предложите свой товар первым.",
    path,
    canonicalPath: path,
    keywordHints: ["поиск", "фильтр"],
  })
}

export function buildWantToBuyCategoriesMetadata(): Metadata {
  const path = getWantToBuyCategoriesPath()
  return buildWantToBuyPageMetadata({
    title: titleWithBrand("Категории Куплю — все заявки покупателей"),
    description:
      "Все категории раздела «Куплю»: авто, недвижимость, электроника, одежда, услуги и другие. Выберите раздел и откликнитесь на заявку покупателя.",
    path,
    canonicalPath: path,
    keywordHints: ["категории"],
  })
}

export function buildWantToBuyCategoryMetadata(categoryTitle: string, path: string): Metadata {
  const lower = categoryTitle.toLowerCase()
  return buildWantToBuyPageMetadata({
    title: titleWithBrand(`Куплю ${lower} — заявки покупателей`),
    description: `Заявки «Куплю» в категории «${categoryTitle}»: покупатели ищут товар, продавцы откликаются предложением. Смотрите актуальные запросы и находите покупателя на ${BRAND}.`,
    path,
    canonicalPath: path,
    keywordHints: [lower, categoryTitle],
  })
}

export const WANT_TO_BUY_CATEGORIES_SEO = {
  jsonLdTitle: "Категории заявок Куплю",
  jsonLdDescription:
    "Все категории раздела «Куплю» на Нашло: выберите раздел и откликнитесь на заявку покупателя.",
} as const

export const WANT_TO_BUY_SEARCH_SEO = {
  jsonLdTitle: "Поиск заявок Куплю",
  jsonLdDescription:
    "Поиск заявок покупателей на Нашло по категории, городу и бюджету.",
} as const

export function buildWantToBuyCategoryJsonLdDescription(categoryTitle: string): string {
  return `Заявки «Куплю» в категории «${categoryTitle}» на ${BRAND}: покупатели ищут товар, продавцы откликаются предложением.`
}

export function buildWantToBuyDetailPageTitle(requestTitle: string): string {
  const trimmed = requestTitle.trim().slice(0, 48)
  return titleWithBrand(`${trimmed} — куплю, заявка покупателя`)
}

export function buildWantToBuyDetailDescription(
  title: string,
  description: string,
  categoryName?: string | null,
): string {
  const body = description.replace(/\s+/g, " ").trim()
  const snippet = body ? body.slice(0, 130) : title
  const category = categoryName ? ` Категория: ${categoryName}.` : ""
  return `Покупатель ищет: ${snippet}.${category} Откликнитесь с предложением на ${BRAND}.`
}
