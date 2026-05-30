const EMPTY_VALUES = new Set([
  "",
  "unknown",
  "UNKNOWN",
  "null",
  "undefined",
  "none",
  "not_specified",
])

const LABELS: Record<string, string> = {
  make: "Марка",
  brand: "Марка",
  model: "Модель",
  year: "Год выпуска",
  year_from: "Год от",
  year_to: "Год до",
  yearFrom: "Год от",
  yearTo: "Год до",
  mileage: "Пробег",
  fuel: "Тип топлива",
  fuelType: "Тип топлива",
  engineType: "Тип двигателя",
  transmission: "Коробка передач",
  body_type: "Кузов",
  bodyType: "Кузов",
  vehicle_type: "Тип ТС",
  color: "Цвет",
  condition: "Состояние",
  pts: "ПТС",
  vin: "VIN",
  drive: "Привод",
  driveType: "Привод",
  customs: "Растаможен",
  customsCleared: "Растаможен",
  engine_volume: "Объём двигателя",
  engineVolume: "Объём двигателя",
  engine_power: "Мощность",
  power: "Мощность",
  owners_count: "Владельцев по ПТС",
  ownersCount: "Владельцев по ПТС",
  steering: "Руль",
  steering_wheel: "Руль",
  steeringWheel: "Руль",
  generation: "Поколение",
  accident_free: "Без ДТП",
  accidentFree: "Без ДТП",
  exchange_possible: "Возможен обмен",
  exchangePossible: "Возможен обмен",
  property_type: "Тип жилья",
  rooms: "Комнат",
  area: "Площадь, м²",
  floor: "Этаж",
  floors_total: "Этажей в доме",
  deal_type: "Тип сделки",
  storage: "Память",
  ram: "ОЗУ",
  size: "Размер",
  gender: "Пол",
  material: "Материал",
  subcategory: "Подкатегория",
  employment_type: "Тип занятости",
  experience: "Опыт",
  salary: "Зарплата",
  schedule: "График",
  breed: "Порода",
  age: "Возраст",
  weight: "Вес",
  service_type: "Формат",
  duration: "Длительность",
  build_year: "Год постройки",
  build_year_from: "Год постройки от",
  build_year_to: "Год постройки до",
}

const BODY_TYPE_VALUES: Record<string, string> = {
  sedan: "Седан",
  hatchback: "Хэтчбек",
  suv: "Внедорожник / SUV",
  wagon: "Универсал",
  coupe: "Купе",
  minivan: "Минивэн / Микроавтобус",
  pickup: "Пикап",
  cabriolet: "Кабриолет",
  liftback: "Лифтбек",
}

const VALUES: Record<string, Record<string, string>> = {
  pts: {
    original: "Оригинал",
    duplicate: "Дубликат",
    electronic: "Электронный",
  },
  drive: {
    fwd: "Передний",
    rwd: "Задний",
    awd: "Полный",
    "4wd": "Полный",
  },
  driveType: {
    fwd: "Передний",
    rwd: "Задний",
    awd: "Полный",
    "4wd": "Полный",
  },
  fuel: {
    petrol: "Бензин",
    diesel: "Дизель",
    hybrid: "Гибрид",
    electric: "Электро",
    gas: "Газ",
    gas_petrol: "Газ + бензин",
  },
  fuelType: {
    petrol: "Бензин",
    diesel: "Дизель",
    hybrid: "Гибрид",
    electric: "Электро",
    gas: "Газ",
    gas_petrol: "Газ + бензин",
  },
  customs: {
    cleared: "Да",
    not_cleared: "Нет",
    uncleared: "Нет",
    true: "Да",
    false: "Нет",
  },
  customsCleared: {
    cleared: "Да",
    not_cleared: "Нет",
    uncleared: "Нет",
    true: "Да",
    false: "Нет",
  },
  transmission: {
    manual: "Механика",
    automatic: "Автомат",
    auto: "Автомат",
    robot: "Робот",
    cvt: "Вариатор",
    variator: "Вариатор",
  },
  condition: {
    new: "Новый",
    used: "С пробегом",
    damaged: "Повреждён",
    excellent: "Отличное",
    good: "Хорошее",
  },
  steering: { left: "Левый", right: "Правый" },
  steering_wheel: { left: "Левый", right: "Правый" },
  steeringWheel: { left: "Левый", right: "Правый" },
  deal_type: { sell: "Продажа", rent: "Аренда", rent_daily: "Посуточно" },
  employment_type: {
    full: "Полная",
    part: "Частичная",
    remote: "Удалённо",
    contract: "Договор",
  },
  gender: {
    men: "Мужское",
    women: "Женское",
    kids: "Детское",
    unisex: "Унисекс",
  },
  vehicle_type: {
    car: "Легковой",
    truck: "Грузовой",
    moto: "Мотоцикл",
    commercial: "Коммерческий",
    special: "Спецтехника",
    trailer: "Прицеп",
  },
  body_type: BODY_TYPE_VALUES,
  bodyType: BODY_TYPE_VALUES,
  owners_count: {
    "1": "1 владелец",
    "2": "2 владельца",
    "3": "3 и более",
  },
  ownersCount: {
    "1": "1 владелец",
    "2": "2 владельца",
    "3": "3 и более",
  },
  vin: {
    clean: "Нет ограничений",
    unknown: "Не проверял",
  },
  accident_free: { true: "Да", false: "Нет" },
  accidentFree: { true: "Да", false: "Нет" },
  exchange_possible: { true: "Да", false: "Нет" },
  exchangePossible: { true: "Да", false: "Нет" },
}

const CAR_ORDER = [
  "brand",
  "make",
  "model",
  "year",
  "year_from",
  "year_to",
  "yearFrom",
  "yearTo",
  "mileage",
  "fuelType",
  "fuel",
  "transmission",
  "drive",
  "driveType",
  "bodyType",
  "body_type",
  "engine_volume",
  "engine_power",
  "engineVolume",
  "power",
  "color",
  "pts",
  "vin",
  "customs",
  "customsCleared",
  "owners_count",
  "ownersCount",
  "condition",
  "vehicle_type",
  "steering",
  "steering_wheel",
  "steeringWheel",
]

export type VisibleListingAttribute = {
  key: string
  label: string
  value: string
}

function hasVisibleValue(value: unknown) {
  if (value === null || value === undefined) return false
  if (Array.isArray(value)) return value.some(hasVisibleValue)
  const text = String(value).trim()
  return !EMPTY_VALUES.has(text) && !EMPTY_VALUES.has(text.toLowerCase())
}

function lookupValueMap(key: string) {
  return VALUES[key] ?? VALUES[key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())]
}

export function formatAttributeLabel(key: string) {
  if (LABELS[key]) return LABELS[key]

  const rangeMatch = key.match(/^(.+)_(from|to)$/)
  if (rangeMatch) {
    const baseKey = rangeMatch[1]!
    const baseLabel = LABELS[baseKey]
    if (baseLabel) {
      return `${baseLabel} ${rangeMatch[2] === "from" ? "от" : "до"}`
    }
  }

  // Неизвестные технические ключи не показываем с английским текстом
  if (/^[a-z][a-z0-9_]*$/i.test(key)) return ""
  return key
}

export function formatAttributeValue(key: string, value: unknown) {
  if (typeof value === "boolean") return value ? "Да" : "Нет"
  if (Array.isArray(value)) {
    return value
      .filter(hasVisibleValue)
      .map((item) => formatAttributeValue(key, item))
      .join(", ")
  }

  const raw = String(value).trim()
  const valueMap = lookupValueMap(key)
  const mapped = valueMap?.[raw] ?? valueMap?.[raw.toLowerCase()]
  if (mapped) return mapped

  if (key === "mileage") {
    const number = Number(raw)
    return Number.isFinite(number) ? `${number.toLocaleString("ru-RU")} км` : raw
  }
  if (key === "engine_volume" || key === "engineVolume") {
    const number = Number(raw.replace(",", "."))
    return Number.isFinite(number) ? `${number.toLocaleString("ru-RU")} л` : `${raw.replace(",", ".")} л`
  }
  if (key === "engine_power" || key === "power") {
    const number = Number(raw)
    return Number.isFinite(number) ? `${number.toLocaleString("ru-RU")} л.с.` : `${raw} л.с.`
  }
  if (
    key === "year" ||
    key === "year_to" ||
    key === "year_from" ||
    key === "yearTo" ||
    key === "yearFrom" ||
    key === "build_year" ||
    key === "build_year_from" ||
    key === "build_year_to"
  ) {
    return raw
  }
  if (key === "owners_count" || key === "ownersCount") {
    const count = Number(raw)
    if (count === 1) return "1 владелец"
    if (count === 2) return "2 владельца"
    if (count >= 3) return "3 и более"
  }

  return raw
}

function mergeYearRangeAttributes(entries: VisibleListingAttribute[]): VisibleListingAttribute[] {
  const from = entries.find((item) => item.key === "year_from" || item.key === "yearFrom")
  const to = entries.find((item) => item.key === "year_to" || item.key === "yearTo")
  if (!from && !to) return entries

  const rest = entries.filter(
    (item) => !["year_from", "year_to", "yearFrom", "yearTo"].includes(item.key),
  )
  const fromVal = from?.value ?? ""
  const toVal = to?.value ?? ""

  let value = ""
  if (fromVal && toVal) {
    value = fromVal === toVal ? fromVal : `${fromVal}–${toVal}`
  } else if (fromVal) {
    value = `с ${fromVal}`
  } else if (toVal) {
    value = `до ${toVal}`
  }

  if (value) {
    rest.push({ key: "year", label: "Год выпуска", value })
  }

  return rest
}

export function getVisibleListingAttributes(
  attributes: Record<string, unknown> | null | undefined,
  category?: string | null,
) {
  if (!attributes) return []

  let entries = Object.entries(attributes)
    .filter(([, value]) => hasVisibleValue(value))
    .map(([key, value]) => ({
      key,
      label: formatAttributeLabel(key),
      value: formatAttributeValue(key, value),
    }))
    .filter((item) => hasVisibleValue(item.label) && hasVisibleValue(item.value))

  if (category === "cars") {
    entries = mergeYearRangeAttributes(entries)

    const order = new Map(CAR_ORDER.map((key, index) => [key, index]))
    entries.sort((a, b) => (order.get(a.key) ?? 999) - (order.get(b.key) ?? 999))
  }

  return entries
}
