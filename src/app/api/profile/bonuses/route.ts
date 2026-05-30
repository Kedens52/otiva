import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  BONUS_REASON_LABELS,
  BONUS_SPEND_OFFERS,
  EARN_GUIDE,
  SPEND_GUIDE,
} from "@/lib/bonuses/rules"

export const dynamic = "force-dynamic"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const { ensureReferralCode } = await import("@/lib/bonuses/hooks")
  const referralCode = await ensureReferralCode(user.id, prisma)

  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { bonusBalance: true, bonusBlocked: true, referralCode: true },
  })

  const transactions = await prisma.bonusTransaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const bumpCost = BONUS_SPEND_OFFERS.BUMP_1D.points
  const balance = account?.bonusBalance ?? 0

  return NextResponse.json({
    balance,
    bonusBlocked: Boolean(account?.bonusBlocked),
    referralCode: account?.referralCode ?? referralCode,
    referralLink: `${(process.env.NEXT_PUBLIC_SITE_URL ?? "https://nashlo.ru").replace(/\/$/, "")}/register?ref=${encodeURIComponent(referralCode)}`,
    nextBump: {
      cost: bumpCost,
      missing: Math.max(0, bumpCost - balance),
      canAfford: balance >= bumpCost,
    },
    earnGuide: EARN_GUIDE,
    spendGuide: SPEND_GUIDE,
    spendOffers: Object.entries(BONUS_SPEND_OFFERS).map(([key, offer]) => ({
      key,
      title: SPEND_GUIDE.find((g) => g.service === offer.service)?.title ?? key,
      points: String(offer.points),
    })),
    transactions: transactions.map((t) => ({
      id: t.id,
      type: t.type,
      status: t.status,
      reason: t.reason,
      reasonLabel: BONUS_REASON_LABELS[t.reason],
      amount: t.amount,
      balanceAfter: t.balanceAfter,
      listingId: t.listingId,
      createdAt: t.createdAt.toISOString(),
    })),
  })
}
