import { describe, expect, it } from "vitest"
import { isPaidStatus, mapTbankStatusToPayment } from "@/lib/payment-status"

describe("mapTbankStatusToPayment", () => {
  it("маппит CONFIRMED в SUCCEEDED", () => {
    expect(mapTbankStatusToPayment("CONFIRMED")).toBe("SUCCEEDED")
  })

  it("маппит отмену и возврат", () => {
    expect(mapTbankStatusToPayment("CANCELED")).toBe("CANCELED")
    expect(mapTbankStatusToPayment("REFUNDED")).toBe("REFUNDED")
    expect(mapTbankStatusToPayment("PARTIAL_REFUNDED")).toBe("PARTIAL_REFUNDED")
  })

  it("маппит ошибки", () => {
    expect(mapTbankStatusToPayment("REJECTED")).toBe("FAILED")
  })
})

describe("isPaidStatus", () => {
  it("успешная и частичный возврат считаются оплаченными для отката", () => {
    expect(isPaidStatus("SUCCEEDED")).toBe(true)
    expect(isPaidStatus("PARTIAL_REFUNDED")).toBe(true)
    expect(isPaidStatus("PENDING")).toBe(false)
  })
})
