import type { PrismaClient } from "@prisma/client"
import { prisma as defaultPrisma } from "@/lib/prisma"
import { ensureBadgeCatalog } from "@/lib/badges/sync-user-badges"
import { resolveBadgeIcon, sortBadgesByPriority, badgeChipClass, type PublicUserBadge } from "@/lib/badges/badge-map"
import type { BadgeCode } from "@prisma/client"

function rowToPublicBadge(row: {
  badge: {
    code: BadgeCode
    title: string
    subtitle: string
    description: string
    icon: string
    priority: number
    isActive: boolean
  }
}): PublicUserBadge | null {
  if (!row.badge.isActive) return null
  return {
    code: row.badge.code,
    title: row.badge.title,
    subtitle: row.badge.subtitle,
    description: row.badge.description,
    icon: resolveBadgeIcon(row.badge.code, row.badge.icon),
    priority: row.badge.priority,
    chipClass: badgeChipClass(row.badge.code),
  }
}

export async function getPublicUserBadges(
  userId: string,
  db: PrismaClient = defaultPrisma,
): Promise<PublicUserBadge[]> {
  await ensureBadgeCatalog(db).catch(() => {})

  const now = new Date()
  const rows = await db.userBadge.findMany({
    where: {
      userId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    include: { badge: true },
    orderBy: { badge: { priority: "desc" } },
  })

  const badges = rows
    .map(rowToPublicBadge)
    .filter((b): b is PublicUserBadge => b != null)

  return sortBadgesByPriority(badges)
}

export async function getPublicBadgesForUsers(
  userIds: string[],
  db: PrismaClient = defaultPrisma,
): Promise<Map<string, PublicUserBadge[]>> {
  const unique = [...new Set(userIds.filter(Boolean))]
  const map = new Map<string, PublicUserBadge[]>()
  if (!unique.length) return map

  await ensureBadgeCatalog(db).catch(() => {})

  const now = new Date()
  const rows = await db.userBadge.findMany({
    where: {
      userId: { in: unique },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    include: { badge: true },
  })

  for (const id of unique) {
    const userRows = rows.filter((r) => r.userId === id)
    const badges = sortBadgesByPriority(
      userRows
        .map(rowToPublicBadge)
        .filter((b): b is PublicUserBadge => b != null),
    )
    map.set(id, badges)
  }
  return map
}
