import { describe, expect, it } from "vitest"
import { resolvePaymentAmount } from "@/lib/payment-pricing"

describe("resolvePaymentAmount", () => {
  it("принимает пополнение кошелька только в допустимом диапазоне", () => {
    expect(resolvePaymentAmount({ serviceType: "wallet_topup", amountRubles: 300 })).toEqual({
      ok: true,
      amountKopecks: 30_000,
      serviceType: "wallet_topup",
    })

    expect(resolvePaymentAmount({ serviceType: "wallet_topup", amountRubles: 50 })).toMatchObject({
      ok: false,
    })

    expect(resolvePaymentAmount({ serviceType: "wallet_topup", amountRubles: 1_000_000 })).toMatchObject({
      ok: false,
    })
  })

  it("игнорирует подмену суммы для продвижения — считает на сервере", () => {
    const result = resolvePaymentAmount({
      serviceType: "promotion_BUMP_7",
      amountRubles: 1,
    })
    expect(result).toEqual({
      ok: true,
      amountKopecks: 19_900,
      serviceType: "promotion_BUMP_7",
    })
  })

  it("поддерживает serviceType + durationDays", () => {
    expect(
      resolvePaymentAmount({ serviceType: "TURBO", durationDays: 3 }),
    ).toEqual({
      ok: true,
      amountKopecks: 29_900,
      serviceType: "promotion_TURBO_3",
    })
  })

  it("отклоняет неизвестный тариф", () => {
    expect(resolvePaymentAmount({ serviceType: "promotion_UNKNOWN_7" })).toMatchObject({
      ok: false,
    })
  })

  it("отклоняет произвольный serviceType без прайса", () => {
    expect(resolvePaymentAmount({ serviceType: "hack_100rub", amountRubles: 100 })).toMatchObject({
      ok: false,
    })
  })
})
