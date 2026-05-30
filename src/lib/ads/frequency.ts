import type { PrismaClient } from "@prisma/client"

function startOfUtcDay(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

export async function isAdBlockedForUser(
  prisma: PrismaClient,
  adId: string,
  userId: string | null | undefined,
  sessionId: string | null | undefined,
  limits: { maxPerDay: number; maxPerSession: number },
): Promise<{ blocked: boolean; reason?: string }> {
  if (userId) {
    const hidden = await prisma.adEvent.findFirst({
      where: { adId, userId, eventType: "HIDE" },
      select: { id: true },
    })
    if (hidden) return { blocked: true, reason: "hidden" }
  }

  const dayStart = startOfUtcDay()

  if (userId) {
    const dayCount = await prisma.adEvent.count({
      where: {
        adId,
        userId,
        eventType: "IMPRESSION",
        createdAt: { gte: dayStart },
      },
    })
    if (dayCount >= limits.maxPerDay) {
      return { blocked: true, reason: "daily_cap" }
    }
  }

  if (sessionId) {
    const sessionCount = await prisma.adEvent.count({
      where: {
        adId,
        sessionId,
        eventType: "IMPRESSION",
      },
    })
    if (sessionCount >= limits.maxPerSession) {
      return { blocked: true, reason: "session_cap" }
    }
  }

  return { blocked: false }
}
