import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"
import { messageLooksLikeDealRisk } from "@/lib/chat/deal-risk-keywords"

/** Внутренний уровень аккаунта (хранится в User.trustTier) */
export type AccountLevel = "NEW" | "NORMAL" | "TRUSTED" | "WATCH" | "HIGH_RISK" | "BLOCKED"

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

function daysAgo(d: number) {
  return new Date(Date.now() - d * 86400000)
}

export async function addUserTrustEvent(
  userId: string,
  type: string,
  opts?: { scoreDelta?: number | null; reason?: string | null; metadata?: Prisma.InputJsonValue },
): Promise<void> {
  await prisma.userTrustEvent.create({
    data: {
      userId,
      type,
      scoreDelta: opts?.scoreDelta ?? null,
      reason: opts?.reason ?? null,
      metadata: opts?.metadata === undefined ? undefined : opts.metadata,
    },
  })
}

/** Модификаторы для мягкого влияния на порядок внутри страницы выдачи (не глобальный ранг). */
export function getRankingTrustModifier(
  accountLevel: string,
  trustScore: number,
  riskPenaltyScore?: number | null,
): { trustBoost: number; riskPenalty: number; accountLevel: string } {
  let base: { trustBoost: number; riskPenalty: number; accountLevel: string }
  switch (accountLevel) {
    case "TRUSTED":
      base = { trustBoost: 5, riskPenalty: 0, accountLevel }
      break
    case "NEW":
      base = {
        trustBoost: 0,
        riskPenalty: trustScore < 40 ? 2 : 0,
        accountLevel,
      }
      break
    case "WATCH":
      base = { trustBoost: 0, riskPenalty: 10, accountLevel }
      break
    case "HIGH_RISK":
      base = { trustBoost: 0, riskPenalty: 30, accountLevel }
      break
    case "BLOCKED":
      base = { trustBoost: 0, riskPenalty: 100, accountLevel }
      break
    default:
      base = { trustBoost: 0, riskPenalty: 0, accountLevel: "NORMAL" }
  }
  const extra =
    riskPenaltyScore != null && riskPenaltyScore > 0
      ? Math.min(22, Math.round(riskPenaltyScore * 0.18))
      : 0
  return { ...base, riskPenalty: base.riskPenalty + extra }
}

export function getUserTrustForRanking(user: {
  trustTier: string
  internalTrustScore: number
  riskPenaltyScore: number
}) {
  return getRankingTrustModifier(user.trustTier, user.internalTrustScore, user.riskPenaltyScore)
}

/**
 * Полный пересчёт TrustScore (0–100), RiskScore (0–100) и уровня аккаунта.
 * internalTrustScore = TrustScore, riskPenaltyScore = RiskScore (имена полей исторические).
 */
export async function recalculateUserTrust(userId: string): Promise<void> {
  const since30 = daysAgo(30)
  const since14 = daysAgo(14)
  const since7 = daysAgo(7)

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      phone: true,
      phoneVerifiedAt: true,
      email: true,
      emailVerified: true,
      vkId: true,
      yandexId: true,
      name: true,
      city: true,
      avatar: true,
      description: true,
      isBanned: true,
      isVerified: true,
      createdAt: true,
      avgResponseMinutes: true,
      rating: true,
      reviewCount: true,
      positiveReviewsCount: true,
      negativeReviewsCount: true,
      accountRestricted: true,
    },
  })

  if (!user) return

  const [
    reportsOnListings30d,
    reportsTargetUser30d,
    fraudReports30d,
    rejected30d,
    rejectedAll,
    activeListings,
    modListings7d,
    moderationRejectedLogs30d,
    dupTitleGroups,
    outgoingConv7d,
    distinctCities14d,
    listingsWithLinks,
    disputedReviews,
  ] = await Promise.all([
    prisma.report.count({
      where: {
        createdAt: { gte: since30 },
        listing: { sellerId: userId },
        status: { in: ["pending", "resolved"] },
      },
    }),
    prisma.report.count({
      where: {
        createdAt: { gte: since30 },
        targetUserId: userId,
        status: { in: ["pending", "resolved"] },
      },
    }),
    prisma.report.count({
      where: {
        createdAt: { gte: since30 },
        OR: [{ listing: { sellerId: userId } }, { targetUserId: userId }],
        reason: "fraud",
      },
    }),
    prisma.listing.count({
      where: {
        sellerId: userId,
        status: "REJECTED",
        updatedAt: { gte: since30 },
      },
    }),
    prisma.listing.count({ where: { sellerId: userId, status: "REJECTED" } }),
    prisma.listing.count({
      where: { sellerId: userId, status: { in: ["ACTIVE", "MODERATION"] } },
    }),
    prisma.listing.count({
      where: { sellerId: userId, createdAt: { gte: since7 } },
    }),
    prisma.moderationLog.count({
      where: {
        createdAt: { gte: since30 },
        action: "REJECTED",
        listing: { sellerId: userId },
      },
    }),
    prisma.listing.groupBy({
      by: ["title"],
      where: {
        sellerId: userId,
        status: { notIn: ["ARCHIVED", "SOLD"] },
        createdAt: { gte: since30 },
      },
      _count: { title: true },
    }),
    prisma.conversationMember.count({
      where: {
        userId,
        joinedAt: { gte: since7 },
      },
    }),
    prisma.listing
      .findMany({
        where: { sellerId: userId, createdAt: { gte: since14 } },
        select: { city: true },
        distinct: ["city"],
      })
      .then((rows) => rows.filter((r) => r.city).length),
    prisma.listing.count({
      where: {
        sellerId: userId,
        status: { in: ["ACTIVE", "MODERATION"] },
        OR: [
          { description: { contains: "http", mode: "insensitive" } },
          { description: { contains: "www.", mode: "insensitive" } },
        ],
      },
    }),
    prisma.review.count({
      where: { targetUserId: userId, reviewModerationState: "DISPUTED" },
    }),
  ])

  const dupTitles = dupTitleGroups.filter((g) => g._count.title >= 2).length
  const accountAgeDays = (Date.now() - user.createdAt.getTime()) / 86400000

  const suspiciousMsgCount = await prisma.message
    .count({
      where: {
        senderId: userId,
        createdAt: { gte: since7 },
      },
    })
    .then(async (total) => {
      if (total === 0) return 0
      const sample = await prisma.message.findMany({
        where: { senderId: userId, createdAt: { gte: since7 } },
        select: { text: true },
        take: 200,
      })
      return sample.filter((m) => messageLooksLikeDealRisk(m.text)).length
    })

  let trust = 0
  const trustReasons: string[] = []

  if (user.phoneVerifiedAt || user.phone) {
    trust += 10
    trustReasons.push("Телефон подтверждён или указан (+10)")
  }
  if (user.emailVerified || user.email) {
    trust += 5
    trustReasons.push("Email подтверждён или указан (+5)")
  }
  if (user.vkId || user.yandexId) {
    trust += 5
    trustReasons.push("OAuth VK/Яндекс (+5)")
  }
  if (user.name && user.city && user.avatar && user.description && user.description.trim().length > 10) {
    trust += 10
    trustReasons.push("Профиль заполнен (+10)")
  }
  if (accountAgeDays >= 7) {
    trust += 5
    trustReasons.push("Аккаунт старше 7 дней (+5)")
  }
  if (accountAgeDays >= 30) {
    trust += 10
    trustReasons.push("Аккаунт старше 30 дней (+10)")
  }
  const reportsTotal30d = reportsOnListings30d + reportsTargetUser30d
  if (reportsTotal30d === 0) {
    trust += 10
    trustReasons.push("Нет жалоб за 30 дней (+10)")
  }
  if (rejected30d === 0 && rejectedAll < 3) {
    trust += 10
    trustReasons.push("Нет отклонённых за 30 дней / мало отклонённых всего (+10)")
  }
  if (activeListings > 0 && rejectedAll === 0) {
    trust += 5
    trustReasons.push("Есть активные объявления без отклонений (+5)")
  }
  if (user.avgResponseMinutes != null && user.avgResponseMinutes >= 0 && user.avgResponseMinutes <= 120) {
    trust += 5
    trustReasons.push("Быстрый ответ в чате (+5)")
  }
  if ((user.positiveReviewsCount ?? 0) > 0 && (user.rating ?? 0) >= 4) {
    trust += 10
    trustReasons.push("Положительные отзывы (+10)")
  }
  if (dupTitles === 0) {
    trust += 5
    trustReasons.push("Нет дублей по заголовку за 30 дней (+5)")
  }
  trust = clamp(trust, 0, 100)

  let risk = 0
  const riskReasons: string[] = []

  const burstNew = accountAgeDays < 7 && modListings7d >= 6
  if (burstNew) {
    risk += 20
    riskReasons.push("Много объявлений за короткое время у нового аккаунта (+20)")
  }
  if (dupTitles > 0) {
    risk += 15
    riskReasons.push("Дубли по названию (+15)")
  }
  if (dupTitleGroups.length >= 3) {
    risk += 15
    riskReasons.push("Много похожих активных заголовков (+15)")
  }
  if (reportsTotal30d > 0) {
    const add = Math.min(20, 5 + reportsTotal30d * 4)
    risk += add
    riskReasons.push(`Жалобы за 30 дней (+${add})`)
  }
  if (fraudReports30d > 0) {
    risk += Math.min(30, 15 + fraudReports30d * 10)
    riskReasons.push("Жалобы на мошенничество (+до 30)")
  }
  if (moderationRejectedLogs30d >= 2 || rejected30d >= 2) {
    risk += 20
    riskReasons.push("Частые отклонения модерацией (+20)")
  }
  if (listingsWithLinks >= 2) {
    risk += 15
    riskReasons.push("Ссылки в описаниях (+15)")
  }
  if (suspiciousMsgCount >= 3) {
    risk += 15
    riskReasons.push("Подозрительные фразы в сообщениях (+15)")
  }
  if (suspiciousMsgCount >= 6) {
    risk += 15
    riskReasons.push("Много подозрительных сообщений (+15)")
  }
  if (outgoingConv7d > 40) {
    risk += 20
    riskReasons.push("Очень много новых диалогов за неделю (+20)")
  }
  if (distinctCities14d >= 4) {
    risk += 10
    riskReasons.push("Частая смена города в объявлениях (+10)")
  }
  if (!(user.name && user.city && user.avatar)) {
    risk += 10
    riskReasons.push("Профиль заполнен не полностью (+10)")
  }
  if (disputedReviews > 0) {
    risk += 10
    riskReasons.push("Спорные отзывы (+10)")
  }
  if (reportsTotal30d >= 4) {
    risk += 30
    riskReasons.push("Много жалоб (повторный риск) (+30)")
  }

  risk = clamp(risk, 0, 100)

  let trustTier: AccountLevel = "NORMAL"

  if (user.isBanned) {
    trustTier = "BLOCKED"
    trust = 0
    risk = 100
    trustReasons.length = 0
    riskReasons.length = 0
    trustReasons.push("Аккаунт заблокирован")
    riskReasons.push("Бан")
  } else if (risk >= 70) {
    trustTier = "HIGH_RISK"
  } else if (risk >= 40) {
    trustTier = "WATCH"
  } else if (trust >= 70 && risk < 25) {
    trustTier = "TRUSTED"
  } else if (accountAgeDays < 14 && trust < 45) {
    trustTier = "NEW"
  } else {
    trustTier = "NORMAL"
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      internalTrustScore: trust,
      riskPenaltyScore: risk,
      trustTier,
      trustReasons: trustReasons as unknown as Prisma.InputJsonValue,
      riskReasons: riskReasons as unknown as Prisma.InputJsonValue,
      lastTrustCalculatedAt: new Date(),
    },
  })

  const { syncUserBadges } = await import("@/lib/badges/sync-user-badges")
  void syncUserBadges(userId).catch(() => {})
}

/** Базовый лимит бесплатных активных + на модерации; TRUSTED +1. */
export function maxFreeListingsForTier(trustTier: string): number {
  return trustTier === "TRUSTED" ? 4 : 3
}

export function needsModerationForHighRisk(
  trustTier: string,
  verdictStatus: "ACTIVE" | "MODERATION" | "REJECTED",
): "ACTIVE" | "MODERATION" | "REJECTED" {
  if (verdictStatus === "REJECTED") return "REJECTED"
  if (trustTier === "HIGH_RISK" || trustTier === "BLOCKED") return "MODERATION"
  if (trustTier === "WATCH" && verdictStatus === "ACTIVE") return "MODERATION"
  return verdictStatus
}
