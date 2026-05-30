import type { AdStatus } from "@prisma/client"

export const AD_STATUS_LABELS: Record<AdStatus, string> = {
  DRAFT: "Черновик",
  WAITING_PAYMENT: "Ожидает оплаты",
  PENDING_REVIEW: "На модерации",
  ACTIVE: "Активна",
  PAUSED: "Приостановлена",
  REJECTED: "Отклонена",
  NEEDS_CHANGES: "Нужны правки",
  FINISHED: "Завершена",
  ARCHIVED: "В архиве",
}

export const AD_STATUS_HINTS: Partial<Record<AdStatus, string>> = {
  PENDING_REVIEW: "Реклама проверяется. Обычно это занимает немного времени.",
  NEEDS_CHANGES: "Внесите правки по комментарию модератора и отправьте снова.",
  REJECTED: "Кампания отклонена. Смотрите причину ниже.",
  WAITING_PAYMENT: "Оплатите размещение, чтобы отправить на проверку.",
  ACTIVE: "Реклама показывается на сайте.",
}

export function calcCtr(impressions: number, clicks: number): number {
  if (impressions <= 0) return 0
  return Math.round((clicks / impressions) * 10000) / 100
}

export function budgetRemaining(budget: number | null | undefined, spent: number): number | null {
  if (budget == null) return null
  return Math.max(0, budget - spent)
}
