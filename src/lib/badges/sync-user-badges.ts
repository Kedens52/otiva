import type { BadgeCode, PrismaClient } from "@prisma/client"
import { prisma as defaultPrisma } from "@/lib/prisma"
import { badgeMap } from "@/lib/badges/badge-map"
import { calculateUserBadges } from "@/lib/badges/calculate-user-badges"
import { loadUserBadgeContext } from "@/lib/badges/load-user-badge-context"

export async function ensureBadgeCatalog(db: PrismaClient) {
  for (const [code, def] of Object.entries(badgeMap) as [BadgeCode, (typeof badgeMap)[BadgeCode]][]) {
    try {
      await db.badge.upsert({
        where: { code },
        create: {
          code,
          title: def.title,
          subtitle: def.subtitle,
          description: def.description,
          icon: def.icon,
          priority: def.priority,
        },
        update: {
          title: def.title,
          subtitle: def.subtitle,
          description: def.description,
          icon: def.icon,
          priority: def.priority,
          isActive: true,
        },
      })
    } catch (error) {
      console.warn(`[badges] skip catalog upsert for ${code}:`, (error as Error).message)
    }
  }
}

export async function syncUserBadges(
  userId: string,
  db: PrismaClient = defaultPrisma,
): Promise<void> {
  try {
    await ensureBadgeCatalog(db)
  } catch (error) {
    console.warn("[badges] ensureBadgeCatalog failed:", (error as Error).message)
  }

  const context = await loadUserBadgeContext(db, userId)
  if (!context) return

  const calculated = calculateUserBadges(context)
  const expectedCodes = new Set(calculated.map((b) => b.code))
  const calculatedByCode = new Map(calculated.map((b) => [b.code, b]))

  let badgeRows: Awaited<ReturnType<typeof db.badge.findMany>> = []
  let existing: Awaited<ReturnType<typeof db.userBadge.findMany>> = []
  try {
    ;[badgeRows, existing] = await Promise.all([
      db.badge.findMany({ where: { isActive: true } }),
      db.userBadge.findMany({
        where: { userId },
        include: { badge: true },
      }),
    ])
  } catch (error) {
    console.warn("[badges] syncUserBadges load failed:", (error as Error).message)
    return
  }

  const badgeIdByCode = new Map(badgeRows.map((b) => [b.code, b.id]))
  const now = new Date()

  for (const code of expectedCodes) {
    const badgeId = badgeIdByCode.get(code)
    if (!badgeId) continue
    const meta = calculatedByCode.get(code)!
    const row = existing.find((e) => e.badge.code === code)

    if (!row) {
      await db.userBadge.create({
        data: {
          userId,
          badgeId,
          issuedBy: "system",
          reason: meta.reason,
          expiresAt: meta.expiresAt ?? null,
        },
      })
      continue
    }

    if (row.issuedBy === "system") {
      await db.userBadge.update({
        where: { id: row.id },
        data: {
          reason: meta.reason,
          expiresAt: meta.expiresAt ?? null,
        },
      })
    }
  }

  for (const row of existing) {
    const code = row.badge.code
    if (row.issuedBy === "admin" || row.issuedBy === "manual") {
      if (code === "PREMIUM" && context.premiumUntil && context.premiumUntil <= now) {
        await db.userBadge.delete({ where: { id: row.id } })
      }
      continue
    }

    if (row.expiresAt && row.expiresAt <= now) {
      await db.userBadge.delete({ where: { id: row.id } })
      continue
    }

    if (!expectedCodes.has(code)) {
      await db.userBadge.delete({ where: { id: row.id } })
    }
  }
}

export async function issueAdminBadge(
  userId: string,
  code: BadgeCode,
  options: { reason?: string; issuedBy?: string } = {},
  db: PrismaClient = defaultPrisma,
): Promise<void> {
  await ensureBadgeCatalog(db)
  const badge = await db.badge.findUnique({ where: { code } })
  if (!badge) throw new Error(`Badge not found: ${code}`)

  await db.userBadge.upsert({
    where: { userId_badgeId: { userId, badgeId: badge.id } },
    create: {
      userId,
      badgeId: badge.id,
      issuedBy: options.issuedBy ?? "admin",
      reason: options.reason ?? "Выдано модератором",
    },
    update: {
      issuedBy: options.issuedBy ?? "admin",
      reason: options.reason ?? "Выдано модератором",
      expiresAt: null,
    },
  })
}

export async function revokeUserBadge(
  userId: string,
  code: BadgeCode,
  db: PrismaClient = defaultPrisma,
): Promise<void> {
  const badge = await db.badge.findUnique({ where: { code } })
  if (!badge) return
  await db.userBadge.deleteMany({ where: { userId, badgeId: badge.id } })
}
