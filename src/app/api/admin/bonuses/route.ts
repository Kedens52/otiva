import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { withAdminApi } from "@/lib/admin/guards"
import { adminAdjustBonus, setUserBonusBlocked } from "@/lib/bonuses/service"
import { BONUS_REASON_LABELS } from "@/lib/bonuses/rules"

export const dynamic = "force-dynamic"

export const GET = withAdminApi(async ({ req }) => {
  const { searchParams } = req.nextUrl
  const userId = searchParams.get("userId") || undefined
  const status = searchParams.get("status") || undefined
  const reason = searchParams.get("reason") || undefined
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
  const take = 50

  const where: Record<string, unknown> = {}
  if (userId) where.userId = userId
  if (status) where.status = status
  if (reason) where.reason = reason

  const [items, total] = await Promise.all([
    prisma.bonusTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * take,
      take,
      include: {
        user: { select: { id: true, name: true, phone: true, bonusBalance: true, bonusBlocked: true } },
      },
    }),
    prisma.bonusTransaction.count({ where }),
  ])

  return NextResponse.json({
    ok: true,
    items: items.map((t) => ({
      ...t,
      reasonLabel: BONUS_REASON_LABELS[t.reason],
      createdAt: t.createdAt.toISOString(),
    })),
    total,
    page,
  })
}, "users.view")

const adjustSchema = z.object({
  userId: z.string().min(1),
  amount: z.number().int().refine((n) => n !== 0, "amount must be non-zero"),
  note: z.string().max(500).optional(),
  bonusBlocked: z.boolean().optional(),
})

export const POST = withAdminApi(async ({ req }) => {
  const body = adjustSchema.parse(await req.json())

  if (body.bonusBlocked !== undefined) {
    await setUserBonusBlocked(body.userId, body.bonusBlocked)
  }

  const result = await adminAdjustBonus(body.userId, body.amount, body.note)
  if (!result.ok) {
    return NextResponse.json({ error: result.message, code: result.code }, { status: 400 })
  }

  return NextResponse.json({
    ok: true,
    transactionId: result.transactionId,
    balanceAfter: result.balanceAfter,
  })
}, "users.view")
