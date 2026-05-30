import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { withAdminApi } from "@/lib/admin/guards"
import { prisma } from "@/lib/prisma"
import { recalculateUserRating } from "@/lib/reviews/user-reviews"
import { recalculateUserTrust } from "@/lib/user-trust-engine"

export const dynamic = "force-dynamic"

const moderateSchema = z.object({
  action: z.enum(["publish", "hide", "reject", "delete", "restore"]),
  moderationNote: z.string().max(500).optional(),
})

/**
 * PATCH /api/admin/reviews/[id]
 * Модерация отзыва. Только listings.moderate.
 */
export const PATCH = withAdminApi(async ({ req }) => {
  const id = req.nextUrl.pathname.split("/").at(-1) ?? ""

  const review = await prisma.review.findUnique({
    where: { id },
    select: { id: true, targetUserId: true, authorId: true, isDeleted: true },
  })
  if (!review) {
    return NextResponse.json({ error: "Отзыв не найден" }, { status: 404 })
  }

  const body = moderateSchema.parse(await (req as NextRequest).json())

  let updateData: Record<string, unknown> = {}

  switch (body.action) {
    case "publish":
      updateData = {
        reviewModerationState: "PUBLISHED",
        reviewStatus: "PUBLISHED",
        isHidden: false,
        isDeleted: false,
        disputedAt: null,
        moderationNote: body.moderationNote ?? null,
      }
      break
    case "hide":
      updateData = {
        isHidden: true,
        reviewModerationState: "HIDDEN",
        reviewStatus: "HIDDEN",
        moderationNote: body.moderationNote ?? null,
      }
      break
    case "reject":
      updateData = {
        reviewModerationState: "REJECTED",
        reviewStatus: "REJECTED",
        isHidden: true,
        moderationNote: body.moderationNote ?? null,
      }
      break
    case "delete":
      updateData = {
        isDeleted: true,
        reviewModerationState: "DELETED",
        reviewStatus: "DELETED",
        moderationNote: body.moderationNote ?? null,
      }
      break
    case "restore":
      updateData = {
        isDeleted: false,
        isHidden: false,
        reviewModerationState: "PUBLISHED",
        reviewStatus: "PUBLISHED",
        moderationNote: body.moderationNote ?? null,
      }
      break
  }

  await prisma.review.update({ where: { id }, data: updateData })

  // Пересчитываем рейтинг при любом изменении статуса
  await recalculateUserRating(review.targetUserId)
  void recalculateUserTrust(review.targetUserId).catch(() => {})
  void recalculateUserTrust(review.authorId).catch(() => {})

  return NextResponse.json({ ok: true })
}, "listings.moderate")
