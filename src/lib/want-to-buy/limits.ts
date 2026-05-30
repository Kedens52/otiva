import { prisma } from "@/lib/prisma"
import { WANT_TO_BUY_MAX_ACTIVE } from "@/lib/want-to-buy/constants"

export async function countActiveWantToBuys(userId: string): Promise<number> {
  return prisma.wantToBuy.count({
    where: { userId, status: "ACTIVE" },
  })
}

export async function assertCanCreateWantToBuy(userId: string): Promise<
  | { ok: true }
  | { ok: false; error: string; status: number }
> {
  const active = await countActiveWantToBuys(userId)
  if (active >= WANT_TO_BUY_MAX_ACTIVE) {
    return {
      ok: false,
      status: 403,
      error: `Максимум ${WANT_TO_BUY_MAX_ACTIVE} активных заявок. Закройте или дождитесь завершения существующих.`,
    }
  }
  return { ok: true }
}

export async function hasRecentDuplicateWantToBuy(
  userId: string,
  title: string,
): Promise<boolean> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const normalized = title.trim().toLowerCase()
  const recent = await prisma.wantToBuy.findMany({
    where: { userId, createdAt: { gte: since } },
    select: { title: true },
    take: 20,
  })
  return recent.some((row) => row.title.trim().toLowerCase() === normalized)
}
