import type { WantToBuyStatus } from "@prisma/client"
import { scanProhibitedText } from "@/lib/content-policy/scan-text"

type WantToBuyModerationInput = {
  title: string
  description: string
  categorySlug?: string
  user?: {
    isBanned?: boolean | null
    phoneVerifiedAt?: Date | null
  } | null
  duplicateRecent?: boolean
}

export type WantToBuyModerationVerdict = {
  status: Extract<WantToBuyStatus, "ACTIVE" | "MODERATION" | "REJECTED">
  autoApproved: boolean
  reason: string | null
  flags: string[]
}

export function moderateWantToBuy(input: WantToBuyModerationInput): WantToBuyModerationVerdict {
  const text = `${input.title}\n${input.description}`.trim()
  const scan = scanProhibitedText(text)

  if (input.user?.isBanned) {
    return {
      status: "REJECTED",
      autoApproved: false,
      reason: "Пользователь заблокирован",
      flags: ["Пользователь заблокирован"],
    }
  }

  if (scan.hardFlags.length) {
    return {
      status: "REJECTED",
      autoApproved: false,
      reason: scan.hardFlags[0],
      flags: scan.hardFlags,
    }
  }

  const reviewFlags = [...scan.reviewFlags]

  if (!input.user?.phoneVerifiedAt) {
    reviewFlags.push("Телефон не подтверждён")
  }

  if (input.duplicateRecent) {
    reviewFlags.push("Похожая заявка недавно уже публиковалась")
  }

  const descLen = (input.description || "").trim().length
  if (descLen > 0 && descLen < 15) {
    reviewFlags.push("Слишком короткое описание")
  }

  if (reviewFlags.length) {
    return {
      status: "MODERATION",
      autoApproved: false,
      reason: reviewFlags[0],
      flags: reviewFlags,
    }
  }

  return {
    status: "ACTIVE",
    autoApproved: true,
    reason: null,
    flags: [],
  }
}
