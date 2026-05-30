import type { BadgeCode } from "@prisma/client"

export type BadgeDefinition = {
  title: string
  subtitle: string
  description: string
  icon: string
  priority: number
  /** Tailwind-классы для chip-варианта в профиле */
  chipClass: string
}

const CHIP = {
  zinc: "border-zinc-200 bg-zinc-50 text-zinc-700",
  sky: "border-sky-200 bg-sky-50 text-sky-800",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
  orange: "border-orange-200 bg-[hsl(var(--nashlo-orange)/0.08)] text-[hsl(var(--nashlo-orange))]",
  blue: "border-blue-200 bg-blue-50 text-blue-800",
  teal: "border-teal-200 bg-teal-50 text-teal-800",
  violet: "border-violet-200 bg-violet-50 text-violet-800",
  amber: "border-amber-200 bg-amber-50 text-amber-900",
} as const

/** Файлы в public/badges — PNG (не .svg). */
export const badgeMap: Record<BadgeCode, BadgeDefinition> = {
  BEGINNER: {
    title: "В начале пути",
    subtitle: "Вы недавно с нами",
    description:
      "Пользователь недавно зарегистрировался на Нашло и только начинает пользоваться платформой.",
    icon: "/badges/beginner.png",
    priority: 1,
    chipClass: CHIP.zinc,
  },
  FIRST_STEP: {
    title: "Первый шаг",
    subtitle: "Профиль заполнен",
    description: "Пользователь зарегистрировался на Нашло и полностью заполнил профиль.",
    icon: "/badges/pervii.png",
    priority: 5,
    chipClass: CHIP.sky,
  },
  VERIFIED: {
    title: "Проверен",
    subtitle: "Данные подтверждены",
    description: "Пользователь подтвердил контактные данные.",
    icon: "/badges/verified.png",
    priority: 10,
    chipClass: CHIP.emerald,
  },
  ACTIVE: {
    title: "Активный",
    subtitle: "Быстро отвечает",
    description:
      "Пользователь часто заходит на сайт, быстро отвечает и поддерживает объявления актуальными.",
    icon: "/badges/active.png",
    priority: 20,
    chipClass: CHIP.orange,
  },
  TRUSTED: {
    title: "Надёжный",
    subtitle: "Хорошая история",
    description: "У пользователя хорошая история, высокий рейтинг и нет жалоб.",
    icon: "/badges/trusted.png",
    priority: 30,
    chipClass: CHIP.blue,
  },
  SAFE_DEAL: {
    title: "Безопасная сделка",
    subtitle: "Оплата защищена",
    description: "Пользователь принимает оплату через безопасную сделку Нашло.",
    icon: "/badges/safe-deal.png",
    priority: 35,
    chipClass: CHIP.teal,
  },
  PRO: {
    title: "Профи",
    subtitle: "Проверенный специалист",
    description: "Профиль прошёл дополнительную проверку Нашло.",
    icon: "/badges/pro.png",
    priority: 40,
    chipClass: CHIP.violet,
  },
  PREMIUM: {
    title: "Премиум",
    subtitle: "Усиленный профиль",
    description: "У пользователя активен премиум-статус.",
    icon: "/badges/premium.png",
    priority: 50,
    chipClass: CHIP.amber,
  },
}

const CODE_TO_FILE: Record<BadgeCode, string> = {
  BEGINNER: "beginner.png",
  FIRST_STEP: "pervii.png",
  VERIFIED: "verified.png",
  ACTIVE: "active.png",
  TRUSTED: "trusted.png",
  SAFE_DEAL: "safe-deal.png",
  PRO: "pro.png",
  PREMIUM: "premium.png",
}

export function badgeChipClass(code: BadgeCode): string {
  return badgeMap[code]?.chipClass ?? CHIP.zinc
}

/** Имя файла в public/badges */
export function badgeAssetFile(code: BadgeCode): string {
  return CODE_TO_FILE[code] ?? "beginner.png"
}

/** URL для <img>: API (надёжно на проде) + fallback на /badges/ */
export function badgeIconUrl(code: BadgeCode): string {
  return `/api/badges/${badgeAssetFile(code)}`
}

/** Публичный URL иконки по коду (каталог важнее устаревшей записи в БД). */
export function resolveBadgeIcon(code: BadgeCode, _stored?: string | null): string {
  return badgeIconUrl(code)
}

export type PublicUserBadge = BadgeDefinition & {
  code: BadgeCode
}

export function sortBadgesByPriority(badges: PublicUserBadge[]): PublicUserBadge[] {
  return [...badges].sort((a, b) => b.priority - a.priority)
}

export function toPublicBadge(code: BadgeCode): PublicUserBadge {
  const def = badgeMap[code]
  return { ...def, code }
}
