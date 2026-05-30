import crypto from "crypto"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export function hashTbankWebhookPayload(payload: Record<string, unknown>): string {
  const orderId = String(payload.OrderId ?? "")
  const status = String(payload.Status ?? "")
  const paymentId = payload.PaymentId != null ? String(payload.PaymentId) : ""
  const amount = payload.Amount != null ? String(payload.Amount) : ""
  const base = `${orderId}|${status}|${paymentId}|${amount}`
  return crypto.createHash("sha256").update(base, "utf8").digest("hex")
}

/** true = уже обрабатывали этот webhook */
export async function isDuplicatePaymentEvent(paymentId: string, rawEventHash: string) {
  const existing = await prisma.paymentEvent.findUnique({
    where: {
      paymentId_rawEventHash: { paymentId, rawEventHash },
    },
    select: { id: true },
  })
  return Boolean(existing)
}

export async function recordPaymentEvent(
  paymentId: string,
  status: string,
  payload: Prisma.InputJsonValue,
  providerEventId?: string | null,
) {
  const rawEventHash = hashTbankWebhookPayload(payload as Record<string, unknown>)
  try {
    await prisma.paymentEvent.create({
      data: {
        paymentId,
        status,
        payload,
        rawEventHash,
        providerEventId: providerEventId ?? null,
      },
    })
    return { duplicate: false, rawEventHash }
  } catch (error) {
    const code = (error as { code?: string })?.code
    if (code === "P2002") return { duplicate: true, rawEventHash }
    throw error
  }
}
