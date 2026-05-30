import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ensureBadgeCatalog, syncUserBadges } from "@/lib/badges/sync-user-badges"

export const dynamic = "force-dynamic"
export const maxDuration = 300

/**
 * Ежедневное обновление значков доверия.
 * POST с Authorization: Bearer $CRON_SECRET
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get("authorization")
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await ensureBadgeCatalog(prisma).catch(() => {})

  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { lastSeenAt: { gte: since } },
        { lastLoginAt: { gte: since } },
        { updatedAt: { gte: since } },
        { premiumUntil: { gte: new Date() } },
      ],
    },
    select: { id: true },
    take: 5000,
    orderBy: { updatedAt: "desc" },
  })

  let ok = 0
  for (const u of users) {
    try {
      await syncUserBadges(u.id)
      ok++
    } catch {
      /* continue batch */
    }
  }

  return NextResponse.json({ ok: true, processed: ok, scanned: users.length })
}
