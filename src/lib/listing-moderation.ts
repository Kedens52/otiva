import { scanProhibitedText } from "@/lib/content-policy/scan-text"

type ListingModerationInput = {
  title: string
  description: string
  price: number
  images?: string[]
  categorySlug?: string
  user?: {
    isVerified?: boolean | null
    isBanned?: boolean | null
  } | null
}

export type ListingModerationVerdict = {
  status: "ACTIVE" | "MODERATION" | "REJECTED"
  autoApproved: boolean
  reason: string | null
  flags: string[]
  reasonCode?: string | null
}

export function moderateListing(input: ListingModerationInput): ListingModerationVerdict {
  const text = `${input.title}\n${input.description}`.trim()
  const scan = scanProhibitedText(text)

  if (input.user?.isBanned) {
    return {
      status: "REJECTED",
      autoApproved: false,
      reason: "Пользователь заблокирован",
      flags: ["Пользователь заблокирован"],
      reasonCode: "PROHIBITED_ITEM",
    }
  }

  if (scan.hardFlags.length) {
    return {
      status: "REJECTED",
      autoApproved: false,
      reason: scan.hardFlags[0],
      flags: scan.hardFlags,
      reasonCode: scan.hardCodes[0] ?? "PROHIBITED_ITEM",
    }
  }

  const reviewFlags = [...scan.reviewFlags]

  if (input.price < 0) {
    reviewFlags.push("Некорректная цена")
  }

  const descLen = (input.description || "").trim().length
  if (descLen > 0 && descLen < 25 && input.categorySlug !== "services") {
    reviewFlags.push("Слишком короткое описание")
  }

  if (!input.images?.length && input.categorySlug !== "services") {
    reviewFlags.push("Нет фотографий")
  }

  if (reviewFlags.length) {
    const reasonCode =
      scan.reviewCodes[0] ??
      (reviewFlags.some((f) => f.includes("описан")) ? "SHORT_DESCRIPTION" : "SPAM")
    return {
      status: "MODERATION",
      autoApproved: false,
      reason: reviewFlags[0],
      flags: reviewFlags,
      reasonCode,
    }
  }

  return {
    status: "ACTIVE",
    autoApproved: true,
    reason: null,
    flags: [],
    reasonCode: null,
  }
}
