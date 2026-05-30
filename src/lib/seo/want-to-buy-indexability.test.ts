import { describe, expect, it } from "vitest"
import { isWantToBuyIndexable } from "@/lib/seo/want-to-buy-indexability"

describe("isWantToBuyIndexable", () => {
  it("indexes only ACTIVE requests", () => {
    expect(isWantToBuyIndexable("ACTIVE")).toBe(true)
    expect(isWantToBuyIndexable("MODERATION")).toBe(false)
    expect(isWantToBuyIndexable("REJECTED")).toBe(false)
    expect(isWantToBuyIndexable("CLOSED")).toBe(false)
    expect(isWantToBuyIndexable("EXPIRED")).toBe(false)
  })
})
