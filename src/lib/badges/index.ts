export { badgeMap, badgeChipClass, sortBadgesByPriority, toPublicBadge, type PublicUserBadge } from "@/lib/badges/badge-map"
export {
  publicBadgeToUserBadge,
  publicBadgesToUserBadges,
  type UserBadge,
  type UserBadgeType,
} from "@/lib/badges/user-badge-types"
export {
  calculateProfileCompleteness,
  type ProfileCompleteness,
  type ProfileCompletenessInput,
} from "@/lib/badges/profile-completeness"
export { calculateUserBadges, type BadgeCalculationInput, type CalculatedBadge } from "@/lib/badges/calculate-user-badges"
export { loadUserBadgeContext } from "@/lib/badges/load-user-badge-context"
export {
  syncUserBadges,
  issueAdminBadge,
  revokeUserBadge,
  ensureBadgeCatalog,
} from "@/lib/badges/sync-user-badges"
export { getPublicUserBadges, getPublicBadgesForUsers } from "@/lib/badges/get-public-badges"
