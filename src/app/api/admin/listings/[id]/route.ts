import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminApi } from "@/lib/admin/guards"

export const dynamic = "force-dynamic"

export const GET = withAdminApi(async ({ req }) => {
  const id = req.nextUrl.pathname.split("/").at(-1) ?? ""

  try {
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            city: true,
            avatar: true,
            isVerified: true,
            isBanned: true,
            rating: true,
            reviewCount: true,
            createdAt: true,
            lastLoginAt: true,
            lastLoginIp: true,
            vkId: true,
            yandexId: true,
            phoneVerifiedAt: true,
            emailVerified: true,
          },
        },
        category: { select: { id: true, slug: true, nameRu: true } },
        moderationLogs: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            action: true,
            reason: true,
            createdAt: true,
            staff: { select: { id: true, login: true, displayName: true, role: true } },
            moderator: { select: { id: true, name: true, phone: true } },
          },
        },
        reports: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            reason: true,
            comment: true,
            status: true,
            createdAt: true,
          },
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            orderId: true,
            amount: true,
            status: true,
            serviceType: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            favorites: true,
            reports: true,
            conversations: true,
            listingViews: true,
          },
        },
      },
    })

    if (!listing) {
      return NextResponse.json({ error: "Объявление не найдено" }, { status: 404 })
    }

    return NextResponse.json({ ok: true, listing })
  } catch (error) {
    console.error("admin listing detail GET error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}, "listings.view")
