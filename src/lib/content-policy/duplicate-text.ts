import type { PrismaClient } from "@prisma/client"
import { buildContentFingerprint } from "@/lib/content-policy/fingerprint"

export type TextDuplicateVerdict =
  | { hit: false }
  | {
      hit: true
      severity: "reject" | "moderation"
      reason: string
      code: "DUPLICATE_TEXT" | "DUPLICATE_LISTING" | "SPAM"
    }

const CROSS_USER_WINDOW_DAYS = 14
const CROSS_USER_THRESHOLD = 3

export async function checkListingTextDuplicate(
  prisma: PrismaClient,
  input: {
    sellerId: string
    title: string
    description: string
    excludeListingId?: string
  },
): Promise<TextDuplicateVerdict> {
  const fingerprint = buildContentFingerprint(input.title, input.description)
  const titleNorm = input.title.trim()

  const sameUserFp = await prisma.listing.findFirst({
    where: {
      sellerId: input.sellerId,
      contentFingerprint: fingerprint,
      status: { notIn: ["ARCHIVED", "SOLD"] },
      ...(input.excludeListingId ? { id: { not: input.excludeListingId } } : {}),
    },
    select: { id: true },
  })
  if (sameUserFp) {
    return {
      hit: true,
      severity: "reject",
      reason: "Такое объявление уже опубликовано. Измените текст или закройте предыдущее.",
      code: "DUPLICATE_TEXT",
    }
  }

  const dupTitle = await prisma.listing.count({
    where: {
      sellerId: input.sellerId,
      title: { equals: titleNorm, mode: "insensitive" },
      status: { notIn: ["ARCHIVED", "SOLD"] },
      ...(input.excludeListingId ? { id: { not: input.excludeListingId } } : {}),
    },
  })
  if (dupTitle > 0) {
    return {
      hit: true,
      severity: "moderation",
      reason: "Дублирующее объявление",
      code: "DUPLICATE_LISTING",
    }
  }

  const since = new Date(Date.now() - CROSS_USER_WINDOW_DAYS * 24 * 60 * 60 * 1000)
  const crossCount = await prisma.listing.count({
    where: {
      contentFingerprint: fingerprint,
      createdAt: { gte: since },
      status: { in: ["ACTIVE", "MODERATION"] },
      ...(input.excludeListingId ? { id: { not: input.excludeListingId } } : {}),
    },
  })
  if (crossCount >= CROSS_USER_THRESHOLD) {
    return {
      hit: true,
      severity: "moderation",
      reason: "Текст совпадает с другими объявлениями на площадке",
      code: "SPAM",
    }
  }

  return { hit: false }
}

export async function checkWantToBuyTextDuplicate(
  prisma: PrismaClient,
  input: {
    userId: string
    title: string
    description: string
    excludeWantToBuyId?: string
  },
): Promise<TextDuplicateVerdict> {
  const fingerprint = buildContentFingerprint(input.title, input.description)

  const sameUserFp = await prisma.wantToBuy.findFirst({
    where: {
      userId: input.userId,
      contentFingerprint: fingerprint,
      status: { in: ["ACTIVE", "MODERATION"] },
      ...(input.excludeWantToBuyId ? { id: { not: input.excludeWantToBuyId } } : {}),
    },
    select: { id: true },
  })
  if (sameUserFp) {
    return {
      hit: true,
      severity: "reject",
      reason: "Такая заявка уже опубликована. Измените текст или закройте предыдущую.",
      code: "DUPLICATE_TEXT",
    }
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const titleNorm = input.title.trim().toLowerCase()
  const recent = await prisma.wantToBuy.findMany({
    where: {
      userId: input.userId,
      createdAt: { gte: since },
      ...(input.excludeWantToBuyId ? { id: { not: input.excludeWantToBuyId } } : {}),
    },
    select: { title: true },
    take: 30,
  })
  if (recent.some((row) => row.title.trim().toLowerCase() === titleNorm)) {
    return {
      hit: true,
      severity: "moderation",
      reason: "Похожая заявка недавно уже публиковалась",
      code: "DUPLICATE_LISTING",
    }
  }

  return { hit: false }
}

export { buildContentFingerprint }
