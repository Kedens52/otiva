import type { NextRequest } from "next/server"
import type { PrismaClient } from "@prisma/client"
import { moderateListing, type ListingModerationVerdict } from "@/lib/listing-moderation"
import { buildContentFingerprint } from "@/lib/content-policy/fingerprint"
import { checkListingTextDuplicate } from "@/lib/content-policy/duplicate-text"
import {
  findDuplicateImageAcrossListings,
  validateListingImageUrls,
} from "@/lib/content-policy/image-validate"
import {
  loadUserContextForIncident,
  recordContentModerationIncident,
} from "@/lib/content-policy/incident"
import { getRequestMeta } from "@/lib/content-policy/request-meta"

export type ListingContentEvaluation = {
  verdict: ListingModerationVerdict
  finalStatus: "ACTIVE" | "MODERATION" | "REJECTED"
  finalReason: string | null
  moderationCode: string | null
  contentFingerprint: string
  flags: string[]
}

type ListingContentInput = {
  title: string
  description: string
  price: number
  images: string[]
  categorySlug?: string
  user: { id: string; isBanned?: boolean | null; isVerified?: boolean | null }
  excludeListingId?: string
  request?: NextRequest
}

export async function evaluateListingContent(
  db: PrismaClient,
  input: ListingContentInput,
): Promise<ListingContentEvaluation> {
  const contentFingerprint = buildContentFingerprint(input.title, input.description)
  const flags: string[] = []

  const verdict = moderateListing({
    title: input.title,
    description: input.description,
    price: input.price,
    images: input.images,
    categorySlug: input.categorySlug,
    user: input.user,
  })
  flags.push(...verdict.flags)

  let finalStatus = verdict.status
  let finalReason =
    verdict.status === "REJECTED" ? verdict.reason : verdict.status === "MODERATION" ? verdict.reason : null
  let moderationCode: string | null = verdict.reasonCode ?? null
  if (verdict.status === "REJECTED" && !moderationCode) {
    moderationCode = "PROHIBITED_ITEM"
  }

  const dup = await checkListingTextDuplicate(db, {
    sellerId: input.user.id,
    title: input.title,
    description: input.description,
    excludeListingId: input.excludeListingId,
  })
  if (dup.hit) {
    flags.push(dup.reason)
    if (dup.severity === "reject") {
      finalStatus = "REJECTED"
      finalReason = dup.reason
      moderationCode = dup.code
    } else if (finalStatus === "ACTIVE") {
      finalStatus = "MODERATION"
      finalReason = dup.reason
      moderationCode = dup.code
    }
  }

  if (input.images.length > 0) {
    const imageCheck = await validateListingImageUrls(db, input.user.id, input.images)
    if (!imageCheck.ok) {
      flags.push(imageCheck.error)
      if (finalStatus === "ACTIVE") {
        finalStatus = "MODERATION"
        finalReason = imageCheck.error
        moderationCode = imageCheck.reasonCode
      }
    }

    const dupImages = await findDuplicateImageAcrossListings(
      db,
      input.user.id,
      input.images,
      input.excludeListingId,
    )
    if (dupImages && finalStatus === "ACTIVE") {
      finalStatus = "MODERATION"
      finalReason = "Те же фото уже используются в другом объявлении"
      moderationCode = "DUPLICATE_LISTING"
      flags.push("Дубликат фото")
    }
  }

  return {
    verdict,
    finalStatus,
    finalReason,
    moderationCode,
    contentFingerprint,
    flags,
  }
}

export async function notifyListingContentIncident(
  input: ListingContentInput & {
    evaluation: ListingContentEvaluation
    listingId?: string
  },
): Promise<void> {
  const shouldNotify =
    input.evaluation.finalStatus === "REJECTED" ||
    input.evaluation.moderationCode === "PROHIBITED_ITEM" ||
    input.evaluation.moderationCode === "DUPLICATE_TEXT" ||
    input.evaluation.flags.some((f) => /запрещ/i.test(f))

  if (!shouldNotify) return

  const { ip, userAgent } = getRequestMeta(input.request ?? null)
  const userContext = await loadUserContextForIncident(input.user.id)

  await recordContentModerationIncident({
    source: "LISTING",
    severity: input.evaluation.finalStatus === "REJECTED" ? "BLOCKED" : "FLAGGED",
    userId: input.user.id,
    listingId: input.listingId,
    reasonCode: input.evaluation.moderationCode ?? "PROHIBITED_ITEM",
    summary: input.evaluation.finalReason ?? "Срабатывание фильтра контента",
    matchedRules: input.evaluation.flags,
    payload: {
      title: input.title,
      description: input.description,
      price: input.price,
      images: input.images,
      categorySlug: input.categorySlug,
      contentFingerprint: input.evaluation.contentFingerprint,
      status: input.evaluation.finalStatus,
      user: userContext,
      ip,
      userAgent,
    },
    ip,
    userAgent,
  })
}
