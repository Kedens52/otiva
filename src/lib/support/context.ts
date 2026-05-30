import { prisma } from "@/lib/prisma"
import type { BotListingCard, UserSupportContext } from "@/lib/support/bot-engine"

export async function loadUserSupportContext(userId: string, userName: string | null): Promise<UserSupportContext> {
  const [listings, campaigns, bonusAgg] = await Promise.all([
    prisma.listing.findMany({
      where: { sellerId: userId },
      orderBy: { updatedAt: "desc" },
      take: 12,
      select: {
        id: true,
        title: true,
        price: true,
        status: true,
        images: true,
      },
    }),
    prisma.adCampaign.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: { id: true, title: true, status: true },
    }),
    prisma.bonusTransaction.aggregate({
      where: { userId, status: "APPROVED" },
      _sum: { amount: true },
    }),
  ])

  const listingCards: BotListingCard[] = listings.map((l) => ({
    id: l.id,
    title: l.title,
    price: l.price,
    image: l.images?.[0] ?? null,
    status: l.status,
  }))

  return {
    userId,
    userName,
    listings: listingCards,
    adCampaigns: campaigns.map((c) => ({ id: c.id, title: c.title, status: c.status })),
    bonusBalance: bonusAgg._sum.amount ?? 0,
  }
}
