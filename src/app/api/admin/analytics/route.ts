import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || !['ADMIN', 'MODERATOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
    }

    const now = new Date()
    const last30days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const last7days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalUsers,
      newUsersLast30,
      totalListings,
      activeListings,
      pendingModeration,
      soldListings,
      totalMessages,
      messagesLast7,
      listingsByCategory,
      listingsByCity,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: last30days } } }),
      prisma.listing.count(),
      prisma.listing.count({ where: { status: 'ACTIVE' } }),
      prisma.listing.count({ where: { status: 'MODERATION' } }),
      prisma.listing.count({ where: { status: 'SOLD' } }),
      prisma.message.count(),
      prisma.message.count({ where: { createdAt: { gte: last7days } } }),
      prisma.listing.groupBy({
        by: ['categoryId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 8,
      }),
      prisma.listing.groupBy({
        by: ['city'],
        _count: { id: true },
        where: { city: { not: null } },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ])

    // Resolve category names
    const categories = await prisma.category.findMany({
      where: { id: { in: listingsByCategory.map((l) => l.categoryId) } },
      select: { id: true, nameRu: true },
    })
    const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.nameRu]))

    return NextResponse.json({
      users: {
        total: totalUsers,
        newLast30Days: newUsersLast30,
      },
      listings: {
        total: totalListings,
        active: activeListings,
        pendingModeration,
        sold: soldListings,
      },
      messages: {
        total: totalMessages,
        last7Days: messagesLast7,
      },
      byCategory: listingsByCategory.map((item) => ({
        category: categoryMap[item.categoryId] || item.categoryId,
        count: item._count.id,
      })),
      byCity: listingsByCity.map((item) => ({
        city: item.city || 'Не указан',
        count: item._count.id,
      })),
    })
  } catch (error) {
    console.error('analytics error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
