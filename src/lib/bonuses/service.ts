import type {
  BonusReason,
  BonusTransactionStatus,
  BonusTransactionType,
  Prisma,
  PrismaClient,
} from "@prisma/client"
import { prisma as defaultPrisma } from "@/lib/prisma"
import { BONUS_AMOUNTS, BONUS_LIMITS } from "@/lib/bonuses/rules"

export type AwardBonusInput = {
  userId: string
  reason: BonusReason
  amount?: number
  referenceKey?: string | null
  listingId?: string | null
  status?: BonusTransactionStatus
  metadata?: Prisma.InputJsonValue
}

export type AwardResult =
  | { ok: true; transactionId: string; amount: number; balanceAfter: number }
  | { ok: false; code: string; message: string }

function startOfDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function startOfWeek(d = new Date()) {
  const day = d.getDay()
  const diff = day === 0 ? 6 : day - 1
  const monday = new Date(d)
  monday.setDate(d.getDate() - diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

async function earnedInPeriod(
  db: PrismaClient,
  userId: string,
  since: Date,
): Promise<number> {
  const rows = await db.bonusTransaction.findMany({
    where: {
      userId,
      type: "EARN",
      status: "APPROVED",
      createdAt: { gte: since },
      amount: { gt: 0 },
    },
    select: { amount: true },
  })
  return rows.reduce((s, r) => s + r.amount, 0)
}

export async function canEarnMore(
  db: PrismaClient,
  userId: string,
  addAmount: number,
): Promise<{ ok: boolean; message?: string }> {
  const dayEarned = await earnedInPeriod(db, userId, startOfDay())
  if (dayEarned + addAmount > BONUS_LIMITS.dailyEarnCap) {
    return { ok: false, message: "Достигнут дневной лимит баллов" }
  }
  const weekEarned = await earnedInPeriod(db, userId, startOfWeek())
  if (weekEarned + addAmount > BONUS_LIMITS.weeklyEarnCap) {
    return { ok: false, message: "Достигнут недельный лимит баллов" }
  }
  return { ok: true }
}

export async function awardBonus(
  input: AwardBonusInput,
  db: PrismaClient = defaultPrisma,
): Promise<AwardResult> {
  const amount = input.amount ?? BONUS_AMOUNTS[input.reason]
  if (!amount || amount <= 0) {
    return { ok: false, code: "ZERO_AMOUNT", message: "Нулевое начисление" }
  }

  const user = await db.user.findUnique({
    where: { id: input.userId },
    select: { bonusBalance: true, bonusBlocked: true, isBanned: true },
  })
  if (!user || user.isBanned) {
    return { ok: false, code: "USER_BLOCKED", message: "Пользователь недоступен" }
  }
  if (user.bonusBlocked) {
    return { ok: false, code: "BONUS_BLOCKED", message: "Бонусная активность ограничена" }
  }

  const status = input.status ?? "APPROVED"
  if (status === "APPROVED") {
    const cap = await canEarnMore(db, input.userId, amount)
    if (!cap.ok) return { ok: false, code: "LIMIT", message: cap.message ?? "Лимит" }
  }

  const refKey = input.referenceKey ?? `once:${input.reason}`

  try {
    const result = await db.$transaction(async (tx) => {
      const existing = await tx.bonusTransaction.findUnique({
        where: {
          userId_reason_referenceKey: {
            userId: input.userId,
            reason: input.reason,
            referenceKey: refKey,
          },
        },
      })
      if (existing && existing.status !== "REJECTED") {
        return null
      }

      let balanceAfter = user.bonusBalance
      if (status === "APPROVED") {
        const updated = await tx.user.update({
          where: { id: input.userId },
          data: { bonusBalance: { increment: amount } },
          select: { bonusBalance: true },
        })
        balanceAfter = updated.bonusBalance
      }

      const row = await tx.bonusTransaction.create({
        data: {
          userId: input.userId,
          type: "EARN",
          status,
          reason: input.reason,
          amount,
          balanceAfter,
          referenceKey: refKey,
          listingId: input.listingId ?? null,
          metadata: input.metadata,
        },
      })
      return row
    })

    if (!result) {
      return { ok: false, code: "DUPLICATE", message: "Уже начислено" }
    }

    return {
      ok: true,
      transactionId: result.id,
      amount,
      balanceAfter: result.balanceAfter,
    }
  } catch (e) {
    console.error("[bonuses] awardBonus", e)
    return { ok: false, code: "ERROR", message: "Ошибка начисления" }
  }
}

export async function spendBonus(
  userId: string,
  reason: BonusReason,
  points: number,
  referenceKey: string,
  listingId?: string,
  db: PrismaClient = defaultPrisma,
): Promise<AwardResult> {
  if (points <= 0) {
    return { ok: false, code: "INVALID", message: "Некорректная сумма" }
  }

  const dup = await db.bonusTransaction.findUnique({
    where: {
      userId_reason_referenceKey: { userId, reason, referenceKey },
    },
  })
  if (dup) {
    return { ok: false, code: "DUPLICATE", message: "Уже списано" }
  }

  try {
    const row = await db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { bonusBalance: true, bonusBlocked: true, isBanned: true },
      })
      if (!user || user.isBanned || user.bonusBlocked) return null
      if (user.bonusBalance < points) return null

      const updated = await tx.user.update({
        where: { id: userId },
        data: { bonusBalance: { decrement: points } },
        select: { bonusBalance: true },
      })

      return tx.bonusTransaction.create({
        data: {
          userId,
          type: "SPEND",
          status: "APPROVED",
          reason,
          amount: -points,
          balanceAfter: updated.bonusBalance,
          referenceKey,
          listingId: listingId ?? null,
        },
      })
    })

    if (!row) {
      return { ok: false, code: "INSUFFICIENT", message: "Недостаточно баллов" }
    }

    return {
      ok: true,
      transactionId: row.id,
      amount: -points,
      balanceAfter: row.balanceAfter,
    }
  } catch (e) {
    console.error("[bonuses] spendBonus", e)
    return { ok: false, code: "ERROR", message: "Ошибка списания" }
  }
}

export async function reverseBonusTransaction(
  transactionId: string,
  db: PrismaClient = defaultPrisma,
): Promise<boolean> {
  const tx = await db.bonusTransaction.findUnique({ where: { id: transactionId } })
  if (!tx || tx.status === "REVERSED") return false

  await db.$transaction(async (inner) => {
    const delta = -tx.amount
    const updated = await inner.user.update({
      where: { id: tx.userId },
      data: { bonusBalance: { increment: delta } },
      select: { bonusBalance: true },
    })
    await inner.bonusTransaction.update({
      where: { id: transactionId },
      data: { status: "REVERSED" },
    })
    await inner.bonusTransaction.create({
      data: {
        userId: tx.userId,
        type: "REVERSAL",
        status: "APPROVED",
        reason: "REVERSAL",
        amount: delta,
        balanceAfter: updated.bonusBalance,
        referenceKey: `reversal:${transactionId}`,
        listingId: tx.listingId,
        metadata: { reversedId: transactionId },
      },
    })
  })
  return true
}

export async function adminAdjustBonus(
  userId: string,
  amount: number,
  note?: string,
  db: PrismaClient = defaultPrisma,
): Promise<AwardResult> {
  if (!amount || amount === 0) {
    return { ok: false, code: "ZERO", message: "Укажите ненулевую сумму" }
  }

  const refKey = `admin:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`

  if (amount > 0) {
    return awardBonus({
      userId,
      reason: "ADMIN_ADJUST",
      amount,
      referenceKey: refKey,
      metadata: note ? { note } : undefined,
    }, db)
  }

  const points = Math.abs(amount)
  return spendBonus(userId, "ADMIN_ADJUST", points, refKey, undefined, db)
}

export async function setBonusTransactionStatus(
  transactionId: string,
  action: "approve" | "reject" | "reverse",
  db: PrismaClient = defaultPrisma,
): Promise<{ ok: boolean; message?: string }> {
  const tx = await db.bonusTransaction.findUnique({ where: { id: transactionId } })
  if (!tx) return { ok: false, message: "Не найдено" }

  if (action === "reverse") {
    const ok = await reverseBonusTransaction(transactionId, db)
    return ok ? { ok: true } : { ok: false, message: "Не удалось отменить" }
  }

  if (action === "reject") {
    if (tx.status === "REJECTED") return { ok: true }
    await db.bonusTransaction.update({
      where: { id: transactionId },
      data: { status: "REJECTED" },
    })
    return { ok: true }
  }

  if (action === "approve") {
    if (tx.status !== "PENDING" || tx.type !== "EARN") {
      return { ok: false, message: "Нельзя одобрить эту операцию" }
    }
    const cap = await canEarnMore(db, tx.userId, tx.amount)
    if (!cap.ok) return { ok: false, message: cap.message }

    await db.$transaction(async (inner) => {
      const updated = await inner.user.update({
        where: { id: tx.userId },
        data: { bonusBalance: { increment: tx.amount } },
        select: { bonusBalance: true },
      })
      await inner.bonusTransaction.update({
        where: { id: transactionId },
        data: { status: "APPROVED", balanceAfter: updated.bonusBalance },
      })
    })
    return { ok: true }
  }

  return { ok: false, message: "Неизвестное действие" }
}

export async function setUserBonusBlocked(
  userId: string,
  blocked: boolean,
  db: PrismaClient = defaultPrisma,
): Promise<void> {
  await db.user.update({ where: { id: userId }, data: { bonusBlocked: blocked } })
}
