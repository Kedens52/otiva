/** Ключ sessionStorage: после закрытия подсказка не показывается до конца сессии вкладки. */
export function mobileNashloHintSessionKey(scope: string, variant: NashloMobileHintVariant, slot: number): string {
  return `nashlo-hint-sess-${scope}-v${variant}-s${slot}`
}

export type NashloMobileHintVariant = 1 | 2 | 3 | 4

export const NASHLO_MOBILE_HINTS: Record<
  NashloMobileHintVariant,
  { title: string; description: string; cta: string; href?: string; dismissOnly?: boolean }
> = {
  1: {
    title: "Первые объявления — бесплатно",
    description: "Разместите объявление и получите первые отклики без лишних затрат.",
    cta: "Разместить",
    href: "/create",
  },
  2: {
    title: "Хотите больше просмотров?",
    description: "Поднимите объявление или выделите его цветом.",
    cta: "Продвинуть",
    href: "/profile/promotion",
  },
  3: {
    title: "Нашло развивается поэтапно",
    description: "Сейчас — удобные объявления для людей, дальше — больше возможностей.",
    cta: "Понятно",
    dismissOnly: true,
  },
  4: {
    title: "Бесплатный лимит",
    description: "Первые объявления доступны бесплатно. Для большего количества появятся тарифы.",
    cta: "Подробнее",
    href: "/pricing",
  },
}

/** Порядок подсказок для слотов; вариант 2 — только при активных объявлениях. */
export function hintVariantPool(hasActiveListings: boolean | null): NashloMobileHintVariant[] {
  if (hasActiveListings === true) return [1, 2, 4, 3]
  return [1, 4, 3]
}

export function isHintDismissedSession(key: string): boolean {
  if (typeof window === "undefined") return false
  return sessionStorage.getItem(key) === "1"
}

export function dismissHintSession(key: string) {
  if (typeof window === "undefined") return
  sessionStorage.setItem(key, "1")
}
