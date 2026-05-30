import type { PaymentStatus } from "@prisma/client"

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  CREATED: "Создан",
  PENDING: "Ожидает оплаты",
  SUCCEEDED: "Оплачен",
  CANCELED: "Отменён",
  FAILED: "Ошибка",
  REFUNDED: "Возврат",
  PARTIAL_REFUNDED: "Частичный возврат",
}

/** Маппинг статусов T-Bank → PaymentStatus */
export function mapTbankStatusToPayment(statusRaw: string): PaymentStatus | null {
  const s = statusRaw.trim().toUpperCase()
  if (s === "CONFIRMED" || s === "AUTHORIZED") return "SUCCEEDED"
  if (s === "REJECTED" || s === "DEADLINE_EXPIRED") return "FAILED"
  if (s === "CANCELED" || s === "REVERSED") return "CANCELED"
  if (s === "REFUNDED") return "REFUNDED"
  if (s === "PARTIAL_REFUNDED") return "PARTIAL_REFUNDED"
  if (s === "NEW" || s === "FORM_SHOWED") return "PENDING"
  return null
}

export function isPaidStatus(status: PaymentStatus) {
  return status === "SUCCEEDED" || status === "PARTIAL_REFUNDED"
}

export function isTerminalFailure(status: PaymentStatus) {
  return status === "FAILED" || status === "CANCELED"
}
