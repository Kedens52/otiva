import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import type { BadgeCode } from "@prisma/client"
import { withAdminApi } from "@/lib/admin/guards"
import { resolveBadgeIcon } from "@/lib/badges/badge-map"
import { issueAdminBadge, revokeUserBadge, syncUserBadges } from "@/lib/badges/sync-user-badges"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const issueSchema = z.object({
  action: z.enum(["issue", "revoke", "sync"]),
  code: z.enum(["BEGINNER", "FIRST_STEP", "VERIFIED", "ACTIVE", "TRUSTED", "PRO", "SAFE_DEAL", "PREMIUM"]).optional(),
  reason: z.string().max(500).optional(),
})

export const GET = withAdminApi(async ({ req }) => {
  const id = req.nextUrl.pathname.split("/").slice(-2)[0] ?? ""

  const rows = await prisma.userBadge.findMany({
    where: { userId: id },
    include: { badge: true },
    orderBy: { issuedAt: "desc" },
  })

  return NextResponse.json({
    badges: rows.map((row) => ({
      id: row.id,
      code: row.badge.code,
      title: row.badge.title,
      subtitle: row.badge.subtitle,
      icon: resolveBadgeIcon(row.badge.code, row.badge.icon),
      priority: row.badge.priority,
      issuedAt: row.issuedAt,
      expiresAt: row.expiresAt,
      issuedBy: row.issuedBy,
      reason: row.reason,
    })),
  })
})

export const POST = withAdminApi(async ({ req, staff }) => {
  const id = req.nextUrl.pathname.split("/").slice(-2)[0] ?? ""
  const body = issueSchema.parse(await req.json())

  if (body.action === "sync") {
    await syncUserBadges(id)
    return NextResponse.json({ ok: true })
  }

  if (!body.code) {
    return NextResponse.json({ error: "Укажите code" }, { status: 400 })
  }

  const code = body.code as BadgeCode

  if (body.action === "issue") {
    if (code === "PRO") {
      await prisma.user.update({
        where: { id },
        data: { manuallyVerified: true },
      })
    }
    await issueAdminBadge(id, code, {
      reason: body.reason ?? `Выдано: ${staff?.displayName ?? staff?.login ?? "admin"}`,
      issuedBy: "admin",
    })
    const badges = await prisma.userBadge.findMany({
      where: { userId: id },
      include: { badge: true },
    })
    return NextResponse.json({ ok: true, count: badges.length })
  }

  if (body.action === "revoke") {
    if (code === "PRO") {
      await prisma.user.update({
        where: { id },
        data: { manuallyVerified: false },
      })
    }
    await revokeUserBadge(id, code)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
})
