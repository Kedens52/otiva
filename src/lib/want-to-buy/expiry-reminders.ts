import { prisma } from "@/lib/prisma"
import { WANT_TO_BUY_EXPIRY_REMINDER_DAYS } from "@/lib/want-to-buy/constants"
import { expireStaleWantToBuys } from "@/lib/want-to-buy/expire"
import { notifyWantToBuyExpiringSoon } from "@/lib/want-to-buy/notify"

export type ExpiryReminderRunResult = {
  expired: number
  remindersSent: number
  scanned: number
}

/**
 * Помечает просроченные заявки и шлёт напоминание за 3 дня до истечения (один раз на заявку).
 */
export async function runWantToBuyExpiryReminders(): Promise<ExpiryReminderRunResult> {
  const expired = await expireStaleWantToBuys()

  const now = new Date()
  const windowEnd = new Date(now)
  windowEnd.setDate(windowEnd.getDate() + WANT_TO_BUY_EXPIRY_REMINDER_DAYS)

  const candidates = await prisma.wantToBuy.findMany({
    where: {
      status: "ACTIVE",
      expiresAt: { gt: now, lte: windowEnd },
      expiringSoonNotifiedAt: null,
    },
    select: {
      id: true,
      userId: true,
      title: true,
      expiresAt: true,
    },
    take: 500,
  })

  let remindersSent = 0
  for (const row of candidates) {
    const msLeft = row.expiresAt.getTime() - now.getTime()
    const daysLeft = Math.max(1, Math.ceil(msLeft / (24 * 60 * 60 * 1000)))

    await notifyWantToBuyExpiringSoon({
      buyerUserId: row.userId,
      title: row.title,
      wantToBuyId: row.id,
      daysLeft,
    })

    await prisma.wantToBuy.update({
      where: { id: row.id },
      data: { expiringSoonNotifiedAt: new Date() },
    })
    remindersSent += 1
  }

  return { expired, remindersSent, scanned: candidates.length }
}
