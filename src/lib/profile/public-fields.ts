import { profileTypeLabel } from "@/lib/profile-hub"
import { EXPERIENCE_OPTIONS, SELLER_ROLE_OPTIONS, DELIVERY_OPTIONS } from "@/lib/profile/constants"

export type SellerProfileRow = {
  id: string
  name: string | null
  firstName?: string | null
  lastName?: string | null
  avatar: string | null
  description: string | null
  profileHeadline?: string | null
  city: string | null
  region?: string | null
  district?: string | null
  metro?: string | null
  profileType?: string | null
  sellerRole?: string | null
  businessCategory?: string | null
  experience?: string | null
  serviceArea?: string | null
  deliveryOptions?: string[]
  guaranteeText?: string | null
  companyName?: string | null
  companyRole?: string | null
  websiteUrl?: string | null
  vkUrl?: string | null
  maxUrl?: string | null
  isVerified: boolean
  rating: number
  reviewCount: number
  createdAt: Date | string
  lastSeenAt?: Date | string | null
  avgResponseMinutes?: number | null
  phone?: string | null
  email?: string | null
  showPhone?: boolean
  showPhonePublicly?: boolean
  showEmailPublicly?: boolean
  showCityPublicly?: boolean
  showDistrictPublicly?: boolean
  showActivityPublicly?: boolean
  showBadgesPublicly?: boolean
  showReviewsPublicly?: boolean
  companyInn?: string | null
}

export function labelSellerRole(value?: string | null) {
  return SELLER_ROLE_OPTIONS.find((o) => o.value === value)?.label ?? null
}

export function labelExperience(value?: string | null) {
  return EXPERIENCE_OPTIONS.find((o) => o.value === value)?.label ?? null
}

export function labelDeliveryOptions(values?: string[]) {
  if (!values?.length) return []
  return values
    .map((v) => DELIVERY_OPTIONS.find((o) => o.value === v)?.label ?? v)
    .filter(Boolean)
}

export function buildPublicLocation(seller: SellerProfileRow) {
  if (seller.showCityPublicly === false) return null
  const parts = [seller.city, seller.showDistrictPublicly !== false ? seller.district : null]
    .filter(Boolean)
    .map((p) => String(p).trim())
  return parts.length ? parts.join(", ") : null
}

export function toPublicSellerProfile(seller: SellerProfileRow) {
  const {
    phone,
    email,
    companyInn,
    showPhonePublicly,
    showEmailPublicly,
    showCityPublicly,
    showDistrictPublicly,
    showActivityPublicly,
    showBadgesPublicly,
    showReviewsPublicly,
    ...rest
  } = seller

  return {
    ...rest,
    profileTypeLabel: profileTypeLabel(seller.profileType === "COMPANY" ? "COMPANY" : "PERSON"),
    sellerRoleLabel: labelSellerRole(seller.sellerRole),
    experienceLabel: labelExperience(seller.experience),
    deliveryLabels: labelDeliveryOptions(seller.deliveryOptions),
    locationLabel: buildPublicLocation(seller),
    showPhonePublic: Boolean(showPhonePublicly && phone),
    showEmailPublic: Boolean(showEmailPublicly && email),
    showCityPublic: showCityPublicly !== false,
    showDistrictPublic: showDistrictPublicly !== false,
    showActivityPublic: showActivityPublicly !== false,
    showBadgesPublic: showBadgesPublicly !== false,
    showReviewsPublic: showReviewsPublicly !== false,
    publicWebsiteUrl: seller.websiteUrl,
    publicVkUrl: seller.vkUrl,
    publicMaxUrl: seller.maxUrl,
  }
}

export const PROFILE_SELECT_PUBLIC = {
  id: true,
  name: true,
  firstName: true,
  lastName: true,
  avatar: true,
  description: true,
  profileHeadline: true,
  city: true,
  region: true,
  district: true,
  metro: true,
  profileType: true,
  sellerRole: true,
  businessCategory: true,
  experience: true,
  serviceArea: true,
  deliveryOptions: true,
  guaranteeText: true,
  companyName: true,
  companyRole: true,
  websiteUrl: true,
  vkUrl: true,
  maxUrl: true,
  isVerified: true,
  rating: true,
  reviewCount: true,
  createdAt: true,
  lastSeenAt: true,
  avgResponseMinutes: true,
  phone: true,
  email: true,
  showPhone: true,
  showPhonePublicly: true,
  showEmailPublicly: true,
  showCityPublicly: true,
  showDistrictPublicly: true,
  showActivityPublicly: true,
  showBadgesPublicly: true,
  showReviewsPublicly: true,
  publicSlug: true,
} as const
