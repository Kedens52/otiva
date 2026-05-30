import type { PrismaClient } from "@prisma/client"
import type { BadgeCalculationInput } from "@/lib/badges/calculate-user-badges"

export async function loadUserBadgeContext(
  prisma: PrismaClient,
  userId: string,
): Promise<BadgeCalculationInput | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      createdAt: true,
      isBanned: true,
      accountRestricted: true,
      phoneVerifiedAt: true,
      emailVerified: true,
      phone: true,
      email: true,
      vkId: true,
      yandexId: true,
      name: true,
      avatar: true,
      description: true,
      city: true,
      profileType: true,
      rating: true,
      reviewCount: true,
      avgResponseMinutes: true,
      lastSeenAt: true,
      lastLoginAt: true,
      premiumUntil: true,
      safeDealEnabled: true,
      manuallyVerified: true,
    },
  })
  if (!user) return null

  const [activeListingsCount, successfulDealsCount, complaintsCount, servicesListings] =
    await Promise.all([
      prisma.listing.count({ where: { sellerId: userId, status: "ACTIVE" } }),
      prisma.listing.count({ where: { sellerId: userId, status: "SOLD" } }),
      prisma.report.count({
        where: {
          targetUserId: userId,
          status: { in: ["pending", "open", "reviewing"] },
        },
      }),
      prisma.listing.findMany({
        where: {
          sellerId: userId,
          status: "ACTIVE",
          category: { slug: "services" },
        },
        select: { attributes: true },
        take: 20,
      }),
    ])

  const portfolioFilled = servicesListings.some((row) => {
    const attrs = row.attributes as Record<string, unknown> | null
    return attrs?.portfolio === true || attrs?.portfolio === "true" || attrs?.portfolio === "yes"
  })

  const servicesFilled = servicesListings.length > 0

  return {
    ...user,
    activeListingsCount,
    successfulDealsCount,
    complaintsCount,
    portfolioFilled: portfolioFilled || Boolean(user.description?.trim()),
    servicesFilled,
  }
}
