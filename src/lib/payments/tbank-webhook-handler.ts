import type { Payment, PaymentStatus } from "@prisma/client"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { promotionDays } from "@/lib/tbank"
import { isPaidStatus, mapTbankStatusToPayment } from "@/lib/payment-status"
import { recordPaymentEvent } from "@/lib/payments/payment-events"

type TbankWebhook = Record<string, string | number | boolean | null | undefined | object>

function coerceKopecks(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v)
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v)
    return Number.isFinite(n) ? Math.trunc(n) : null
  }
  return null
}

function isWalletServiceType(serviceType: string) {
  return serviceType.toLowerCase().includes("wallet")
}

function totalRefundedKopecksFromPayload(
  statusUpper: string,
  originalKopecks: number,
  payload: TbankWebhook,
): number {
  if (statusUpper === "REFUNDED" || statusUpper === "REVERSED") return originalKopecks
  if (statusUpper === "PARTIAL_REFUNDED") {
    const remaining = coerceKopecks(payload.Amount)
    if (remaining === null) return 0
    return Math.max(0, originalKopecks - remaining)
  }
  return 0
}

async function applyWalletRefund(
  tx: Prisma.TransactionClient,
  payment: Payment,
  orderId: string,
  statusUpper: string,
  payload: TbankWebhook,
  totalRefundedKopecks: number,
) {
  const creditedRubles = Math.floor(payment.amount / 100)
  const targetDebitRubles = Math.min(creditedRubles, Math.floor(Math.max(0, totalRefundedKopecks) / 100))

  const prev = await tx.walletTransaction.aggregate({
    where: {
      userId: payment.userId,
      type: "REFUND_TOP_UP",
      metadata: { path: ["orderId"], equals: orderId },
    },
    _sum: { amount: true },
  })
  const alreadyBackRubles = Math.abs(prev._sum.amount ?? 0)
  const deltaRubles = targetDebitRubles - alreadyBackRubles

  if (deltaRubles > 0) {
    const updatedUser = await tx.user.update({
      where: { id: payment.userId },
      data: { walletBalance: { decrement: deltaRubles } },
      select: { walletBalance: true },
    })
    await tx.walletTransaction.create({
      data: {
        userId: payment.userId,
        type: "REFUND_TOP_UP",
        status: "COMPLETED",
        amount: -deltaRubles,
        balanceAfter: updatedUser.walletBalance,
        title: "Возврат пополнения (Т-Банк)",
        metadata: {
          orderId,
          tbankStatus: statusUpper,
          paymentId: payload.PaymentId != null ? String(payload.PaymentId) : null,
          totalRefundedKopecks,
        },
      },
    })
  }
}

async function deactivateListingPromotion(tx: Prisma.TransactionClient, listingId: string) {
  await tx.listing.update({
    where: { id: listingId },
    data: { isPromoted: false, promotedUntil: null },
  })
}

async function applySucceeded(
  tx: Prisma.TransactionClient,
  payment: Payment,
  payload: TbankWebhook,
) {
  const updatedPayment = await tx.payment.update({
    where: { id: payment.id },
    data: {
      status: "SUCCEEDED",
      tbankPaymentId: payload.PaymentId != null ? String(payload.PaymentId) : payment.tbankPaymentId,
      raw: payload as Prisma.InputJsonValue,
      paidAt: new Date(),
    },
  })

  if (isWalletServiceType(updatedPayment.serviceType)) {
    const rubles = Math.floor(updatedPayment.amount / 100)
    const updatedUser = await tx.user.update({
      where: { id: updatedPayment.userId },
      data: { walletBalance: { increment: rubles } },
      select: { walletBalance: true },
    })
    await tx.walletTransaction.create({
      data: {
        userId: updatedPayment.userId,
        type: "TOP_UP",
        status: "COMPLETED",
        amount: rubles,
        balanceAfter: updatedUser.walletBalance,
        title: "Пополнение баланса через Т-Банк",
        metadata: { orderId: updatedPayment.orderId, paymentId: updatedPayment.tbankPaymentId },
      },
    })
  }

  const days = promotionDays(updatedPayment.serviceType)
  if (days && updatedPayment.listingId) {
    await tx.listing.update({
      where: { id: updatedPayment.listingId },
      data: {
        isPromoted: true,
        promotedUntil: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
      },
    })
  }
}

export async function handleTbankWebhookPayload(payload: TbankWebhook): Promise<"OK" | "NO_ORDER" | "NO_PAYMENT"> {
  const orderId = typeof payload.OrderId === "string" ? payload.OrderId : String(payload.OrderId || "")
  if (!orderId) return "NO_ORDER"

  const statusRaw = typeof payload.Status === "string" ? payload.Status.trim() : ""
  const statusUpper = statusRaw.toUpperCase()
  const mapped = mapTbankStatusToPayment(statusRaw)

  const payment = await prisma.payment.findUnique({ where: { orderId } })
  if (!payment) return "NO_PAYMENT"

  const providerEventId = payload.PaymentId != null ? String(payload.PaymentId) : null
  const eventRecord = await recordPaymentEvent(
    payment.id,
    statusUpper || "UNKNOWN",
    payload as Prisma.InputJsonValue,
    providerEventId,
  )
  if (eventRecord.duplicate) return "OK"

  const refundStatuses = new Set(["REFUNDED", "PARTIAL_REFUNDED", "REVERSED"])
  const isReversalAfterCapture = statusUpper === "REVERSED" && isPaidStatus(payment.status)

  if (refundStatuses.has(statusUpper) || isReversalAfterCapture) {
    await prisma.$transaction(async (tx) => {
      const fresh = await tx.payment.findUnique({ where: { orderId } })
      if (!fresh) return

      const refundStatus: PaymentStatus =
        statusUpper === "PARTIAL_REFUNDED"
          ? "PARTIAL_REFUNDED"
          : isReversalAfterCapture
            ? "REFUNDED"
            : mapped === "CANCELED"
              ? "CANCELED"
              : "REFUNDED"

      if (!isPaidStatus(fresh.status)) {
        await tx.payment.update({
          where: { id: fresh.id },
          data: {
            status: refundStatus === "CANCELED" ? "CANCELED" : fresh.status,
            tbankPaymentId: providerEventId ?? fresh.tbankPaymentId,
            raw: payload as Prisma.InputJsonValue,
            canceledAt: refundStatus === "CANCELED" ? new Date() : fresh.canceledAt,
          },
        })
        return
      }

      const totalRefundedKopecks = totalRefundedKopecksFromPayload(
        isReversalAfterCapture ? "REFUNDED" : statusUpper,
        fresh.amount,
        payload,
      )

      if (isWalletServiceType(fresh.serviceType)) {
        await applyWalletRefund(tx, fresh, orderId, statusUpper, payload, totalRefundedKopecks)
      }

      if (fresh.listingId && (refundStatus === "REFUNDED" || isReversalAfterCapture)) {
        await deactivateListingPromotion(tx, fresh.listingId)
      }

      await tx.payment.update({
        where: { id: fresh.id },
        data: {
          status: refundStatus,
          tbankPaymentId: providerEventId ?? fresh.tbankPaymentId,
          raw: payload as Prisma.InputJsonValue,
          refundedAt: new Date(),
        },
      })
    })
    return "OK"
  }

  if (mapped === "SUCCEEDED") {
    if (payment.status === "SUCCEEDED") return "OK"

    await prisma.$transaction(async (tx) => {
      const fresh = await tx.payment.findUnique({ where: { orderId } })
      if (!fresh || fresh.status === "SUCCEEDED") return
      await applySucceeded(tx, fresh, payload)
    })
    return "OK"
  }

  if (mapped) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: mapped,
        tbankPaymentId: providerEventId ?? payment.tbankPaymentId,
        raw: payload as Prisma.InputJsonValue,
        canceledAt: mapped === "CANCELED" ? new Date() : payment.canceledAt,
      },
    })
    return "OK"
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      tbankPaymentId: providerEventId ?? payment.tbankPaymentId,
      raw: payload as Prisma.InputJsonValue,
    },
  })
  return "OK"
}
