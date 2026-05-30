import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminApi } from "@/lib/admin/guards"

export const dynamic = "force-dynamic"

export const GET = withAdminApi(async ({ req }) => {
  const id = req.nextUrl.pathname.split("/").pop()
  if (!id) {
    return NextResponse.json({ error: "Не указан id" }, { status: 400 })
  }

  try {
    const item = await prisma.wantToBuy.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            city: true,
            email: true,
            phoneVerifiedAt: true,
            isBanned: true,
          },
        },
        category: { select: { slug: true, nameRu: true } },
        offers: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            seller: { select: { id: true, name: true, phone: true } },
            listing: { select: { id: true, title: true, status: true } },
          },
        },
        _count: { select: { offers: true } },
      },
    })

    if (!item) {
      return NextResponse.json({ error: "Не найдено" }, { status: 404 })
    }

    return NextResponse.json({ ok: true, item })
  } catch (error) {
    console.error("admin want-to-buy detail GET error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}, "listings.view")
