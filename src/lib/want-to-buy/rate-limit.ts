import { consumeRateLimit } from "@/lib/rate-limit-store"
import {
  WANT_TO_BUY_MAX_CREATE_PER_DAY,
  WANT_TO_BUY_MAX_OFFERS_PER_DAY,
} from "@/lib/want-to-buy/constants"

const DAY_MS = 24 * 60 * 60 * 1000

export async function checkWantToBuyCreateRateLimit(userId: string): Promise<boolean> {
  return consumeRateLimit(`wtb:create:${userId}`, DAY_MS, WANT_TO_BUY_MAX_CREATE_PER_DAY)
}

export async function checkWantToBuyOfferRateLimit(sellerId: string): Promise<boolean> {
  return consumeRateLimit(`wtb:offer:${sellerId}`, DAY_MS, WANT_TO_BUY_MAX_OFFERS_PER_DAY)
}
