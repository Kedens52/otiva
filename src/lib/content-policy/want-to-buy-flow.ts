import type { NextRequest } from "next/server"
import type { PrismaClient } from "@prisma/client"
import { moderateWantToBuy, type WantToBuyModerationVerdict } from "@/lib/want-to-buy/moderate"
import { buildContentFingerprint } from "@/lib/content-policy/fingerprint"
import { checkWantToBuyTextDuplicate } from "@/lib/content-policy/duplicate-text"
import {
  loadUserContextForIncident,
  recordContentModerationIncident,
} from "@/lib/content-policy/incident"
import { getRequestMeta } from "@/lib/content-policy/request-meta"

export type WantToBuyContentEvaluation = {
  verdict: WantToBuyModerationVerdict
  contentFingerprint: string
  moderationCode: string | null
}

type WantToBuyContentInput = {
  title: string
  description: string
  categorySlug?: string
  user: {
    id: string
    isBanned?: boolean | null
    phoneVerifiedAt?: Date | null
  }
  excludeWantToBuyId?: string
  request?: NextRequest
}

export async function evaluateWantToBuyContent(
  db: PrismaClient,
  input: WantToBuyContentInput,
): Promise<WantToBuyContentEvaluation> {
  const contentFingerprint = buildContentFingerprint(input.title, input.description)

  const dup = await checkWantToBuyTextDuplicate(db, {
    userId: input.user.id,
    title: input.title,
    description: input.description,
    excludeWantToBuyId: input.excludeWantToBuyId,
  })

  const verdict = moderateWantToBuy({
    title: input.title,
    description: input.description,
    categorySlug: input.categorySlug,
    user: input.user,
    duplicateRecent: dup.hit && dup.severity === "moderation",
  })

  let status = verdict.status
  let reason = verdict.reason
  let flags = [...verdict.flags]
  let moderationCode: string | null = null

  if (dup.hit && dup.severity === "reject") {
    status = "REJECTED"
    reason = dup.reason
    flags.push(dup.reason)
    moderationCode = dup.code
  } else if (dup.hit && dup.severity === "moderation" && status === "ACTIVE") {
    status = "MODERATION"
    reason = dup.reason
    moderationCode = dup.code
  } else if (status === "REJECTED") {
    moderationCode = "PROHIBITED_ITEM"
  } else if (status === "MODERATION" && flags.length) {
    moderationCode = flags[0].includes("телефон") || flags[0].includes("мессенджер") ? "SUSPICIOUS_LINKS" : "SPAM"
  }

  return {
    verdict: { ...verdict, status, reason, flags },
    contentFingerprint,
    moderationCode,
  }
}

export async function notifyWantToBuyContentIncident(
  input: WantToBuyContentInput & {
    evaluation: WantToBuyContentEvaluation
    wantToBuyId?: string
    priceMax?: number | null
    city?: string | null
    condition?: string
  },
): Promise<void> {
  const v = input.evaluation.verdict
  if (v.status !== "REJECTED" && input.evaluation.moderationCode !== "DUPLICATE_TEXT") return

  const { ip, userAgent } = getRequestMeta(input.request ?? null)
  const userContext = await loadUserContextForIncident(input.user.id)

  await recordContentModerationIncident({
    source: "WANT_TO_BUY",
    severity: v.status === "REJECTED" ? "BLOCKED" : "FLAGGED",
    userId: input.user.id,
    wantToBuyId: input.wantToBuyId,
    reasonCode: input.evaluation.moderationCode ?? "PROHIBITED_ITEM",
    summary: v.reason ?? "Срабатывание фильтра контента",
    matchedRules: v.flags,
    payload: {
      title: input.title,
      description: input.description,
      categorySlug: input.categorySlug,
      priceMax: input.priceMax,
      city: input.city,
      condition: input.condition,
      contentFingerprint: input.evaluation.contentFingerprint,
      status: v.status,
      user: userContext,
      ip,
      userAgent,
    },
    ip,
    userAgent,
  })
}
