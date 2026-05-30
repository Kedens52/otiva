import { NASHLO_CITIES_FOR_LISTING } from "@/lib/city-selection"

const HTML_TAG = /<[^>]*>/g
const NAME_RE = /^[\p{L}\s'-]+$/u
const CITY_RE = /^[\p{L}\s'.-]+$/u
const JUNK_CITY = new Set([
  "test",
  "тест",
  "asd",
  "qwerty",
  "нкнкн",
  "ааа",
  "xxx",
  "123",
  "abc",
])
const KNOWN_CITIES = new Set(NASHLO_CITIES_FOR_LISTING.map((c) => c.toLowerCase()))

export function stripHtml(value: string) {
  return value.replace(HTML_TAG, "").trim()
}

function hasRepeatedChars(value: string, min = 4) {
  return new RegExp(`(.)\\1{${min - 1},}`).test(value)
}

function looksLikeGarbageCity(value: string) {
  const normalized = value.trim().toLowerCase()
  if (normalized.length < 2) return true
  if (JUNK_CITY.has(normalized)) return true
  if (/\d/.test(normalized)) return true
  if (hasRepeatedChars(normalized)) return true
  if (normalized.length <= 5 && !KNOWN_CITIES.has(normalized)) {
    const vowels = (normalized.match(/[аеёиоуыэюя]/g) ?? []).length
    if (vowels === 0) return true
  }
  return false
}

export function validateDisplayName(value: string): string | null {
  const v = stripHtml(value)
  if (v.length < 2) return "Минимум 2 символа"
  if (v.length > 80) return "Максимум 80 символов"
  if (!/\S/.test(v)) return "Укажите имя для отображения"
  return null
}

export function validatePersonName(value: string, label: string): string | null {
  const v = stripHtml(value)
  if (!v) return null
  if (v.length < 2) return `${label}: минимум 2 символа`
  if (v.length > 50) return `${label}: максимум 50 символов`
  if (!NAME_RE.test(v)) return `${label}: только буквы, пробел и дефис`
  if (/\d/.test(v)) return `${label}: без цифр`
  return null
}

export function validateCity(value: string): string | null {
  const v = stripHtml(value)
  if (!v) return null
  if (v.length < 2) return "Минимум 2 символа"
  if (v.length > 80) return "Максимум 80 символов"
  if (!CITY_RE.test(v)) return "Только буквы, пробелы и дефисы"
  if (looksLikeGarbageCity(v)) return "Укажите реальный город из списка или корректное название"
  return null
}

export function validateOptionalLocationField(
  value: string,
  label: string,
  max = 80,
): string | null {
  const v = stripHtml(value)
  if (!v) return null
  if (v.length < 2) return `${label}: минимум 2 символа`
  if (v.length > max) return `${label}: максимум ${max} символов`
  if (!CITY_RE.test(v)) return `${label}: некорректные символы`
  return null
}

export function validateBio(value: string): string | null {
  const v = stripHtml(value)
  if (!v) return null
  if (v.length > 500) return "Максимум 500 символов"
  return null
}

export function validateHeadline(value: string): string | null {
  const v = stripHtml(value)
  if (!v) return null
  if (v.length > 80) return "Максимум 80 символов"
  return null
}

export function validateGuarantee(value: string): string | null {
  const v = stripHtml(value)
  if (!v) return null
  if (v.length > 300) return "Максимум 300 символов"
  return null
}

export function validateCompanyName(value: string, required = false): string | null {
  const v = stripHtml(value)
  if (!v) return required ? "Укажите название компании" : null
  if (v.length < 2) return "Минимум 2 символа"
  if (v.length > 120) return "Максимум 120 символов"
  return null
}

export function validateInn(value: string): string | null {
  const v = value.replace(/\D/g, "")
  if (!v) return null
  if (!/^\d{10}$|^\d{12}$/.test(v)) return "ИНН — 10 или 12 цифр"
  return null
}

const BLOCKED_URL_PROTOCOLS = /^(javascript:|data:|vbscript:)/i

export function validateHttpUrl(value: string, label = "Ссылка"): string | null {
  const v = value.trim()
  if (!v) return null
  if (BLOCKED_URL_PROTOCOLS.test(v)) return `${label}: недопустимый адрес`
  try {
    const url = new URL(v.includes("://") ? v : `https://${v}`)
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return `${label}: только http или https`
    }
    return null
  } catch {
    return `${label}: некорректный URL`
  }
}

export function normalizeHttpUrl(value: string): string {
  const v = value.trim()
  if (!v) return ""
  if (BLOCKED_URL_PROTOCOLS.test(v)) return ""
  try {
    const url = new URL(v.includes("://") ? v : `https://${v}`)
    if (url.protocol !== "http:" && url.protocol !== "https:") return ""
    return url.toString()
  } catch {
    return ""
  }
}

export type ProfileFormInput = {
  name?: string
  firstName?: string
  lastName?: string
  profileHeadline?: string
  description?: string
  region?: string
  city?: string
  district?: string
  metro?: string
  addressNote?: string
  profileType?: "PERSON" | "COMPANY"
  sellerRole?: string
  companyName?: string
  businessCategory?: string
  companyInn?: string
  companyWebsite?: string
  companyRole?: string
  experience?: string
  serviceArea?: string
  guaranteeText?: string
  vkUrl?: string
  maxUrl?: string
  websiteUrl?: string
}

export function validateProfileForm(input: ProfileFormInput): Record<string, string> {
  const errors: Record<string, string> = {}

  const checks: Array<[string, string | null]> = [
    ["name", validateDisplayName(input.name ?? "")],
    ["firstName", validatePersonName(input.firstName ?? "", "Имя")],
    ["lastName", validatePersonName(input.lastName ?? "", "Фамилия")],
    ["profileHeadline", validateHeadline(input.profileHeadline ?? "")],
    ["description", validateBio(input.description ?? "")],
    ["region", validateOptionalLocationField(input.region ?? "", "Регион")],
    ["city", validateCity(input.city ?? "")],
    ["district", validateOptionalLocationField(input.district ?? "", "Район / метро")],
    ["metro", validateOptionalLocationField(input.metro ?? "", "Метро", 60)],
    ["addressNote", validateOptionalLocationField(input.addressNote ?? "", "Ориентир", 120)],
    ["companyName", validateCompanyName(input.companyName ?? "", input.profileType === "COMPANY")],
    ["companyInn", validateInn(input.companyInn ?? "")],
    ["guaranteeText", validateGuarantee(input.guaranteeText ?? "")],
    ["companyWebsite", validateHttpUrl(input.companyWebsite ?? "", "Сайт компании")],
    ["websiteUrl", validateHttpUrl(input.websiteUrl ?? "", "Сайт")],
    ["vkUrl", validateHttpUrl(input.vkUrl ?? "", "VK")],
    ["maxUrl", validateHttpUrl(input.maxUrl ?? "", "MAX")],
  ]

  for (const [key, message] of checks) {
    if (message) errors[key] = message
  }

  return errors
}
