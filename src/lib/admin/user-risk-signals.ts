export type RiskLevel = "info" | "warning" | "danger"

export type UserRiskSignal = {
  level: RiskLevel
  message: string
}

type RiskInput = {
  trustTier: string | null | undefined
  accountRestricted: boolean
  isBanned: boolean
  lastLoginIp: string | null | undefined
  registrationIp: string | null | undefined
  siteVisitIps: (string | null | undefined)[]
  sessionCount: number
  uniqueVisitorIds?: number
}

export function computeUserRiskSignals(input: RiskInput): UserRiskSignal[] {
  const signals: UserRiskSignal[] = []

  if (input.isBanned) {
    signals.push({ level: "danger", message: "Аккаунт заблокирован" })
  }

  if (input.trustTier === "HIGH_RISK") {
    signals.push({ level: "danger", message: "Профиль помечен как HIGH_RISK" })
  } else if (input.trustTier === "MEDIUM_RISK") {
    signals.push({ level: "warning", message: "Профиль с повышенным риском (MEDIUM_RISK)" })
  }

  if (input.accountRestricted) {
    signals.push({ level: "warning", message: "На аккаунте действуют ограничения" })
  }

  const ips = [...new Set(input.siteVisitIps.filter(Boolean) as string[])]
  if (ips.length >= 6) {
    signals.push({
      level: "warning",
      message: `Много разных IP в активности (${ips.length})`,
    })
  }

  if (
    input.registrationIp &&
    input.lastLoginIp &&
    input.registrationIp !== input.lastLoginIp
  ) {
    signals.push({
      level: "info",
      message: "IP последнего входа отличается от IP регистрации",
    })
  }

  if (input.sessionCount >= 12) {
    signals.push({
      level: "info",
      message: `Много активных сессий (${input.sessionCount})`,
    })
  }

  if (input.uniqueVisitorIds !== undefined && input.uniqueVisitorIds >= 4) {
    signals.push({
      level: "warning",
      message: `Несколько visitor-id (${input.uniqueVisitorIds}) — возможны разные устройства или браузеры`,
    })
  }

  return signals
}
