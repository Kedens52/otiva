/** Серверный прайс (копейки). Сумму с фронта принимаем только для пополнения кошелька. */
const PROMOTION_RUB: Record<string, Record<number, number>> = {
  BUMP: { 1: 49, 3: 99, 7: 199 },
  HIGHLIGHT: { 3: 79, 7: 149 },
  PIN: { 1: 149, 3: 299, 7: 499 },
  TURBO: { 3: 299, 7: 499 },
}

const WALLET_MIN_RUB = 100
const WALLET_MAX_RUB = 500_000

export type ResolvePaymentInput = {
  serviceType: string
  amountRubles?: number
  durationDays?: number
}

export type ResolvePaymentResult =
  | { ok: true; amountKopecks: number; serviceType: string }
  | { ok: false; error: string }

function isWalletService(serviceType: string) {
  return serviceType.toLowerCase().includes("wallet")
}

/** promotion_BUMP_7 или listing_promotion_BUMP_7 */
function parsePromotionService(serviceType: string): { kind: string; days: number } | null {
  const m = serviceType.match(/(?:promotion[_-])?(BUMP|HIGHLIGHT|PIN|TURBO)[_-](\d+)/i)
  if (!m) return null
  return { kind: m[1].toUpperCase(), days: Number(m[2]) }
}

export function resolvePaymentAmount(input: ResolvePaymentInput): ResolvePaymentResult {
  const serviceType = input.serviceType.trim()
  if (!serviceType) {
    return { ok: false, error: "Укажите тип услуги" }
  }

  if (isWalletService(serviceType)) {
    const rubles = input.amountRubles
    if (rubles == null || !Number.isInteger(rubles)) {
      return { ok: false, error: "Укажите сумму пополнения" }
    }
    if (rubles < WALLET_MIN_RUB || rubles > WALLET_MAX_RUB) {
      return {
        ok: false,
        error: `Сумма пополнения от ${WALLET_MIN_RUB} до ${WALLET_MAX_RUB.toLocaleString("ru-RU")} ₽`,
      }
    }
    return { ok: true, amountKopecks: rubles * 100, serviceType: "wallet_topup" }
  }

  const promo = parsePromotionService(serviceType)
  if (promo) {
    const rub = PROMOTION_RUB[promo.kind]?.[promo.days]
    if (rub == null) {
      return { ok: false, error: "Неизвестный тариф продвижения" }
    }
    return {
      ok: true,
      amountKopecks: rub * 100,
      serviceType: `promotion_${promo.kind}_${promo.days}`,
    }
  }

  if (input.durationDays && /^[A-Z_]+$/i.test(serviceType)) {
    const kind = serviceType.toUpperCase()
    const rub = PROMOTION_RUB[kind]?.[input.durationDays]
    if (rub != null) {
      return {
        ok: true,
        amountKopecks: rub * 100,
        serviceType: `promotion_${kind}_${input.durationDays}`,
      }
    }
  }

  return { ok: false, error: "Недопустимый тип платежа или сумма" }
}
