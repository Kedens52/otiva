import type { BadgeCode } from "@prisma/client"
import { getProfileTrust } from "@/lib/profile-trust"
import { calculateProfileCompleteness } from "@/lib/badges/profile-completeness"

const MS_DAY = 24 * 60 * 60 * 1000
const HIGHER_THAN_BEGINNER: BadgeCode[] = ["VERIFIED", "TRUSTED", "PRO", "PREMIUM"]

export type BadgeCalculationInput = {
  id: string
  createdAt: Date
  isBanned: boolean
  accountRestricted?: boolean
  phoneVerifiedAt: Date | null
  emailVerified: boolean
  phone?: string | null
  email?: string | null
  vkId?: string | null
  yandexId?: string | null
  name?: string | null
  avatar?: string | null
  description?: string | null
  city?: string | null
  profileType?: string | null
  rating: number
  reviewCount: number
  avgResponseMinutes: number | null
  lastSeenAt: Date | null
  lastLoginAt: Date | null
  premiumUntil: Date | null
  safeDealEnabled: boolean
  manuallyVerified: boolean
  activeListingsCount: number
  successfulDealsCount: number
  complaintsCount: number
  portfolioFilled: boolean
  servicesFilled: boolean
}

export type CalculatedBadge = {
  code: BadgeCode
  reason: string
  expiresAt?: Date | null
}

function daysSince(date: Date, now = new Date()) {
  return (now.getTime() - date.getTime()) / MS_DAY
}

function lastActivityAt(user: BadgeCalculationInput) {
  return user.lastSeenAt ?? user.lastLoginAt
}

export function calculateUserBadges(
  user: BadgeCalculationInput,
  now = new Date(),
): CalculatedBadge[] {
  if (user.isBanned || user.accountRestricted) return []

  const result: CalculatedBadge[] = []
  const profileCompleteness = calculateProfileCompleteness({
    name: user.name,
    phone: user.phone,
    phoneVerifiedAt: user.phoneVerifiedAt,
    email: user.email,
    emailVerified: user.emailVerified,
    avatar: user.avatar,
    city: user.city,
    description: user.description,
  })
  const profileTrust = getProfileTrust({
    phone: user.phone,
    phoneVerifiedAt: user.phoneVerifiedAt,
    email: user.email,
    vkId: user.vkId,
    yandexId: user.yandexId,
    name: user.name,
    avatar: user.avatar,
    description: user.description,
    city: user.city,
    reviewCount: user.reviewCount,
    listingCount: user.activeListingsCount,
    avgResponseMinutes: user.avgResponseMinutes,
    profileType: user.profileType,
  })

  const phoneVerified = Boolean(user.phoneVerifiedAt)
  const emailVerified = Boolean(user.emailVerified)
  const accountAgeDays = daysSince(user.createdAt, now)
  const hasComplaints = user.complaintsCount > 0
  const activity = lastActivityAt(user)

  if (user.premiumUntil && user.premiumUntil > now) {
    result.push({
      code: "PREMIUM",
      reason: "Активен премиум-статус",
      expiresAt: user.premiumUntil,
    })
  }

  if (
    user.manuallyVerified &&
    user.profileType === "COMPANY" &&
    (user.portfolioFilled || user.servicesFilled)
  ) {
    result.push({
      code: "PRO",
      reason: "Профиль проверен модерацией Нашло",
    })
  }

  if (user.safeDealEnabled) {
    result.push({
      code: "SAFE_DEAL",
      reason: "Включена безопасная сделка",
    })
  }

  if (
    !hasComplaints &&
    user.rating >= 4.5 &&
    user.successfulDealsCount >= 3 &&
    accountAgeDays >= 30
  ) {
    result.push({
      code: "TRUSTED",
      reason: "Высокий рейтинг, сделки без жалоб",
    })
  }

  if (
    activity &&
    daysSince(activity, now) <= 7 &&
    user.avgResponseMinutes != null &&
    user.avgResponseMinutes <= 120 &&
    user.activeListingsCount >= 1
  ) {
    result.push({
      code: "ACTIVE",
      reason: "Быстрые ответы и активные объявления",
    })
  }

  if (phoneVerified && emailVerified && profileTrust.score >= 70) {
    result.push({
      code: "VERIFIED",
      reason: "Подтверждены телефон и почта, профиль заполнен",
    })
  }

  if (profileCompleteness.isComplete && !hasComplaints) {
    result.push({
      code: "FIRST_STEP",
      reason: "Пользователь полностью заполнил профиль",
    })
  }

  const hasHigherBadge = result.some((b) => HIGHER_THAN_BEGINNER.includes(b.code))
  if (
    !hasHigherBadge &&
    !hasComplaints &&
    accountAgeDays < 14
  ) {
    result.push({
      code: "BEGINNER",
      reason: "Новый пользователь Нашло",
      expiresAt: new Date(user.createdAt.getTime() + 14 * MS_DAY),
    })
  }

  return result
}
