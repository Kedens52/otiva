import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format } from 'date-fns'
import { ru } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number, currency = 'RUB'): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'd MMMM yyyy', { locale: ru })
}

export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: ru })
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) {
    return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9)}`
  }
  return phone
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '...'
}

export function buildSearchParams(params: Record<string, string | number | boolean | undefined | null>): string {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value))
    }
  })
  return searchParams.toString()
}

export function parseSearchParams(searchParams: URLSearchParams): Record<string, string> {
  const result: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    result[key] = value
  })
  return result
}

export const CITIES = [
  'Москва',
  'Санкт-Петербург',
  'Новосибирск',
  'Екатеринбург',
  'Казань',
  'Нижний Новгород',
  'Челябинск',
  'Самара',
  'Омск',
  'Ростов-на-Дону',
  'Уфа',
  'Красноярск',
  'Воронеж',
  'Пермь',
  'Волгоград',
]

export const CATEGORIES = [
  { slug: 'electronics', name: 'Electronics', nameRu: 'Электроника', icon: '💻' },
  { slug: 'cars', name: 'Cars', nameRu: 'Автомобили', icon: '🚗' },
  { slug: 'realestate', name: 'Real Estate', nameRu: 'Недвижимость', icon: '🏠' },
  { slug: 'clothing', name: 'Clothing', nameRu: 'Одежда', icon: '👕' },
  { slug: 'services', name: 'Services', nameRu: 'Услуги', icon: '🔧' },
  { slug: 'furniture', name: 'Furniture', nameRu: 'Мебель', icon: '🪑' },
  { slug: 'sport', name: 'Sport', nameRu: 'Спорт', icon: '⚽' },
  { slug: 'kids', name: 'Kids', nameRu: 'Детское', icon: '🧸' },
]
