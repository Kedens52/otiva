import { describe, expect, it } from "vitest"
import { hashTbankWebhookPayload } from "@/lib/payments/payment-events"

describe("hashTbankWebhookPayload", () => {
  const base = {
    OrderId: "nsh_test123",
    Status: "CONFIRMED",
    PaymentId: "999001",
    Amount: 30000,
  }

  it("одинаковый webhook даёт один hash (идемпотентность)", () => {
    const a = hashTbankWebhookPayload(base)
    const b = hashTbankWebhookPayload({ ...base })
    expect(a).toBe(b)
    expect(a).toHaveLength(64)
  })

  it("другой статус — другой hash", () => {
    const confirmed = hashTbankWebhookPayload(base)
    const refunded = hashTbankWebhookPayload({ ...base, Status: "REFUNDED" })
    expect(confirmed).not.toBe(refunded)
  })

  it("другая сумма — другой hash", () => {
    const a = hashTbankWebhookPayload(base)
    const b = hashTbankWebhookPayload({ ...base, Amount: 29900 })
    expect(a).not.toBe(b)
  })
})
