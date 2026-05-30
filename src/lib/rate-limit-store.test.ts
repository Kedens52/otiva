import { beforeEach, describe, expect, it } from "vitest"
import { consumeRateLimit, resetRateLimitStoreForTests } from "@/lib/rate-limit-store"

describe("consumeRateLimit (memory)", () => {
  beforeEach(() => {
    delete process.env.REDIS_URL
    resetRateLimitStoreForTests()
  })

  it("разрешает до max запросов в окне", async () => {
    const key = "test-key"
    const window = 60_000
    const max = 3

    expect(await consumeRateLimit(key, window, max)).toBe(true)
    expect(await consumeRateLimit(key, window, max)).toBe(true)
    expect(await consumeRateLimit(key, window, max)).toBe(true)
    expect(await consumeRateLimit(key, window, max)).toBe(false)
  })

  it("разные ключи не влияют друг на друга", async () => {
    expect(await consumeRateLimit("a", 60_000, 1)).toBe(true)
    expect(await consumeRateLimit("a", 60_000, 1)).toBe(false)
    expect(await consumeRateLimit("b", 60_000, 1)).toBe(true)
  })
})
