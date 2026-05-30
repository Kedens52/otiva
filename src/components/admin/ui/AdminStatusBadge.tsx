import { REFERRAL_STATUS_COLOR, REFERRAL_STATUS_LABEL } from "@/lib/admin/referral-labels"
import { PAYMENT_STATUS_LABEL } from "@/lib/payment-status"
import { cn } from "@/lib/utils"

const LISTING_LABELS: Record<string, string> = {
  MODERATION: "На проверке",
  ACTIVE: "Активно",
  REJECTED: "Отклонено",
  ARCHIVED: "Архив",
  SOLD: "Продано",
  DRAFT: "Черновик",
}

const LISTING_COLORS: Record<string, string> = {
  MODERATION: "bg-amber-50 text-amber-700",
  ACTIVE: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-600",
  ARCHIVED: "bg-zinc-100 text-zinc-500",
  SOLD: "bg-blue-50 text-blue-600",
  DRAFT: "bg-zinc-100 text-zinc-600",
}

const STAFF_LABELS: Record<string, string> = {
  ACTIVE: "Активен",
  SUSPENDED: "Заблокирован",
  REVOKED: "Отозван",
}

const STAFF_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  SUSPENDED: "bg-amber-50 text-amber-700",
  REVOKED: "bg-red-50 text-red-600",
}

const BUSINESS_LABELS: Record<string, string> = {
  NEW: "Новый",
  CONTACTED: "Связались",
  NEGOTIATING: "Переговоры",
  ACTIVE_CLIENT: "Активный",
  PAUSED: "Пауза",
  LOST: "Потерян",
}

const BUSINESS_COLORS: Record<string, string> = {
  NEW: "bg-blue-50 text-blue-700",
  CONTACTED: "bg-amber-50 text-amber-700",
  NEGOTIATING: "bg-purple-50 text-purple-700",
  ACTIVE_CLIENT: "bg-emerald-50 text-emerald-700",
  PAUSED: "bg-zinc-100 text-zinc-500",
  LOST: "bg-red-50 text-red-600",
}

const B2B_LABELS: Record<string, string> = {
  DRAFT: "Черновик",
  PENDING_REVIEW: "На проверке",
  VERIFIED: "Проверено",
  REJECTED: "Отклонено",
  BLOCKED: "Заблокировано",
}

const B2B_COLORS: Record<string, string> = {
  DRAFT: "bg-zinc-100 text-zinc-600",
  PENDING_REVIEW: "bg-amber-50 text-amber-700",
  VERIFIED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-600",
  BLOCKED: "bg-red-100 text-red-800",
}

const PAYMENT_COLORS: Record<string, string> = {
  CREATED: "bg-zinc-100 text-zinc-600",
  PENDING: "bg-amber-50 text-amber-700",
  SUCCEEDED: "bg-emerald-50 text-emerald-700",
  CANCELED: "bg-zinc-100 text-zinc-500",
  FAILED: "bg-red-50 text-red-600",
  REFUNDED: "bg-blue-50 text-blue-700",
  PARTIAL_REFUNDED: "bg-sky-50 text-sky-700",
}

export type AdminStatusBadgeVariant =
  | "listing"
  | "payment"
  | "staff"
  | "referral"
  | "business"
  | "b2b"

function resolveLabel(variant: AdminStatusBadgeVariant, status: string, label?: string) {
  if (label) return label
  switch (variant) {
    case "listing":
      return LISTING_LABELS[status] ?? status
    case "payment":
      return PAYMENT_STATUS_LABEL[status as keyof typeof PAYMENT_STATUS_LABEL] ?? status
    case "staff":
      return STAFF_LABELS[status] ?? status
    case "referral":
      return REFERRAL_STATUS_LABEL[status as keyof typeof REFERRAL_STATUS_LABEL] ?? status
    case "business":
      return BUSINESS_LABELS[status] ?? status
    case "b2b":
      return B2B_LABELS[status] ?? status
    default:
      return status
  }
}

function resolveColor(variant: AdminStatusBadgeVariant, status: string) {
  switch (variant) {
    case "listing":
      return LISTING_COLORS[status] ?? "bg-zinc-100 text-zinc-600"
    case "payment":
      return PAYMENT_COLORS[status] ?? "bg-zinc-100 text-zinc-600"
    case "staff":
      return STAFF_COLORS[status] ?? "bg-zinc-100 text-zinc-600"
    case "referral":
      return REFERRAL_STATUS_COLOR[status as keyof typeof REFERRAL_STATUS_COLOR] ?? "bg-zinc-100 text-zinc-600"
    case "business":
      return BUSINESS_COLORS[status] ?? "bg-zinc-100 text-zinc-600"
    case "b2b":
      return B2B_COLORS[status] ?? "bg-zinc-100 text-zinc-600"
    default:
      return "bg-zinc-100 text-zinc-600"
  }
}

type AdminStatusBadgeProps = {
  variant: AdminStatusBadgeVariant
  status: string
  label?: string
  className?: string
}

export function AdminStatusBadge({ variant, status, label, className }: AdminStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
        resolveColor(variant, status),
        className,
      )}
    >
      {resolveLabel(variant, status, label)}
    </span>
  )
}
