import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminApi } from "@/lib/admin/guards"

export const dynamic = "force-dynamic"

export const GET = withAdminApi(async ({ req }) => {
  const { searchParams } = req.nextUrl
  const status = searchParams.get("status") || ""
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
  const take = 50

  const where = status ? { status } : {}

  const [items, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * take,
      take,
      include: {
        user: { select: { id: true, name: true, phone: true } },
        listing: { select: { id: true, title: true } },
      },
    }),
    prisma.payment.count({ where }),
  ])

  return NextResponse.json({ ok: true, items, total, page })
}, "payments.view")
