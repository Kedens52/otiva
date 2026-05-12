export type ProfileTrustInput = {
  phone?: string | null
  phoneVerifiedAt?: string | Date | null
  email?: string | null
  vkId?: string | null
  yandexId?: string | null
  name?: string | null
  avatar?: string | null
  description?: string | null
  city?: string | null
  isVerified?: boolean | null
  reviewCount?: number | null
  listingCount?: number | null
  /** Среднее время ответа в чате, минут; меньше — лучше */
  avgResponseMinutes?: number | null
  profileType?: string | null
}

export type ProfileTrustCheck = {
  key: string
  label: string
  done: boolean
  weight: number
}

export type ProfileTrustSignal = {
  key: string
  label: string
}

export type ProfileTrust = {
  score: number
  level: "new" | "basic" | "trusted" | "strong"
  label: string
  checks: ProfileTrustCheck[]
  /** Короткие доверительные метки без цифр (только положительные) */
  publicSignals: ProfileTrustSignal[]
}

function filled(value?: string | null) {
  return Boolean(value?.trim())
}

export function getProfileTrust(input: ProfileTrustInput): ProfileTrust {
  const phoneConfirmed = Boolean(input.phoneVerifiedAt)
  const checks: ProfileTrustCheck[] = [
    { key: "phone", label: "Телефон подтверждён", done: phoneConfirmed, weight: 20 },
    { key: "social", label: "Подключен VK или Яндекс", done: filled(input.vkId) || filled(input.yandexId), weight: 15 },
    { key: "email", label: "Почта добавлена", done: filled(input.email), weight: 10 },
    { key: "identity", label: "Имя и город указаны", done: filled(input.name) && filled(input.city), weight: 15 },
    { key: "avatar", label: "Есть фото профиля", done: filled(input.avatar), weight: 10 },
    { key: "description", label: "Есть описание", done: filled(input.description), weight: 10 },
    { key: "listings", label: "Есть активные объявления", done: (input.listingCount ?? 0) > 0, weight: 10 },
    { key: "reviews", label: "Есть отзывы", done: (input.reviewCount ?? 0) > 0, weight: 10 },
  ]

  const score = checks.reduce((sum, check) => sum + (check.done ? check.weight : 0), 0)
  const level = score >= 80 ? "strong" : score >= 60 ? "trusted" : score >= 35 ? "basic" : "new"
  const label =
    level === "strong" ? "Заполненный профиль" :
    level === "trusted" ? "Профиль с дополнительными данными" :
    level === "basic" ? "Базовый профиль" :
    "Новый профиль"

  const publicSignals: ProfileTrustSignal[] = []

  if (phoneConfirmed) {
    publicSignals.push({ key: "phone_ok", label: "Телефон подтверждён" })
  }

  const profileFilled =
    filled(input.name) &&
    filled(input.city) &&
    filled(input.avatar) &&
    filled(input.description)
  if (profileFilled) {
    publicSignals.push({ key: "profile_ok", label: "Профиль заполнен" })
  }

  const fast =
    input.avgResponseMinutes != null &&
    input.avgResponseMinutes >= 0 &&
    input.avgResponseMinutes <= 120
  if (fast) {
    publicSignals.push({ key: "fast_reply", label: "Быстро отвечает" })
  }

  if ((input.reviewCount ?? 0) > 0) {
    const n = input.reviewCount!
    const w = n % 10 === 1 && n % 100 !== 11 ? "отзыв" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? "отзыва" : "отзывов"
    publicSignals.push({ key: "has_reviews", label: `${n} ${w}` })
  }

  if (input.profileType === "COMPANY") {
    publicSignals.push({ key: "company", label: "Компания" })
  }

  return { score, level, label, checks, publicSignals }
}
