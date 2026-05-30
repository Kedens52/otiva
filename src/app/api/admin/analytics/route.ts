import { NextResponse } from "next/server"
import { CookieConsentChoice } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { withAdminApi } from "@/lib/admin/guards"

export const dynamic = "force-dynamic"

async function safeVisitQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    console.warn("SiteVisit analytics unavailable:", error)
    return fallback
  }
}

async function countUniqueVisitors(since: Date) {
  const rows = await prisma.siteVisit.groupBy({
    by: ["visitorId"],
    where: { type: "PAGE_VIEW", createdAt: { gte: since } },
  })
  return rows.length
}

export const GET = withAdminApi(async (): Promise<NextResponse> => {
  try {
    const now = new Date()
    const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const [
      totalUsers,
      newUsers30,
      newUsers7,
      newUsersToday,
      totalListings,
      activeListings,
      moderationListings,
      soldListings,
      newListingsToday,
      newListings7,
      byCategory,
      byCity,
      pageViewsToday,
      pageViews7,
      pageViews30,
      registrationsLoggedToday,
      registrationsLogged7,
      loginsLoggedToday,
      loginsLogged7,
      uniqueVisitorsToday,
      uniqueVisitors7,
      uniqueVisitors30,
      topPaths,
      recentVisits,
      cookieAcceptedToday,
      cookieAccepted7,
      cookieRejectedToday,
      cookieRejected7,
      cookieAccepted30,
      cookieRejected30,
      recentCookieChoices,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: last30 } } }),
      prisma.user.count({ where: { createdAt: { gte: last7 } } }),
      prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.listing.count(),
      prisma.listing.count({ where: { status: "ACTIVE" } }),
      prisma.listing.count({ where: { status: "MODERATION" } }),
      prisma.listing.count({ where: { status: "SOLD" } }),
      prisma.listing.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.listing.count({ where: { createdAt: { gte: last7 } } }),
      prisma.listing.groupBy({
        by: ["categoryId"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 6,
      }),
      prisma.listing.groupBy({
        by: ["city"],
        where: { city: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 6,
      }),
      safeVisitQuery(
        () => prisma.siteVisit.count({ where: { type: "PAGE_VIEW", createdAt: { gte: todayStart } } }),
        0,
      ),
      safeVisitQuery(
        () => prisma.siteVisit.count({ where: { type: "PAGE_VIEW", createdAt: { gte: last7 } } }),
        0,
      ),
      safeVisitQuery(
        () => prisma.siteVisit.count({ where: { type: "PAGE_VIEW", createdAt: { gte: last30 } } }),
        0,
      ),
      safeVisitQuery(
        () => prisma.siteVisit.count({ where: { type: "REGISTRATION", createdAt: { gte: todayStart } } }),
        0,
      ),
      safeVisitQuery(
        () => prisma.siteVisit.count({ where: { type: "REGISTRATION", createdAt: { gte: last7 } } }),
        0,
      ),
      safeVisitQuery(
        () => prisma.siteVisit.count({ where: { type: "LOGIN", createdAt: { gte: todayStart } } }),
        0,
      ),
      safeVisitQuery(
        () => prisma.siteVisit.count({ where: { type: "LOGIN", createdAt: { gte: last7 } } }),
        0,
      ),
      safeVisitQuery(() => countUniqueVisitors(todayStart), 0),
      safeVisitQuery(() => countUniqueVisitors(last7), 0),
      safeVisitQuery(() => countUniqueVisitors(last30), 0),
      safeVisitQuery(
        () =>
          prisma.siteVisit.groupBy({
            by: ["path"],
            where: { type: "PAGE_VIEW", createdAt: { gte: last7 } },
            _count: { id: true },
            orderBy: { _count: { id: "desc" } },
            take: 12,
          }),
        [],
      ),
      safeVisitQuery(
        () =>
          prisma.siteVisit.findMany({
            take: 60,
            orderBy: { createdAt: "desc" },
            include: {
              user: {
                select: { id: true, name: true, phone: true, email: true },
              },
            },
          }),
        [],
      ),
      safeVisitQuery(
        () =>
          prisma.cookieConsentEvent.count({
            where: {
              choice: CookieConsentChoice.ANALYTICS_ACCEPTED,
              createdAt: { gte: todayStart },
            },
          }),
        0,
      ),
      safeVisitQuery(
        () =>
          prisma.cookieConsentEvent.count({
            where: {
              choice: CookieConsentChoice.ANALYTICS_ACCEPTED,
              createdAt: { gte: last7 },
            },
          }),
        0,
      ),
      safeVisitQuery(
        () =>
          prisma.cookieConsentEvent.count({
            where: {
              choice: CookieConsentChoice.ESSENTIAL_ONLY,
              createdAt: { gte: todayStart },
            },
          }),
        0,
      ),
      safeVisitQuery(
        () =>
          prisma.cookieConsentEvent.count({
            where: {
              choice: CookieConsentChoice.ESSENTIAL_ONLY,
              createdAt: { gte: last7 },
            },
          }),
        0,
      ),
      safeVisitQuery(
        () =>
          prisma.cookieConsentEvent.count({
            where: {
              choice: CookieConsentChoice.ANALYTICS_ACCEPTED,
              createdAt: { gte: last30 },
            },
          }),
        0,
      ),
      safeVisitQuery(
        () =>
          prisma.cookieConsentEvent.count({
            where: {
              choice: CookieConsentChoice.ESSENTIAL_ONLY,
              createdAt: { gte: last30 },
            },
          }),
        0,
      ),
      safeVisitQuery(
        () =>
          prisma.cookieConsentEvent.findMany({
            take: 40,
            orderBy: { createdAt: "desc" },
            include: {
              user: { select: { id: true, name: true, phone: true, email: true } },
            },
          }),
        [],
      ),
    ])

    const categoryIds = byCategory.map((r) => r.categoryId).filter(Boolean) as string[]
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, nameRu: true },
    })
    const catMap = Object.fromEntries(categories.map((c) => [c.id, c.nameRu]))

    return NextResponse.json({
      users: { total: totalUsers, newLast30Days: newUsers30, newLast7Days: newUsers7, newToday: newUsersToday },
      listings: {
        total: totalListings,
        active: activeListings,
        pendingModeration: moderationListings,
        sold: soldListings,
        newToday: newListingsToday,
        newLast7Days: newListings7,
      },
      traffic: {
        pageViewsToday,
        pageViews7Days: pageViews7,
        pageViews30Days: pageViews30,
        uniqueVisitorsToday,
        uniqueVisitors7Days: uniqueVisitors7,
        uniqueVisitors30Days: uniqueVisitors30,
        registrationsToday: registrationsLoggedToday,
        registrations7Days: registrationsLogged7,
        loginsToday: loginsLoggedToday,
        logins7Days: loginsLogged7,
      },
      topPaths: topPaths.map((r) => ({ path: r.path, count: r._count.id })),
      recentVisits: recentVisits.map((v) => ({
        id: v.id,
        type: v.type,
        path: v.path,
        referrer: v.referrer,
        createdAt: v.createdAt.toISOString(),
        visitorId: v.visitorId,
        userId: v.userId,
        userLabel:
          v.user?.name ||
          v.user?.phone ||
          v.user?.email ||
          (v.userId ? `ID ${v.userId.slice(0, 8)}` : null),
        ip: v.ip,
      })),
      byCategory: byCategory.map((r) => ({
        category: catMap[r.categoryId ?? ""] ?? "Другое",
        count: r._count.id,
      })),
      byCity: byCity
        .filter((r) => r.city)
        .map((r) => ({ city: r.city!, count: r._count.id })),
      cookieConsent: {
        acceptedToday: cookieAcceptedToday,
        accepted7Days: cookieAccepted7,
        rejectedToday: cookieRejectedToday,
        rejected7Days: cookieRejected7,
        accepted30Days: cookieAccepted30,
        rejected30Days: cookieRejected30,
        acceptanceRate7Days:
          cookieAccepted7 + cookieRejected7 > 0
            ? Math.round((cookieAccepted7 / (cookieAccepted7 + cookieRejected7)) * 100)
            : null,
        recent: recentCookieChoices.map((e) => ({
          id: e.id,
          choice: e.choice,
          source: e.source,
          createdAt: e.createdAt.toISOString(),
          userLabel:
            e.user?.name ||
            e.user?.phone ||
            e.user?.email ||
            (e.userId ? `ID ${e.userId.slice(0, 8)}` : null),
        })),
      },
    })
  } catch (error) {
    console.error("analytics GET error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}, "dashboard.view")
