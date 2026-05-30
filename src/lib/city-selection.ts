/** Shared city list and localStorage sync for header, search, feed, and filters. */

export const NASHLO_CITY_ANYWHERE = "Везде" as const

export const NASHLO_CITY_STORAGE_KEY = "nashlo-city"

export const NASHLO_CITY_CHANGE_EVENT = "nashlo-city-change"

export const NASHLO_DEFAULT_CITY = "Москва"

export const NASHLO_POPULAR_CITIES = [
  "Москва",
  "Санкт-Петербург",
  "Казань",
  "Екатеринбург",
  "Новосибирск",
  "Сочи",
] as const

export const NASHLO_CITIES = [
  NASHLO_CITY_ANYWHERE,
  "Москва",
  "Санкт-Петербург",
  "Новосибирск",
  "Екатеринбург",
  "Казань",
  "Нижний Новгород",
  "Челябинск",
  "Красноярск",
  "Самара",
  "Уфа",
  "Ростов-на-Дону",
  "Омск",
  "Краснодар",
  "Воронеж",
  "Пермь",
  "Волгоград",
  "Саратов",
  "Тюмень",
  "Тольятти",
  "Ижевск",
  "Барнаул",
  "Ульяновск",
  "Иркутск",
  "Хабаровск",
  "Ярославль",
  "Владивосток",
  "Махачкала",
  "Томск",
  "Оренбург",
  "Кемерово",
  "Новокузнецк",
  "Рязань",
  "Астрахань",
  "Пенза",
  "Липецк",
  "Киров",
  "Чебоксары",
  "Калининград",
  "Балашиха",
  "Тула",
  "Курск",
  "Ставрополь",
  "Сочи",
  "Улан-Удэ",
  "Тверь",
  "Магнитогорск",
  "Иваново",
  "Брянск",
  "Белгород",
  "Сургут",
  "Владимир",
  "Нижний Тагил",
  "Архангельск",
  "Чита",
  "Симферополь",
  "Калуга",
  "Смоленск",
  "Волжский",
  "Курган",
  "Орел",
  "Череповец",
  "Владикавказ",
  "Мурманск",
  "Саранск",
  "Якутск",
  "Вологда",
  "Орск",
  "Грозный",
  "Тамбов",
  "Стерлитамак",
  "Петрозаводск",
  "Кострома",
  "Новороссийск",
] as const

/** Cities for selects (without «Везде»). */
export const NASHLO_CITIES_FOR_LISTING = NASHLO_CITIES.filter(
  (c): c is Exclude<(typeof NASHLO_CITIES)[number], typeof NASHLO_CITY_ANYWHERE> =>
    c !== NASHLO_CITY_ANYWHERE,
)

export function isCityFilterActive(city: string | null | undefined): city is string {
  const v = city?.trim()
  return Boolean(v && v !== NASHLO_CITY_ANYWHERE)
}

export function getStoredCity(): string {
  if (typeof window === "undefined") return NASHLO_DEFAULT_CITY
  const stored = window.localStorage.getItem(NASHLO_CITY_STORAGE_KEY)?.trim()
  if (stored && NASHLO_CITIES.includes(stored as (typeof NASHLO_CITIES)[number])) {
    return stored
  }
  return NASHLO_DEFAULT_CITY
}

export function setStoredCity(city: string): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(NASHLO_CITY_STORAGE_KEY, city)
  window.dispatchEvent(new Event(NASHLO_CITY_CHANGE_EVENT))
}

export function filterCitiesByQuery(query: string): readonly string[] {
  const q = query.trim().toLowerCase()
  if (!q) return NASHLO_CITIES
  return NASHLO_CITIES.filter((c) => c.toLowerCase().includes(q))
}
