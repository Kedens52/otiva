import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"

const ADMIN_COOKIE = "nashlo_admin_session"

function adminToken() {
  if (process.env.NASHLO_ADMIN_TOKEN) return process.env.NASHLO_ADMIN_TOKEN
  if (process.env.NODE_ENV === "production") return null
  return "nashlo-local-developer"
}

function isAuthed() {
  const cookieStore = cookies()
  const token = cookieStore.get(ADMIN_COOKIE)?.value
  const expected = adminToken()
  return expected && token === expected
}

export async function GET() {
  if (!isAuthed()) return NextResponse.json({ error: "Нет доступа" }, { status: 403 })

  try {
    const now = new Date()
    const last30     = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const last7      = new Date(now.getTime() -  7 * 24 * 60 * 60 * 1000)
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
    ])

    // Resolve category names
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
      byCategory: byCategory.map((r) => ({
        category: catMap[r.categoryId ?? ""] ?? "Другое",
        count: r._count.id,
      })),
      byCity: byCity
        .filter((r) => r.city)
        .map((r) => ({ city: r.city!, count: r._count.id })),
    })
  } catch (error) {
    console.error("analytics GET error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
