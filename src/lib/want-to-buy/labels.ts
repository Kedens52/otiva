import type { WantToBuyCondition, WantToBuyOfferStatus, WantToBuyStatus } from "@prisma/client"

const CONDITION_LABELS: Record<WantToBuyCondition, string> = {
  NEW: "Новый",
  USED: "Б/у",
  ANY: "Любое",
}

const STATUS_LABELS: Record<WantToBuyStatus, string> = {
  ACTIVE: "Активна",
  CLOSED: "Закрыта",
  EXPIRED: "Истекла",
  MODERATION: "На модерации",
  REJECTED: "Отклонена",
}

const OFFER_STATUS_LABELS: Record<WantToBuyOfferStatus, string> = {
  PENDING: "Ожидает",
  VIEWED: "Просмотрен",
  ACCEPTED: "Принят",
  DECLINED: "Отклонён",
}

export function wantToBuyConditionLabel(condition: WantToBuyCondition | string): string {
  return CONDITION_LABELS[condition as WantToBuyCondition] ?? String(condition)
}

export function wantToBuyStatusLabel(status: WantToBuyStatus | string): string {
  return STATUS_LABELS[status as WantToBuyStatus] ?? String(status)
}

export function offerStatusLabel(status: WantToBuyOfferStatus | string): string {
  return OFFER_STATUS_LABELS[status as WantToBuyOfferStatus] ?? String(status)
}

export function formatWantToBuyPriceMax(priceMax: number | null): string {
  if (priceMax == null) return "Бюджет не указан"
  if (priceMax === 0) return "Бесплатно"
  return `до ${priceMax.toLocaleString("ru-RU")} ₽`
}

export function formatDaysLeft(expiresAt: string): string {
  const end = new Date(expiresAt).getTime()
  const diff = end - Date.now()
  if (diff <= 0) return "Истекает"
  const days = Math.ceil(diff / (24 * 60 * 60 * 1000))
  if (days === 1) return "1 день"
  if (days < 5) return `${days} дня`
  return `${days} дней`
}
