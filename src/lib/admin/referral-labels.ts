import type { ReferralStatus } from "@prisma/client"

export const REFERRAL_STATUS_LABEL: Record<ReferralStatus, string> = {
  PENDING: "Ожидает активации",
  ACTIVE: "Активирован",
  REJECTED: "Отклонён",
}

export const REFERRAL_STATUS_COLOR: Record<ReferralStatus, string> = {
  PENDING: "bg-amber-50 text-amber-800",
  ACTIVE: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-600",
}
