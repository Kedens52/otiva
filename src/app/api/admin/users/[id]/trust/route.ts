import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminApi } from "@/lib/admin/guards"

export const dynamic = "force-dynamic"

function userIdFromPath(pathname: string): string | null {
  const m = pathname.match(/\/api\/admin\/users\/([^/]+)\/trust$/)
  return m?.[1] ?? null
}

export const GET = withAdminApi(async ({ req }) => {
  const id = userIdFromPath(req.nextUrl.pathname)
  if (!id) return NextResponse.json({ error: "Неверный путь" }, { status: 400 })

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        createdAt: true,
        phone: true,
        phoneVerifiedAt: true,
        email: true,
        emailVerified: true,
        internalTrustScore: true,
        riskPenaltyScore: true,
        trustTier: true,
        trustReasons: true,
        riskReasons: true,
        lastTrustCalculatedAt: true,
        accountRestricted: true,
        updatedAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            listings: true,
            sentMessages: true,
          },
        },
      },
    })
    if (!user) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 })

    const since30 = new Date(Date.now() - 30 * 86400000)
    const [
      reports30d,
      rejectedListings,
      dupTitleGroups,
      activeListings,
      lastMessage,
      recentEvents,
    ] = await Promise.all([
      prisma.report.count({
        where: {
          createdAt: { gte: since30 },
          OR: [{ listing: { sellerId: id } }, { targetUserId: id }],
        },
      }),
      prisma.listing.count({ where: { sellerId: id, status: "REJECTED" } }),
      prisma.listing.groupBy({
        by: ["title"],
        where: { sellerId: id, status: { notIn: ["ARCHIVED", "SOLD"] } },
        _count: { title: true },
      }),
      prisma.listing.count({
        where: { sellerId: id, status: { in: ["ACTIVE", "MODERATION"] } },
      }),
      prisma.message.findFirst({
        where: { senderId: id },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      prisma.userTrustEvent.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 25,
        select: { id: true, type: true, scoreDelta: true, reason: true, createdAt: true },
      }),
    ])

    const duplicateTitles = dupTitleGroups.filter((g) => g._count.title >= 2).length

    return NextResponse.json({
      ok: true,
      trust: {
        trustScore: Math.round(user.internalTrustScore),
        riskScore: Math.round(user.riskPenaltyScore),
        accountLevel: user.trustTier,
        trustReasons: user.trustReasons,
        riskReasons: user.riskReasons,
        lastCalculatedAt: user.lastTrustCalculatedAt,
        accountRestricted: user.accountRestricted,
        registeredAt: user.createdAt,
        phoneVerified: Boolean(user.phoneVerifiedAt),
        emailVerified: user.emailVerified,
        activeListings,
        totalListings: user._count.listings,
        messagesTotal: user._count.sentMessages,
        reportsLast30d: reports30d,
        rejectedListings,
        duplicateListingGroups: duplicateTitles,
        lastUserActionAt: user.lastLoginAt ?? user.updatedAt,
        lastOutgoingMessageAt: lastMessage?.createdAt ?? null,
        recentEvents,
      },
    })
  } catch (e) {
    console.error("admin trust GET", e)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}, "users.viewSensitive")
