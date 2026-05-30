import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

const PACKAGES: Record<string, { days: number; name: string }> = {
  week: { days: 7, name: "7 дней" },
  month: { days: 30, name: "30 дней" },
}

const PACKAGE_PRICES: Record<string, number> = {
  week: 690,
  month: 1990,
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const plan = typeof body.plan === "string" && PACKAGES[body.plan] ? body.plan : "week"
    const pack = PACKAGES[plan]

    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
      select: { id: true, sellerId: true, status: true },
    })

    if (!listing) return NextResponse.json({ error: "Объявление не найдено" }, { status: 404 })
    if (listing.sellerId !== user.id && !["ADMIN", "MODERATOR"].includes(user.role)) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 })
    }
    if (listing.status !== "ACTIVE") {
      return NextResponse.json({ error: "Продвигать можно только активные объявления" }, { status: 400 })
    }

    const price = PACKAGE_PRICES[plan]
    const result = await prisma.$transaction(async (tx) => {
      const charge = await tx.user.updateMany({
        where: { id: user.id, walletBalance: { gte: price } },
        data: { walletBalance: { decrement: price } },
      })
      if (charge.count !== 1) {
        throw new Error("INSUFFICIENT_BALANCE")
      }

      const promotedUntil = new Date(Date.now() + pack.days * 24 * 60 * 60 * 1000)
      const updated = await tx.listing.update({
        where: { id: params.id },
        data: { isPromoted: true, promotedUntil },
        select: { id: true, isPromoted: true, promotedUntil: true },
      })

      const updatedUser = await tx.user.findUnique({
        where: { id: user.id },
        select: { walletBalance: true },
      })

      await tx.walletTransaction.create({
        data: {
          userId: user.id,
          type: "PROMOTION",
          amount: -price,
          balanceAfter: updatedUser?.walletBalance ?? 0,
          title: `Продвижение объявления на ${pack.name}`,
          listingId: params.id,
          metadata: { plan, days: pack.days },
        },
      })

      return { listing: updated, balance: updatedUser?.walletBalance ?? 0 }
    })

    return NextResponse.json({ ...result, plan: pack.name, price })
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_BALANCE") {
      return NextResponse.json({ error: "Недостаточно средств" }, { status: 402 })
    }
    console.error("listing promote error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}

