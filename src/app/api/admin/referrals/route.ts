import { NextResponse } from "next/server"
import type { Prisma, ReferralStatus } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { withAdminApi } from "@/lib/admin/guards"

export const dynamic = "force-dynamic"

const userSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  referralCode: true,
  createdAt: true,
} as const

export const GET = withAdminApi(async ({ req }) => {
  const { searchParams } = req.nextUrl
  const status = (searchParams.get("status") || "") as ReferralStatus | ""
  const referrerId = searchParams.get("referrerId")?.trim() || undefined
  const referredUserId = searchParams.get("referredUserId")?.trim() || undefined
  const q = searchParams.get("q")?.trim() || undefined
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
  const take = Math.min(100, Math.max(10, parseInt(searchParams.get("take") || "50", 10)))

  const where: Prisma.ReferralWhereInput = {}
  if (status && ["PENDING", "ACTIVE", "REJECTED"].includes(status)) {
    where.status = status
  }
  if (referrerId) where.referrerId = referrerId
  if (referredUserId) where.referredUserId = referredUserId

  if (q) {
    where.OR = [
      { referrer: { referralCode: { contains: q, mode: "insensitive" } } },
      { referrer: { name: { contains: q, mode: "insensitive" } } },
      { referrer: { phone: { contains: q } } },
      { referrer: { email: { contains: q, mode: "insensitive" } } },
      { referredUser: { name: { contains: q, mode: "insensitive" } } },
      { referredUser: { phone: { contains: q } } },
      { referredUser: { email: { contains: q, mode: "insensitive" } } },
    ]
  }

  const [items, total, stats] = await Promise.all([
    prisma.referral.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * take,
      take,
      include: {
        referrer: { select: userSelect },
        referredUser: { select: userSelect },
      },
    }),
    prisma.referral.count({ where }),
    prisma.referral.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ])

  const statusCounts = { PENDING: 0, ACTIVE: 0, REJECTED: 0, total: 0 }
  for (const row of stats) {
    statusCounts[row.status] = row._count._all
    statusCounts.total += row._count._all
  }

  return NextResponse.json({
    ok: true,
    items: items.map((r) => ({
      id: r.id,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      activatedAt: r.activatedAt?.toISOString() ?? null,
      referrer: r.referrer,
      referredUser: r.referredUser,
    })),
    total,
    page,
    take,
    stats: statusCounts,
  })
}, "users.view")
