import type { BadgeCode } from "@prisma/client"
import type { PublicUserBadge } from "@/lib/badges/badge-map"
import { badgeChipClass, badgeIconUrl } from "@/lib/badges/badge-map"

/** Логические типы значков (для UI и документации). */
export type UserBadgeType =
  | "VERIFIED_SELLER"
  | "PERVII"
  | "PROFILE_COMPLETED"
  | "FAST_RESPONDER"
  | "TRUSTED_SELLER"
  | "NO_COMPLAINTS"
  | "TOP_SELLER"
  | "LONG_TIME_MEMBER"
  | "SAFE_DEAL"
  | "PREMIUM"
  | "BEGINNER"

export interface UserBadge {
  id: string
  type: UserBadgeType
  label: string
  description?: string
  icon?: string
  color?: string
  active: boolean
}

export const BADGE_CODE_TO_USER_TYPE: Record<BadgeCode, UserBadgeType> = {
  BEGINNER: "BEGINNER",
  FIRST_STEP: "PERVII",
  VERIFIED: "VERIFIED_SELLER",
  ACTIVE: "FAST_RESPONDER",
  TRUSTED: "TRUSTED_SELLER",
  SAFE_DEAL: "SAFE_DEAL",
  PRO: "TOP_SELLER",
  PREMIUM: "PREMIUM",
}

export function publicBadgeToUserBadge(badge: PublicUserBadge): UserBadge {
  return {
    id: badge.code,
    type: BADGE_CODE_TO_USER_TYPE[badge.code] ?? (badge.code as UserBadgeType),
    label: badge.title,
    description: badge.description,
    icon: badgeIconUrl(badge.code),
    color: badgeChipClass(badge.code),
    active: true,
  }
}

export function publicBadgesToUserBadges(badges: PublicUserBadge[]): UserBadge[] {
  return badges.filter(Boolean).map(publicBadgeToUserBadge)
}

export function normalizeBadgeInput(
  badges: PublicUserBadge[] | UserBadge[],
): UserBadge[] {
  if (!badges.length) return []
  const first = badges[0] as PublicUserBadge | UserBadge
  if ("code" in first && first.code) {
    return publicBadgesToUserBadges(badges as PublicUserBadge[])
  }
  return (badges as UserBadge[]).filter((b) => b.active !== false)
}
