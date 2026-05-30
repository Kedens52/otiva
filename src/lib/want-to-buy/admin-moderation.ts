import type { WantToBuyStatus } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { notifyWantToBuyRejected } from "@/lib/want-to-buy/notify"

/** Модерация заявки из админки (Stage 8 вызывает этот helper). */
export async function setWantToBuyModerationStatus(params: {
  wantToBuyId: string
  status: Extract<WantToBuyStatus, "ACTIVE" | "REJECTED" | "CLOSED">
  rejectionReason?: string | null
  moderationReasonCode?: string | null
}) {
  const existing = await prisma.wantToBuy.findUnique({
    where: { id: params.wantToBuyId },
    select: { id: true, userId: true, title: true, status: true },
  })
  if (!existing) return null

  const updated = await prisma.wantToBuy.update({
    where: { id: params.wantToBuyId },
    data: {
      status: params.status,
      rejectionReason:
        params.status === "REJECTED" ? params.rejectionReason?.trim() || "Отклонено модератором" : null,
      moderationReasonCode: params.moderationReasonCode ?? null,
      autoApproved: params.status === "ACTIVE",
    },
  })

  if (params.status === "REJECTED" && existing.status !== "REJECTED") {
    void notifyWantToBuyRejected({
      buyerUserId: existing.userId,
      title: existing.title,
      wantToBuyId: existing.id,
      reason: params.rejectionReason,
    })
  }

  return updated
}
