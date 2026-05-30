import { NextResponse } from "next/server"
import { computeUserRiskSignals } from "@/lib/admin/user-risk-signals"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { withAdminApi } from "@/lib/admin/guards"
import { writeAudit, AuditAction } from "@/lib/admin/audit"
import { extractIp, extractUA } from "@/lib/admin/getRequestMeta"
import { addUserTrustEvent, recalculateUserTrust } from "@/lib/user-trust-engine"
import { syncUserBadges } from "@/lib/badges/sync-user-badges"

export const dynamic = "force-dynamic"

const patchSchema = z.object({
  isBanned: z.boolean().optional(),
  isVerified: z.boolean().optional(),
})

export const GET = withAdminApi(async ({ req }) => {
  const id = req.nextUrl.pathname.split("/").at(-1) ?? ""

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        city: true,
        avatar: true,
        role: true,
        profileType: true,
        companyName: true,
        companyInn: true,
        isVerified: true,
        emailVerified: true,
        isBanned: true,
        walletBalance: true,
        rating: true,
        reviewCount: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        lastLoginIp: true,
        lastSeenAt: true,
        referralCode: true,
        vkId: true,
        yandexId: true,
        phoneVerifiedAt: true,
        emailVerifiedAt: true,
        profileHeadline: true,
        region: true,
        district: true,
        trustTier: true,
        accountRestricted: true,
        publicSlug: true,

        referralsMade: {
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true,
            status: true,
            createdAt: true,
            activatedAt: true,
            referredUser: {
              select: { id: true, name: true, phone: true, email: true, createdAt: true },
            },
          },
        },
        referralReceived: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            activatedAt: true,
            referrer: {
              select: { id: true, name: true, phone: true, email: true, referralCode: true },
            },
          },
        },

        // Listings summary
        listings: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            title: true,
            status: true,
            price: true,
            views: true,
            uniqueViews: true,
            rejectionReason: true,
            createdAt: true,
            category: { select: { nameRu: true } },
          },
        },

        // Sessions / devices
        sessions: {
          orderBy: { lastActiveAt: "desc" },
          take: 10,
          select: {
            id: true,
            device: true,
            userAgent: true,
            ip: true,
            lastActiveAt: true,
            expiresAt: true,
          },
        },

        // Payments
        payments: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            orderId: true,
            serviceType: true,
            amount: true,
            status: true,
            createdAt: true,
          },
        },

        // Wallet transactions
        walletTransactions: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            type: true,
            status: true,
            amount: true,
            balanceAfter: true,
            title: true,
            createdAt: true,
          },
        },

        // Reports filed against this user's listings
        _count: {
          select: {
            listings: true,
            reviews: true,
            favorites: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 })
    }

    // Reports on this user's listings
    const reports = await prisma.report.findMany({
      where: { listing: { sellerId: id } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        reason: true,
        comment: true,
        status: true,
        createdAt: true,
        listing: { select: { id: true, title: true } },
      },
    })

    // Moderation history for this user's listings
    const moderationLogs = await prisma.moderationLog.findMany({
      where: { listing: { sellerId: id } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        action: true,
        reason: true,
        createdAt: true,
        listing: { select: { id: true, title: true } },
        staff: { select: { id: true, login: true, displayName: true, role: true } },
        moderator: { select: { id: true, name: true, phone: true } },
      },
    })

    const [siteVisits, registrationVisit, sessionCount] = await Promise.all([
      prisma.siteVisit.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 40,
        select: {
          id: true,
          type: true,
          path: true,
          referrer: true,
          ip: true,
          userAgent: true,
          visitorId: true,
          createdAt: true,
        },
      }),
      prisma.siteVisit.findFirst({
        where: { userId: id, type: "REGISTRATION" },
        orderBy: { createdAt: "asc" },
        select: { path: true, ip: true, referrer: true, createdAt: true },
      }),
      prisma.session.count({ where: { userId: id } }),
    ])

    const uniqueVisitorIds = new Set(siteVisits.map((v) => v.visitorId).filter(Boolean)).size
    const riskSignals = computeUserRiskSignals({
      trustTier: user.trustTier,
      accountRestricted: user.accountRestricted,
      isBanned: user.isBanned,
      lastLoginIp: user.lastLoginIp,
      registrationIp: registrationVisit?.ip,
      siteVisitIps: siteVisits.map((v) => v.ip),
      sessionCount,
      uniqueVisitorIds,
    })

    return NextResponse.json({
      ok: true,
      user,
      reports,
      moderationLogs,
      siteVisits,
      registrationVisit,
      riskSignals,
    })
  } catch (error) {
    console.error("admin users [id] GET error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}, "users.viewSensitive")

export const PATCH = withAdminApi(async ({ staff, req }) => {
  const id = req.nextUrl.pathname.split("/").at(-1) ?? ""

  try {
    const body = patchSchema.parse(await req.json())

    const updated = await prisma.user.update({
      where: { id },
      data: body,
      select: { id: true, isBanned: true, isVerified: true },
    })

    if (body.isBanned !== undefined) {
      await writeAudit({
        actorId: staff.id,
        action: body.isBanned ? AuditAction.ADMIN_USER_BLOCKED : AuditAction.ADMIN_USER_UNBLOCKED,
        targetType: "User",
        targetId: id,
        metadata: { isBanned: body.isBanned },
        ip: extractIp(req),
        userAgent: extractUA(req),
      })
      void addUserTrustEvent(id, body.isBanned ? "ACCOUNT_BLOCKED" : "ACCOUNT_UNBLOCKED", {
        reason: "Изменение статуса в админке",
      }).catch(() => {})
      void recalculateUserTrust(id).catch(() => {})
      void syncUserBadges(id).catch(() => {})
    }

    return NextResponse.json({ ok: true, user: updated })
  } catch (error) {
    console.error("admin users [id] PATCH error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}, "users.ban")
