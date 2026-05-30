import type { PrismaClient, SharePlatform } from "@prisma/client"
import { calculateProfileCompleteness } from "@/lib/badges/profile-completeness"
import { awardBonus } from "@/lib/bonuses/service"
import { BONUS_LIMITS } from "@/lib/bonuses/rules"
import { isQualityListing } from "@/lib/bonuses/quality"

export async function tryWelcomeBonus(userId: string, db: PrismaClient) {
  await awardBonus({ userId, reason: "WELCOME", referenceKey: "once:WELCOME" }, db)
}

export async function tryPhoneVerifiedBonus(userId: string, db: PrismaClient) {
  await awardBonus({ userId, reason: "PHONE_VERIFIED", referenceKey: "once:PHONE_VERIFIED" }, db)
}

export async function tryProfileBonuses(
  user: {
    id: string
    name?: string | null
    phone?: string | null
    phoneVerifiedAt?: Date | null
    email?: string | null
    emailVerified?: boolean | null
    avatar?: string | null
    city?: string | null
    description?: string | null
  },
  db: PrismaClient,
) {
  if (user.avatar?.trim()) {
    await awardBonus({ userId: user.id, reason: "AVATAR_ADDED", referenceKey: "once:AVATAR_ADDED" }, db)
  }
  const completeness = calculateProfileCompleteness(user)
  if (completeness.isComplete) {
    await awardBonus({
      userId: user.id,
      reason: "PROFILE_COMPLETE",
      referenceKey: "once:PROFILE_COMPLETE",
    }, db)
  }
}

export async function tryListingBonuses(
  listing: {
    id: string
    sellerId: string
    title: string
    description: string
    images: string[]
    status: string
  },
  db: PrismaClient,
) {
  if (!isQualityListing(listing)) return

  const today = new Date().toISOString().slice(0, 10)
  const dayCount = await db.bonusTransaction.count({
    where: {
      userId: listing.sellerId,
      reason: "QUALITY_LISTING",
      createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    },
  })
  if (dayCount < BONUS_LIMITS.qualityListingsPerDay) {
    await awardBonus({
      userId: listing.sellerId,
      reason: "QUALITY_LISTING",
      referenceKey: `listing:${listing.id}`,
      listingId: listing.id,
    }, db)
  }

  await awardBonus({
    userId: listing.sellerId,
    reason: "FIRST_QUALITY_LISTING",
    referenceKey: "once:FIRST_QUALITY_LISTING",
    listingId: listing.id,
  }, db)

  void tryReferralActiveBonus(listing.sellerId, listing, db).catch(() => {})
}

export async function recordShareBonus(
  userId: string,
  listingId: string,
  platform: SharePlatform,
  db: PrismaClient,
): Promise<{ ok: boolean; message?: string; points?: number }> {
  const reason = platform === "VK" ? "SHARE_VK" : "SHARE_MAX"
  const weekAgo = new Date(Date.now() - 7 * 86400000)

  const weekShares = await db.bonusShareEvent.count({
    where: { userId, createdAt: { gte: weekAgo } },
  })
  if (weekShares >= BONUS_LIMITS.sharePerDay * 7) {
    return { ok: false, message: "Лимит шарингов на неделю" }
  }

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayShares = await db.bonusShareEvent.count({
    where: { userId, createdAt: { gte: todayStart } },
  })
  if (todayShares >= BONUS_LIMITS.sharePerDay) {
    return { ok: false, message: "Лимит шарингов на сегодня" }
  }

  const sameCombo = await db.bonusShareEvent.findFirst({
    where: { userId, listingId, platform, createdAt: { gte: weekAgo } },
  })
  if (sameCombo) {
    return { ok: false, message: "Уже получали баллы за этот шаринг" }
  }

  await db.bonusShareEvent.create({ data: { userId, listingId, platform } })

  const result = await awardBonus({
    userId,
    reason,
    referenceKey: `share:${listingId}:${platform}`,
    listingId,
  }, db)

  if (!result.ok) {
    return { ok: false, message: result.message }
  }
  return { ok: true, points: result.amount }
}

export function buildVkShareUrl(url: string, title: string) {
  const u = encodeURIComponent(url)
  const t = encodeURIComponent(title)
  return `https://vk.com/share.php?url=${u}&title=${t}`
}

/** МАХ — внешний шаринг через intent (URL может обновляться). */
export function buildMaxShareUrl(url: string) {
  return `https://max.ru/?share=${encodeURIComponent(url)}`
}

export async function tryDealCompletedBonuses(
  deal: { id: string; sellerId: string; buyerId: string; listingId: string },
  db: PrismaClient,
) {
  await awardBonus({
    userId: deal.sellerId,
    reason: "DEAL_COMPLETED",
    referenceKey: `deal:${deal.id}:seller`,
    listingId: deal.listingId,
  }, db)
  if (deal.buyerId !== deal.sellerId) {
    await awardBonus({
      userId: deal.buyerId,
      reason: "DEAL_COMPLETED",
      referenceKey: `deal:${deal.id}:buyer`,
      listingId: deal.listingId,
    }, db)
  }
}

export async function tryReviewBonuses(
  review: {
    id: string
    authorId: string
    targetUserId: string
    rating: number
    reviewStatus?: string | null
  },
  db: PrismaClient,
) {
  if (review.reviewStatus && review.reviewStatus !== "PUBLISHED") return
  if (review.authorId === review.targetUserId) return

  await awardBonus({
    userId: review.authorId,
    reason: "REVIEW_LEFT",
    referenceKey: `review:${review.id}:author`,
  }, db)

  if (review.rating >= 4) {
    await awardBonus({
      userId: review.targetUserId,
      reason: "POSITIVE_REVIEW_RECEIVED",
      referenceKey: `review:${review.id}:target`,
    }, db)
  }
}

export async function ensureReferralCode(userId: string, db: PrismaClient): Promise<string> {
  const row = await db.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  })
  if (row?.referralCode) return row.referralCode
  const code = `N${userId.replace(/[^a-z0-9]/gi, "").slice(-5).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`
  await db.user.update({ where: { id: userId }, data: { referralCode: code } })
  return code
}

export async function applyReferralCode(
  referredUserId: string,
  code: string,
  db: PrismaClient,
): Promise<{ ok: boolean; message?: string }> {
  const normalized = code.trim().toUpperCase()
  if (!normalized) return { ok: false, message: "Пустой код" }

  const referrer = await db.user.findFirst({
    where: { referralCode: normalized },
    select: { id: true, isBanned: true, bonusBlocked: true },
  })
  if (!referrer || referrer.isBanned) {
    return { ok: false, message: "Код не найден" }
  }
  if (referrer.id === referredUserId) {
    return { ok: false, message: "Нельзя использовать свой код" }
  }

  const existing = await db.referral.findUnique({ where: { referredUserId } })
  if (existing) return { ok: false, message: "Приглашение уже применено" }

  await db.referral.create({
    data: { referrerId: referrer.id, referredUserId, status: "PENDING" },
  })

  await awardBonus({
    userId: referrer.id,
    reason: "REFERRAL_REGISTERED",
    referenceKey: `referral:reg:${referredUserId}`,
  }, db)

  return { ok: true }
}

export async function tryReferralActiveBonus(
  referredUserId: string,
  listing: { id: string; title: string; description: string; images: string[] },
  db: PrismaClient,
) {
  if (!isQualityListing(listing)) return

  const ref = await db.referral.findUnique({
    where: { referredUserId },
    select: { id: true, referrerId: true, status: true },
  })
  if (!ref || ref.status !== "PENDING") return

  await db.referral.update({
    where: { id: ref.id },
    data: { status: "ACTIVE", activatedAt: new Date() },
  })

  await awardBonus({
    userId: ref.referrerId,
    reason: "REFERRAL_ACTIVE",
    referenceKey: `referral:active:${referredUserId}`,
    listingId: listing.id,
  }, db)
}
