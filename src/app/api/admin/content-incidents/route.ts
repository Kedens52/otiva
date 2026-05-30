import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminApi } from "@/lib/admin/guards"

export const dynamic = "force-dynamic"

export const GET = withAdminApi(async ({ req }) => {
  try {
    const status = req.nextUrl.searchParams.get("status") ?? "pending"
    const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 50), 100)

    const items = await prisma.contentModerationIncident.findMany({
      where: status === "all" ? undefined : { status },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            trustTier: true,
            isBanned: true,
          },
        },
        listing: {
          select: { id: true, title: true, status: true },
        },
        wantToBuy: {
          select: { id: true, title: true, status: true },
        },
      },
    })

    return NextResponse.json({
      items: items.map((row) => ({
        ...row,
        matchedRules: Array.isArray(row.matchedRules) ? row.matchedRules : null,
        createdAt: row.createdAt.toISOString(),
        reviewedAt: row.reviewedAt?.toISOString() ?? null,
      })),
    })
  } catch (error) {
    console.error("admin content-incidents GET:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}, "listings.moderate")
