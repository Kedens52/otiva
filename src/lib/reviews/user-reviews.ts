import { prisma } from "@/lib/prisma"

const REVIEW_WINDOW_DAYS = 30

/**
 * Check whether authorId is allowed to leave a review for targetUserId.
 *
 * Priority:
 * 1. If dealId provided → validate deal-based rules (COMPLETED, 30-day window, no duplicate).
 * 2. Fallback → conversation-based check (backward compat for old flow).
 */
export async function canUserReviewTarget(
  authorId: string,
  targetUserId: string,
  listingId?: string | null,
  conversationId?: string | null,
  dealId?: string | null,
): Promise<{ allowed: boolean; reason?: string }> {
  if (authorId === targetUserId) {
    return { allowed: false, reason: "Вы не можете оставить отзыв самому себе" }
  }

  // ── Deal-based flow ──────────────────────────────────────────────────────
  if (dealId) {
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      select: { id: true, sellerId: true, buyerId: true, status: true, completedAt: true },
    })

    if (!deal) return { allowed: false, reason: "Сделка не найдена" }
    if (deal.status !== "COMPLETED") {
      return { allowed: false, reason: "Отзыв можно оставить только после завершённой сделки" }
    }

    const isParticipant = deal.sellerId === authorId || deal.buyerId === authorId
    if (!isParticipant) return { allowed: false, reason: "Вы не участвуете в этой сделке" }

    const otherUserId = deal.sellerId === authorId ? deal.buyerId : deal.sellerId
    if (otherUserId !== targetUserId) {
      return { allowed: false, reason: "Получатель не является участником этой сделки" }
    }

    if (deal.completedAt) {
      const diffDays = (Date.now() - deal.completedAt.getTime()) / (1000 * 60 * 60 * 24)
      if (diffDays > REVIEW_WINDOW_DAYS) {
        return { allowed: false, reason: "Срок для оставления отзыва истёк (30 дней)" }
      }
    }

    const existingByDeal = await prisma.review.findFirst({
      where: { authorId, dealId, isDeleted: false },
    })
    if (existingByDeal) {
      return { allowed: false, reason: "Вы уже оставили отзыв по этой сделке" }
    }

    return { allowed: true }
  }

  // ── Conversation-based flow (backward compat) ───────────────────────────
  const existing = await prisma.review.findFirst({
    where: {
      authorId,
      targetUserId,
      ...(listingId ? { listingId } : {}),
      isDeleted: false,
    },
  })
  if (existing) {
    return { allowed: false, reason: "Вы уже оставляли отзыв по этому объявлению" }
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      ...(listingId ? { listingId } : {}),
      ...(conversationId ? { id: conversationId } : {}),
      members: { some: { userId: authorId } },
      AND: [{ members: { some: { userId: targetUserId } } }],
    },
    include: { messages: { select: { senderId: true } } },
  })

  if (!conversation) {
    return { allowed: false, reason: "Нет общего диалога с этим пользователем по данному объявлению" }
  }

  const senderIds = new Set(conversation.messages.map((m) => m.senderId))
  if (!senderIds.has(authorId)) {
    return { allowed: false, reason: "Вы не отправляли сообщений в этом диалоге" }
  }
  if (!senderIds.has(targetUserId)) {
    return { allowed: false, reason: "Продавец не ответил в диалоге — реальное взаимодействие не подтверждено" }
  }

  return { allowed: true }
}

/**
 * Recalculate and persist user rating aggregates from all active reviews.
 */
export async function recalculateUserRating(userId: string): Promise<void> {
  const reviews = await prisma.review.findMany({
    where: { targetUserId: userId, isDeleted: false, isHidden: false, reviewModerationState: "PUBLISHED" },
    select: { rating: true },
  })

  const count = reviews.length
  const avg = count > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0
  const positive = reviews.filter((r) => r.rating >= 4).length
  const neutral = reviews.filter((r) => r.rating === 3).length
  const negative = reviews.filter((r) => r.rating <= 2).length

  await prisma.user.update({
    where: { id: userId },
    data: {
      rating: Math.round(avg * 10) / 10,
      reviewCount: count,
      positiveReviewsCount: positive,
      neutralReviewsCount: neutral,
      negativeReviewsCount: negative,
    },
  })
}

/**
 * Fetch all public reviews for a target user.
 */
export async function getUserReviews(targetUserId: string) {
  return prisma.review.findMany({
    where: { targetUserId, isDeleted: false, isHidden: false, reviewModerationState: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, rating: true, text: true, tags: true, replyText: true, repliedAt: true, createdAt: true, listingId: true,
      author: { select: { id: true, name: true, avatar: true } },
      listing: { select: { id: true, title: true, slug: true } },
    },
  })
}

/**
 * Get deals where the user can still leave a review (completed, < 30 days, no review yet).
 */
export async function getPendingReviewDeals(userId: string) {
  const cutoff = new Date(Date.now() - REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000)
  const deals = await prisma.deal.findMany({
    where: {
      status: "COMPLETED",
      completedAt: { gte: cutoff },
      OR: [{ sellerId: userId }, { buyerId: userId }],
    },
    include: {
      listing: { select: { id: true, title: true, slug: true, images: true } },
      seller: { select: { id: true, name: true, avatar: true } },
      buyer: { select: { id: true, name: true, avatar: true } },
      reviews: { where: { authorId: userId, isDeleted: false }, select: { id: true } },
    },
    orderBy: { completedAt: "desc" },
  })
  return deals.filter((d) => d.reviews.length === 0)
}

/**
 * Rate-limit: how many reviews the author created recently.
 */
export async function getAuthorReviewCounts(authorId: string) {
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const [inHour, inDay] = await Promise.all([
    prisma.review.count({ where: { authorId, createdAt: { gte: oneHourAgo }, isDeleted: false } }),
    prisma.review.count({ where: { authorId, createdAt: { gte: oneDayAgo }, isDeleted: false } }),
  ])
  return { inHour, inDay }
}

/** Count mutual reviews between two users. */
export async function getMutualReviewCount(userA: string, userB: string): Promise<number> {
  return prisma.review.count({
    where: {
      isDeleted: false,
      OR: [{ authorId: userA, targetUserId: userB }, { authorId: userB, targetUserId: userA }],
    },
  })
}

/** Count how many of the author's previous reviews have similar text. */
export async function countSimilarTexts(authorId: string, text: string): Promise<number> {
  if (!text || text.length < 15) return 0
  const recent = await prisma.review.findMany({
    where: { authorId, isDeleted: false },
    select: { text: true },
    take: 50,
    orderBy: { createdAt: "desc" },
  })
  const normalized = text.toLowerCase().replace(/\s+/g, " ").trim()
  return recent.filter((r) => {
    if (!r.text) return false
    const rn = r.text.toLowerCase().replace(/\s+/g, " ").trim()
    return textSimilarity(normalized, rn) > 0.8
  }).length
}

function textSimilarity(a: string, b: string): number {
  if (a === b) return 1
  if (!a.length || !b.length) return 0
  const longer = a.length > b.length ? a : b
  const shorter = a.length > b.length ? b : a
  const dist = levenshtein(longer, shorter)
  return (longer.length - dist) / longer.length
}

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}
